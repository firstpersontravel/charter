const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const TestUtil = require('../util');

const examplePath = path.join(__dirname, '../../examples/blank.yaml');
const example = yaml.safeLoad(fs.readFileSync(examplePath, 'utf8'));

describe('BlankExample', () => {

  beforeEach(async () => {
    await TestUtil.createExample(example);
  });

  it('loads correctly', async () => {});
});
