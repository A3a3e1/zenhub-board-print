function splitUrl(url) {
  const splitDelimiter = '&';
  return url.split(splitDelimiter)
}

function sliceUrl(line) {
  const indexOfWord = 'repos=';
  return line.slice(line.indexOf(indexOfWord) + indexOfWord.length);
}

module.exports = function (url) {
  const splitRepos = splitUrl(url);
  if (splitRepos) {
    for (let i = 0, len = splitRepos.length; i < len; i++) {
      if (splitRepos[i].includes('repos=')) {
        return sliceUrl(splitRepos[i]).split(",");
      }
    }
  }
  return null;
};
