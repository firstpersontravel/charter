var _ = require('lodash');

var EvalCore = require('../../eval');

var set_value = {
  params: {
    value_ref: { required: true, type: 'ref' },
    new_value_ref: { required: true, type: 'ref' }
  },
  phraseForm: ['value_ref', 'new_value_ref'],
  applyAction: function(script, context, params, applyAt) {
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
};

var increment_value = {
  params: {
    value_ref: { required: true, type: 'ref' },
    delta: { required: false, type: 'number' }
  },
  phraseForm: ['value_ref', 'delta'],
  applyAction: function(script, context, params, applyAt) {
    var valueRef = params.value_ref;
    var existingValue = Number(_.get(context, valueRef) || 0);
    var newValue = existingValue + (parseFloat(params.delta, 10) || 1);
    var setValueParams = { value_ref: valueRef, new_value_ref: newValue };
    return set_value.applyAction(script, context, setValueParams);
  }
};

module.exports = {
  set_value: set_value,
  increment_value: increment_value
};
