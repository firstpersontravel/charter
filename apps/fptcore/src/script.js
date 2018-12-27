var _ = require('lodash');
var moment = require('moment');

var ActionsRegistry = require('./registries/actions');
var ActionPhraseCore = require('./action_phrase');
var ActionValidationCore = require('./action_validation');
var EventsRegistry = require('./registries/events');
var ParamValidators = require('./param_validators');
var TextCore = require('./text');
var distance = require('./distance');
var WaypointCore = require('./waypoint');

var ScriptCore = {};

// These keys have actions inside them.
var ACTION_KEYS = ['actions', 'else', 'elseifs'];

var UNQUOTED_WORD_REGEX = /^[\w._-]+$/i;

ScriptCore.SCRIPT_DEPENDENCY_TREE = {
  checkpoints: { scene: 'scenes' },
  cues: { scene: 'scene' }, // <-- WARNING THIS ONE IS IMPLICIT
  geofences: { center: 'waypoints' },
  initiatives: { scene: 'scenes' },
  pages: {
    appearance: 'appearances',
    waypoint: 'waypoints',
    route: 'routes',
    role: 'roles',
    scene: 'scenes'
  },
  messages: { scene: 'scenes', from: 'roles', to: 'roles' },
  appearances: { role: 'roles' },
  relays: { for: 'roles', as: 'roles', with: 'roles' },
  roles: { starting_page: 'pages', default_layout: 'layouts' },
  routes: { from: 'waypoints', to: 'waypoints' },
  triggers: { scene: 'scenes' },
  variants: { variant_group: 'variant_groups' }
};

ScriptCore.gatherPhrase = function(actionPhrase, path, actions, warnings) {
  var modifierAndAction = ActionPhraseCore.extractModifier(actionPhrase);
  var plainActionPhrase = modifierAndAction[2];
  if (plainActionPhrase.replace(/[^"]/g, '').length % 2 === 1) {
    warnings.push(path + ': unpaired quotes in "' + actionPhrase + '".');
    return;
  }
  var words = TextCore.splitWords(plainActionPhrase);
  for (var i = 0; i < words.length; i++) {
    var word = words[i];
    if (word[0] === '"') {
      // Quoted phrases are ok.
    } else {
      if(!UNQUOTED_WORD_REGEX.test(word)) {
        warnings.push(path + ': invalid unquoted word "' + word + '" in "' + actionPhrase + '".');
        return;
      }
    }
  }
  var now = moment.utc();
  var action = ActionPhraseCore.expandActionPhrase(actionPhrase, now, {});
  actions.push({ path: path, action: action });
};

ScriptCore.gatherInnerActions = function(obj, path, actions, warnings) {
  if (_.isString(obj)) {
    ScriptCore.gatherPhrase(obj, path, actions, warnings);
    return;
  }
  if (_.isArray(obj)) {
    obj.forEach(function(item, i) {
      ScriptCore.gatherInnerActions(item, path + '[' + i + ']', actions,
        warnings);
    });
    return;
  }
  if (_.isObject(obj)) {
    Object.keys(obj).forEach(function(key) {
      if (_.includes(ACTION_KEYS, key)) {
        ScriptCore.gatherInnerActions(obj[key], path + '.' + key, actions,
          warnings);
      }
    });
  }
};

ScriptCore.gatherChildActions = function(obj, path, actions, warnings) {
  if (_.isArray(obj)) {
    obj.forEach(function(item, i) {
      var itemPath = path + '[' + (item.name ? 'name=' + item.name : i) + ']';
      ScriptCore.gatherChildActions(item, itemPath, actions, warnings);
    });
    return;
  }
  if (_.isObject(obj)) {
    Object.keys(obj).forEach(function(key) {
      var keyPath = path + '.' + key;
      if (_.includes(ACTION_KEYS, key)) {
        ScriptCore.gatherInnerActions(obj[key], keyPath, actions, warnings);
      } else {
        ScriptCore.gatherChildActions(obj[key], keyPath, actions, warnings);
      }
    });
  }
};

ScriptCore.gatherEventWarnings = function(script, event) {
  if (!event) {
    return ['Empty event.'];
  }
  var eventType = Object.keys(event)[0];
  if (!eventType) {
    return ['No event type.'];
  }
  var eventSpec = EventsRegistry[eventType];
  var eventParams = event[eventType];
  if (!eventSpec) {
    return ['Invalid event type "' + eventType + '".'];
  }
  if (!eventSpec.specParams) {
    return [];
  }
  var warnings = [];
  // Check for required params
  Object.keys(eventSpec.specParams).forEach(function(paramName) {
    var paramSpec = eventSpec.specParams[paramName];
    var param = paramName === 'self' ? eventParams : eventParams[paramName];
    if (_.isUndefined(param)) {
      if (paramSpec.required) {
        warnings.push('Required param "' + paramName + '" not present.');
      }
    } else {
      var paramValidator = ParamValidators[paramSpec.type];
      if (!paramValidator) {
        warnings.push('Invalid param type "' + paramSpec.type + '".');
        return;
      }
      var paramWarning = paramValidator(script, paramName, paramSpec, param);
      if (paramWarning) {
        warnings.push(paramWarning);
      }
    }
  });
  // Check for unexpected params
  if (_.isObject(eventParams)) {
    Object.keys(eventParams).forEach(function(paramName) {
      if (!eventSpec.specParams[paramName]) {
        warnings.push('Unexpected param "' + paramName + '".');
      }
    });
  }
  return warnings;
};

ScriptCore.gatherTriggerActions = function(script, trigger, path, warnings) {
  var actions = [];
  ScriptCore.gatherChildActions(trigger, path, actions, warnings);
  return actions;
};

ScriptCore.gatherTriggerWarnings = function(script, trigger, path, warnings) {
  var actions = ScriptCore.gatherTriggerActions(script, trigger, path,
    warnings);
  actions.forEach(function(action) {
    // Check validations
    var actionWarnings = ActionValidationCore.precheckAction(
      script, action.action, trigger);
    warnings.push.apply(warnings, actionWarnings.map(function(warning) {
      return action.path + ' (' + action.action.name + '): ' + warning;
    }));
  });

  var events = _.isArray(trigger.event) ? trigger.event : [trigger.event];
  events.forEach(function(eventItem) {
    if (!eventItem) {
      return;
    }
    var eventWarnings = ScriptCore.gatherEventWarnings(script, eventItem);
    warnings.push.apply(warnings, eventWarnings.map(function(warning) {
      return path + '.event[type=' + Object.keys(eventItem)[0] + ']: ' + warning;
    }));
  });
};

ScriptCore.gatherScriptTriggerWarnings = function(script, warnings) {
  var triggers = script.content.triggers || [];
  triggers.forEach(function(trigger, i) {
    var triggerPath = trigger.name ?
      'triggers[name=' + trigger.name + ']' :
      'triggers[' + i + ']';
    ScriptCore.gatherTriggerWarnings(script, trigger, triggerPath, warnings);
  });
};

ScriptCore.gatherActions = function(script) {
  var triggers = script.content.triggers || [];
  return _(triggers)
    .map(function(trigger) {
      return ScriptCore
        .gatherTriggerActions(script, trigger, '', [])
        .map(function(action) {
          return Object.assign(action, {
            triggerScene: trigger.scene,
            triggerName: trigger.name
          });
        });
    })
    .flatten()
    .value();
};

ScriptCore.gatherDependencyWarnings = function(script, warnings) {
  _.each(ScriptCore.SCRIPT_DEPENDENCY_TREE, function(relations, collectionName) {
    var collection = script.content[collectionName] || [];
    collection.forEach(function(item, i) {
      var itemPath = collectionName + '[' +
        (item.name ? ('name=' + item.name) : i) + ']';
      _.each(relations, function(relationCollectionName, relationKey) {
        var depName = item[relationKey];
        if (!depName) {
          return;
        }
        var depCollection = script.content[relationCollectionName] || [];
        if (!_.find(depCollection, { name: depName })) {
          warnings.push(itemPath + ': No "' + depName +
            '" in ' + relationCollectionName + '.');
        }
      });
    });
  });
};

/**
 * Check an entire script for warnings.s
 */
ScriptCore.gatherScriptWarnings = function(script) {
  var warnings = [];
  ScriptCore.gatherScriptTriggerWarnings(script, warnings);
  ScriptCore.gatherDependencyWarnings(script, warnings);
  return warnings;
};

/**
 * List of implicit references.
 */
ScriptCore.IMPLICIT_COLLECTION_NAMES = ['cues'];

/**
 * Gather implicit references
 */
ScriptCore.gatherImplicitResources = function(script) {
  // Right now only ones are cues.
  var cues = [];
  var actions = ScriptCore.gatherActions(script);
  actions.forEach(function(action) {
    Object.keys(action.action.params).forEach(function(paramName) {
      var paramSpec = ActionsRegistry[action.action.name].params[paramName];
      if (paramSpec.type === 'cue_name') {
        cues.push({
          name: action.action.params[paramName],
          scene: action.triggerScene
        });
      }
    });
  });
  script.content.triggers.forEach(function(trigger) {
    var events = _.isArray(trigger.event) ? trigger.event : [trigger.event];
    events.forEach(function(event) {
      var eventType = Object.keys(event)[0];
      var eventParams = event[eventType];
      var eventParamsObj = _.isObject(eventParams) ? eventParams :
        { self: eventParams };
      Object.keys(eventParamsObj).forEach(function(paramName) {
        var paramSpec = EventsRegistry[eventType].specParams[paramName];
        if (paramSpec.type === 'cue_name') {
          cues.push({
            name: eventParamsObj[paramName],
            scene: trigger.scene
          });
        }
      });
    });
  });
  return {
    cues: _(cues).uniqBy('name').sortBy('name').value()
  };
};

/**
 * Get all geofences overlapping an area.
 */
ScriptCore.geofencesInArea = function(scriptContent, latitude, longitude,
  accuracy, waypointOptions) {
  if (!latitude || !longitude) {
    return [];
  }
  var geofences = scriptContent.geofences || [];
  return _.filter(geofences, function(geofence) {
    var waypointOption = WaypointCore.optionForWaypoint(scriptContent,
      geofence.center, waypointOptions);
    var dist = distance(latitude, longitude,
      waypointOption.coords[0], waypointOption.coords[1]);
    return dist - accuracy <= geofence.distance;
  });
};

module.exports = ScriptCore;
