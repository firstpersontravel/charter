var ResourcesRegistry = require('../registries/resources');
var SpecValidationCore = require('./spec_validation');

var ResourceValidationCore = {};

ResourceValidationCore.getResourceWarnings = function(script, resourceType, resource) {
  var resourceClass = ResourcesRegistry[resourceType];
  var resourceParamsSpec = resourceClass.properties;
  return SpecValidationCore.getWarnings(script, resourceParamsSpec, resource);
};

module.exports = ResourceValidationCore;
