const models = require('../models');

const ScriptController = {};

ScriptController.resetScript = async (scriptName, fields) => {
  const script = await models.Script.find({ where: { name: scriptName } });
  if (!script) {
    return models.Script.create(fields);
  }
  return await script.update(fields);
};

module.exports = ScriptController;
