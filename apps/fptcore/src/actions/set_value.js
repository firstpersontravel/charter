var _ = require('lodash');

var EvalCore = require('../eval');

function setValue(script, context, params, applyAt) {
  var newValue = EvalCore.lookupRef(context, params.new_value_ref);

  // Check if we're setting the value on a player
  var roleNames = _.map(script.content.roles, 'name');
  var isPlayer = _.includes(roleNames, params.value_ref.split('.')[0]);

  // If we are, set on the player.
  if (isPlayer) {
    var roleName = params.value_ref.split('.')[0];
    var playerValueRef = params.value_ref.split('.').slice(1).join('.');
    return [{
      operation: 'updatePlayer',
      roleName: roleName,
      updates: { values: _.set({}, playerValueRef, { $set: newValue }) }
    }];
  }
  // Otherwise it's a trip value.
  return [{
    operation: 'updateTrip',
    updates: { values: _.set({}, params.value_ref, { $set: newValue }) }
  }];
}

setValue.phraseForm = ['value_ref', 'new_value_ref'];

setValue.params = {
  value_ref: { required: true, type: 'ref' },
  new_value_ref: { required: true, type: 'ref' }
};

module.exports = setValue;
