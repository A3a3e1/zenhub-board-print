const getReposId = require('../../utils/zenhubUrl');
let { expect } = require('chai');

const url = 'https://app.zenhub.com/workspaces/ps-development-59bbb52d21e82e515786af83/board?filterLogic=any&repos=45459207,41149571,103647955,102373760,43441337,78742580,39841773,65219644,125880571,46574047,129734571,133692117,22353081,136196401,71900318,152048485,141156240,152262440,152273010,147668388,155363942,155369859,57286024,156564021,135702291,159474329,160792105,159503619,54977343,176733141,86081748,64212637,183007946,182645543,112731771,78765269,188184267&showPRs=false&showPipelineDescriptions=false';

describe('IDs array parse', function () {
  it('should be an array', () => {
    const newUrl = getReposId(url);
    expect(newUrl).to.be.an('array');
  });

  it('should have more than one item', () => {
    const newUrl = getReposId(url);
    expect(newUrl).to.be.have.lengthOf.above(3);
  });
});
