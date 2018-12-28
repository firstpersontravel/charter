var _ = require('lodash');
var moment = require('moment');

var ActionPhraseCore = require('./action_phrase');
var ActionValidationCore = require('./action_validation');
var EventsRegistry = require('../registries/events');
var ResourceRegistry = require('../registries/resources');
var ParamValidators = require('../utils/param_validators');
var TextCore = require('./text');

var ScriptValidationCore = {};

// These keys have actions inside them.
var ACTION_KEYS = ['actions', 'else', 'elseifs'];

var UNQUOTED_WORD_REGEX = /^[\w._-]+$/i;

ScriptValidationCore.SCRIPT_DEPENDENCY_TREE = {
  checkpoints: { scene: 'scenes' },
  cues: { scene: 'scenes' },
  geofences: { center: 'waypoints' },
  achievements: { scene: 'scenes' },
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

function gatherPhrase(actionPhrase, path, actions, warnings) {
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
}

function gatherInnerActions(obj, path, actions, warnings) {
  if (_.isString(obj)) {
    gatherPhrase(obj, path, actions, warnings);
    return;
  }
  if (_.isArray(obj)) {
    obj.forEach(function(item, i) {
      gatherInnerActions(item, path + '[' + i + ']', actions, warnings);
    });
    return;
  }
  if (_.isObject(obj)) {
    Object.keys(obj).forEach(function(key) {
      if (_.includes(ACTION_KEYS, key)) {
        gatherInnerActions(obj[key], path + '.' + key, actions, warnings);
      }
    });
  }
}

function gatherChildActions(obj, path, actions, warnings) {
  if (_.isArray(obj)) {
    obj.forEach(function(item, i) {
      var itemPath = path + '[' + (item.name ? 'name=' + item.name : i) + ']';
      gatherChildActions(item, itemPath, actions, warnings);
    });
    return;
  }
  if (_.isObject(obj)) {
    Object.keys(obj).forEach(function(key) {
      var keyPath = path + '.' + key;
      if (_.includes(ACTION_KEYS, key)) {
        gatherInnerActions(obj[key], keyPath, actions, warnings);
      } else {
        gatherChildActions(obj[key], keyPath, actions, warnings);
      }
    });
  }
}

function gatherEventWarnings(script, event) {
  if (!event) {
    return ['Empty event.'];
  }
  var eventType = Object.keys(event)[0];
  if (!eventType) {
    return ['No event type.'];
  }
  var eventSpec = EventsRegistry[eventType];
  if (!eventSpec) {
    return ['Invalid event type "' + eventType + '".'];
  }
  var eventParams = event[eventType];
  return ParamValidators.validateParams(script, eventSpec.specParams,
    eventParams, '');
}

function gatherTriggerActions(script, trigger, path, warnings) {
  var actions = [];
  gatherChildActions(trigger, path, actions, warnings);
  return actions;
}

function gatherTriggerWarnings(script, trigger, path, warnings) {
  var actions = gatherTriggerActions(script, trigger, path, warnings);
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
    var eventWarnings = gatherEventWarnings(script, eventItem);
    warnings.push.apply(warnings, eventWarnings.map(function(warning) {
      return path + '.event[type=' + Object.keys(eventItem)[0] + ']: ' + warning;
    }));
  });
}

function gatherScriptTriggerWarnings(script, warnings) {
  var triggers = script.content.triggers || [];
  triggers.forEach(function(trigger, i) {
    var triggerPath = trigger.name ?
      'triggers[name=' + trigger.name + ']' :
      'triggers[' + i + ']';
    gatherTriggerWarnings(script, trigger, triggerPath, warnings);
  });
}

ScriptValidationCore.gatherActions = function(script) {
  var triggers = script.content.triggers || [];
  return _(triggers)
    .map(function(trigger) {
      var actions = gatherTriggerActions(script, trigger, '', []);
      return actions.map(function(action) {
        return Object.assign(action, {
          triggerScene: trigger.scene,
          triggerName: trigger.name
        });
      });
    })
    .flatten()
    .value();
};

// TODO: ONCE ALL RESOURCES ARE REPRESENTED IN MODULES, WE SHOULD BE ABLE
// TO DO THIS IN A SMARTER WAY.
function gatherDependencyWarnings(script, warnings) {
  _.each(ScriptValidationCore.SCRIPT_DEPENDENCY_TREE, function(relations, collectionName) {
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
}

/**
 * Gather warnings for resources.
 */
function gatherResourceWarnings(script, warnings) {
  _.each(ResourceRegistry, function(resourceClass, resourceType) {
    // Get the collection for all resources
    var collectionName = resourceType === 'audio' ?
      resourceType : resourceType + 's';
    // Go through each
    _.each(script.content[collectionName], function(resource) {
      // And validate
      var resourceWarnings = ParamValidators.validateResource(script,
        resourceClass, resource);
      // Logging warnings
      warnings.push.apply(warnings, resourceWarnings.map(function(warning) {
        var resourceNameString = resource.name ? ('[name=' + resource.name + ']') : '';
        return resourceType + resourceNameString + ': ' + warning;
      }));
    });
  });
}

/**
 * Check an entire script for warnings.s
 */
ScriptValidationCore.gatherScriptWarnings = function(script) {
  var warnings = [];
  gatherResourceWarnings(script, warnings);
  gatherScriptTriggerWarnings(script, warnings);
  gatherDependencyWarnings(script, warnings);
  return warnings;
};

module.exports = ScriptValidationCore;
