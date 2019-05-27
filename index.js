const componentLogger = require('@elastic.io/component-logger');
const axios = require('axios');
const dotenv = require('dotenv');
const { query } = require('./graphql');
const getReposId = require('./utils/zenhubUrl');
const _ = require('lodash');
const handlebars = require('handlebars');
let fs = require('fs');

// Save env.vars form .env file into process.env
dotenv.config();

const LOGGER = componentLogger('batch-component');

// CONFIGURE THIS =================================================================================
const MILESTONE = 'Sprint #17';
const OWNER = 'elasticio';
const URL = 'https://app.zenhub.com/workspaces/ps-development-59bbb52d21e82e515786af83/board?repos=45459207,41149571,103647955,102373760,43441337,78742580,39841773,65219644,125880571,46574047,129734571,133692117,22353081,136196401,71900318,152048485,141156240,152262440,152273010,147668388,155363942,155369859,57286024,156564021,135702291,159474329,160792105,159503619,54977343,176733141,86081748,64212637,183007946,182645543,112731771,78765269,188184267&showPRs=false&showPipelineDescriptions=false';
// ================================================================================================

const ZENHUB_API_URL = 'https://api.zenhub.io';
const GITHUB_GRAPGHQL_API_URL = 'https://api.github.com/graphql';
const ZENHUB_API_KEY = process.env.API_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const requestZenhub = axios.create({
  baseURL: ZENHUB_API_URL,
  headers: {
    'X-Authentication-Token': ZENHUB_API_KEY,
  },
});

const requestGithub = axios.create({
  baseURL: GITHUB_GRAPGHQL_API_URL,
  headers: {
    'Authorization': `bearer ${GITHUB_TOKEN}`,
  },
});

/**
 * Returns all the issues for a given repository an a Zenhub Board style
 * @param repoId
 * @returns {Promise<void>}
 */
async function getZenhubBoardRepo(repoId) {
  const { pipelines } = (await requestZenhub.get(`/p1/repositories/${repoId}/board`)).data;
  let issues = [];
  for (let i = 0, len1 = pipelines.length; i < len1; i++) {
    for (let j = 0, len2 = pipelines[i].issues.length; j < len2; j++) {
      let issue = {
        repoId: repoId,
        issueNumber: pipelines[i].issues[j].issue_number,
        isEpic: pipelines[i].issues[j].is_epic,
        position: pipelines[i].issues[j].position,
        estimate: pipelines[i].issues[j].estimate ? pipelines[i].issues[j].estimate.value : '',
        pipeline: pipelines[i].name
      };
      issues.push(issue);
    }
  }
  return issues;
}

/**
 * Returns an array of all issues for a given repository
 * @param repoName
 * @returns {Promise<Array>}
 */
async function getGitHubRepoIssuesDetails(repoName) {
  let issues = [];
  let first = 100;
  let afterConstruction = "";
  let data;
  let dataChunk;
  do {
    dataChunk = (await requestGithub.post(`${GITHUB_GRAPGHQL_API_URL}`,
      JSON.stringify({
        query: query.fetchRepoIssues(OWNER,
          repoName,
          first,
          afterConstruction)
      }))).data.data;

    // In case there are NO issues in the repository
    if (dataChunk.repository === null
      || dataChunk.repository.issues.edges.length === 0) return [];

    afterConstruction = 'after: "'
      + dataChunk.repository.issues.edges[dataChunk.repository.issues.edges.length - 1].cursor
      + '"';

    if (data === undefined) {
      data = dataChunk;
    } else {
      Array.prototype.push.apply(data.repository.issues.edges, dataChunk.repository.issues.edges);
    }
  }
  while (dataChunk.repository.issues.pageInfo.hasNextPage !== false);

  if (data.repository === null) return [];

  for (let i = 0, len = data.repository.issues.edges.length; i < len; i++) {
    if (data.repository.issues.edges[i].node.milestone !== null
      && data.repository.issues.edges[i].node.milestone.title === MILESTONE) {

      let issue = {
        number: data.repository.issues.edges[i].node.number,
        title: data.repository.issues.edges[i].node.title,
        repository: data.repository.issues.edges[i].node.repository.name,
        milestone: data.repository.issues.edges[i].node.milestone.title
      };

      // Concat assignees to a single line instead of an array
      let assignee = '';
      if (data.repository.issues.edges[i].node.assignees.nodes.length > 0) {
        for (let j = 0, len1 = data.repository.issues.edges[i].node.assignees.nodes.length; j < len1; j++) {
          assignee += data.repository.issues.edges[i].node.assignees.nodes[j].name + ' ';
        }
      }
      issue.assignees = assignee;
      issues.push(issue);
    }
  }
  return issues;
}

// Returns repo name by its ID
async function getRepoNameById(repoId) {
  const first = 100;
  let after = '';
  let repositories;
  do {
    repositories = (await requestGithub.post(`${GITHUB_GRAPGHQL_API_URL}`,
      JSON.stringify({
        query: query.fetchOrgRepos(OWNER,
          first,
          after)
      }))).data.data.organization.repositories;
    after = repositories.edges[repositories.edges.length - 1].cursor;
    for (let i = 0, len = repositories.edges.length; i < len; i++) {
      if (repositories.edges[i].node.databaseId.toString() === repoId.toString()) {
        return repositories.edges[i].node.name;
      }
    }
  }
  while (repositories.pageInfo.hasNextPage !== false);
}

/**
 * Takes 2 arrays and merge them on the same value (issueNumber-number)
 * @param zenhubIssue
 * @param githubIssue
 * @returns {Promise<Array>}
 */
async function enrichGithubIssues(githubIssue, zenhubIssue) {
  return _.map(githubIssue, function (item) {
    return _.extend(item, _.find(zenhubIssue, { issueNumber: item.number }));
  });
}

async function processTemplate(issue) {
  // get your data into a variable
  let compiledIssue;

  // read the file and use the callback to render
  await fs.readFile('./templates/issue.hbs', async function (err, data) {
    if (!err) {
      // make the buffer into a string
      let source = data.toString();
      // call the render function
      compiledIssue = await renderToString(source, issue);

      // Write compiled content to a file
      fs.writeFileSync("./cards/" + issue.repository + "_issue" + issue.issueNumber + '.htm',
        compiledIssue,
        function (err) {
          if (err) {
            return LOGGER.error('Error while trying to write file.', err);
          }
          LOGGER.info("The file was saved!");
        });
      return compiledIssue;
    } else {
      LOGGER.error('Error while trying to create HBS template.', err);
    }
  });

  // this will be called after the file is read
  async function renderToString(source, data) {
    let template = handlebars.compile(source);
    compiledIssue = template(data);
    return compiledIssue;
  }
}

async function start() {
  const getBoardListOfReposToFetch = getReposId(URL);
  // Full list of all issues for all repositories on the board
  let generalIssueList = [];

  for (let i = 0, len = getBoardListOfReposToFetch.length; i < len; i++) {
    let repoId = getBoardListOfReposToFetch[i];

    let repoName = await getRepoNameById(getBoardListOfReposToFetch[i]);

    let zenHubIssues = await getZenhubBoardRepo(repoId);

    let gitHubIssues = await getGitHubRepoIssuesDetails(repoName);

    let fullIssueList = await enrichGithubIssues(gitHubIssues, zenHubIssues);

    generalIssueList.push(fullIssueList);
  }

  // Processing all issues
  for (let i = 0, len1 = generalIssueList.length; i < len1; i++) {
    for (let j = 0, len2 = generalIssueList[i].length; j < len2; j++) {
      await processTemplate(generalIssueList[i][j]);
    }
  }
}

start();
