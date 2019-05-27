module.exports = function getFetchRepoIssuesQuery(owner, repoName, first, afterConstruction) {
  return `{
  repository(owner: "${owner}", name: "${repoName}") {
    issues(first: ${first} ${afterConstruction}) {
      pageInfo {
        hasNextPage
      }
      edges {
        node {
          title
          number,
          milestone {
            title,
            number
          },
          repository {
            name
          },
          assignees(first: 25) {
            nodes {
              name
            }
          },
          labels(first: 25) {
            nodes {
              name
            }
          },
        }
        cursor
      }
    }
  }
}`
};
