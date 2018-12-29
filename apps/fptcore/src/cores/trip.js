var _ = require('lodash');
var moment = require('moment');

var TimeUtil = require('../utils/time');

var TripCore = {};

/**
 * Get variants are active given a list of variant names.
 * Do default ones first, then non-defaults (non-defaults override defaults).
 */
TripCore._getActiveVariants = function(script, variantNames) {
  return _(script.content.variants)
    .filter(function(variant) {
      if (variant.default) {
        return true;
      }
      if (_.includes(variantNames, variant.name)) {
        return true;
      }
      return false;
    })
    .sortBy(['default', 'name'])
    .value();
};

/**
 * Get initial fields for a trip from variants.
 */
TripCore.getInitialFields = function(script, date, timezone, variantNames) {
  var fields = {
    customizations: {},
    values: {},
    waypointOptions: {},
    schedule: {}
  };
  var variants = TripCore._getActiveVariants(script, variantNames);  
  variants.forEach(function(variant) {
    if (variant.customizations) {
      _.assign(fields.customizations, variant.customizations);
    }
    if (variant.waypoint_options) {
      _.assign(fields.waypointOptions, variant.waypoint_options);
    }
    if (variant.initial_values) {
      _.assign(fields.values, variant.initial_values);
    }
    if (variant.schedule) {
      var day = moment(date).format('YYYY-MM-DD');
      Object.keys(variant.schedule).forEach(function(key) {
        fields.schedule[key] = TimeUtil.convertTimeShorthandToIso(
          variant.schedule[key], day, timezone);
      });
    }
  });
  return fields;
};

module.exports = TripCore;
