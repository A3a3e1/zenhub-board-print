module.exports = function getOrgReposQuery(owner, first, after) {
  return `{
  organization(login: "${owner}") {
    repositories(first: ${first} after: "${after}") {
      pageInfo {
        hasNextPage
      }
      edges {
        node {
          databaseId,
          name
        }
        cursor
      }
    }
  }
}`
};
