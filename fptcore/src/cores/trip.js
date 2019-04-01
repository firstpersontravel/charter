var _ = require('lodash');
var moment = require('moment');

var TimeUtil = require('../utils/time');

class TripCore {
  /**
   * Get variants are active given a list of variant names.
   * Do default ones first, then non-defaults (non-defaults override defaults).
   */
  static _getActiveVariants(scriptContent, variantNames) {
    return _(scriptContent.variants)
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
  }

  /**
   * Get initial fields for a trip from variants.
   */
  static getInitialFields(scriptContent, date, timezone, variantNames) {
    var fields = {
      customizations: {},
      values: {},
      waypointOptions: {},
      schedule: {}
    };
    var variants = this._getActiveVariants(scriptContent, variantNames);  
    variants.forEach((variant) => {
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
        Object.keys(variant.schedule).forEach((key) => {
          fields.schedule[key] = TimeUtil.convertTimeShorthandToIso(
            variant.schedule[key], day, timezone);
        });
      }
    });
    return fields;
  }
}

module.exports = TripCore;
