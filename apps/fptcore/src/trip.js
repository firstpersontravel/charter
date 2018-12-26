var _ = require('lodash');
var moment = require('moment');

var TimeCore = require('./time');

var TripCore = {};

TripCore.getInitialValues = function (script, variantNames) {
  var values = {};
  var variantNamesWithDefault = ['default'].concat(variantNames);
  var variants = script.content.variants || [];
  variantNamesWithDefault.forEach(function(variantName) {
    var variant = _.find(variants, { name: variantName });
    if (!variant || !variant.values) {
      return;
    }
    _.extend(values, variant.values);
  });
  return values;
};

TripCore.getInitialSchedule = function (script, date, variantNames) {
  var schedule = {};
  var variantNamesWithDefault = ['default'].concat(variantNames);
  var variants = script.content.variants || {};
  variantNamesWithDefault.forEach(function(variantName) {
    var variant = _.find(variants, { name: variantName });
    if (!variant || !variant.schedule) {
      return;
    }
    var day = moment(date).format('YYYY-MM-DD');
    Object.keys(variant.schedule).forEach(function(key) {
      schedule[key] = TimeCore.convertTimeShorthandToIso(
        variant.schedule[key], day, script.timezone);
    });
  });
  return schedule;
};

module.exports = TripCore;
