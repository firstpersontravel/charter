const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const exampleRoute = async (req, res) => {
  const exName = req.params.exampleName;
  const exPath = path.join(__dirname, `../../examples/${exName}.yaml`);
  if (!fs.existsSync(exPath)) {
    res.status(404);
    res.send('Not found');
    return;
  }
  const exData = yaml.safeLoad(fs.readFileSync(exPath, 'utf8'));
  res.json(exData);
};

module.exports = {
  exampleRoute: exampleRoute
};
