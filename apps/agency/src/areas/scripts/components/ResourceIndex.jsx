import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import yaml from 'js-yaml';

import {
  ActionsRegistry,
  ActionPhraseCore,
  EventsRegistry,
  TriggerCore,
  TextUtil
} from 'fptcore';

import { COLLECTION_NAMES } from '../consts';
import { getItems } from './utils';
import Param, { renderLink } from '../../common/partials/Param';

const PROP_ORDERING = [
  'name',
  'section',
  'title',
  'scene',
  'page',
  'appearance',
  'role',
  'type',
  'cue',
  'if',
  'event',
  'actions',
  'for',
  'with',
  'as'
];

const REVERSE_COLLECTION_NAMES = _(COLLECTION_NAMES)
  .toPairs()
  .groupBy(pair => pair[1])
  .mapValues(items => items.map(i => i[0]))
  .value();

function findReverseResources(script, reverseRelation, resourceName) {
  const reverseRelationParts = reverseRelation.split('.');
  const reverseCollectionName = reverseRelationParts[0];
  const resourceSubkey = reverseRelationParts.length === 3 ?
    reverseRelationParts[1] : null;
  const reverseProp = reverseRelationParts[reverseRelationParts.length - 1];
  const reverseCollection = getItems(script, reverseCollectionName);
  // If we're looking for a subkey, do something more complicated
  if (resourceSubkey) {
    return _(reverseCollection)
      .filter(item => (
        _.some(item[resourceSubkey], subitem => (
          subitem[reverseProp] === resourceName
        ))
      ))
      .value();
  }
  // If we're just searching for related resources, search for em.
  // Exclude all resources that don't have a name, since we can't
  // refer to them.
  return _(reverseCollection)
    .filter('name')
    .filter({ [reverseProp]: resourceName })
    .value();
}

function renderReverseRelation(script, reverseRelation, resourceName) {
  const reverseCollectionName = reverseRelation.split('.')[0];
  const reverseResources = findReverseResources(
    script, reverseRelation, resourceName);
  if (!reverseResources.length) {
    return null;
  }
  const reverseItems = reverseResources.map(resource => (
    <li key={resource.name}>
      {renderLink(script.id, reverseCollectionName, resource.name)}
    </li>
  ));
  return (
    <div key={reverseRelation}>
      <div><strong>{reverseRelation}</strong></div>
      <ul>
        {reverseItems}
      </ul>
    </div>
  );
}

function doesParamMatchResource(paramSpec, paramValue, collectionName,
  resource) {
  if (paramSpec.type === 'reference') {
    if (paramSpec.collection === collectionName) {
      if (paramValue === resource.name) {
        return true;
      }
    }
  }
  return false;
}

function doesActionReferToResource(action, collectionName, resource) {
  const actionParamsSpec = ActionsRegistry[action.name].params;
  return _.some(action.params, (paramValue, paramName) => {
    // Check if action param matches this resource
    const paramSpec = actionParamsSpec[paramName];
    return doesParamMatchResource(paramSpec, paramValue, collectionName,
      resource);
  });
}

function gatherReferringActions(script, collectionName, resource) {
  const referringActions = [];
  _.each(script.content.triggers, (trigger) => {
    TriggerCore.walkActions(trigger.actions, '', (action, path) => {
      const modifierAndAction = ActionPhraseCore.extractModifier(action);
      const plainActionPhrase = modifierAndAction[2];
      const plainAction = ActionPhraseCore.expandPlainActionPhrase(
        plainActionPhrase);
      if (doesActionReferToResource(plainAction, collectionName, resource)) {
        referringActions.push({ action: action, triggerName: trigger.name });
      }
    }, () => {});
  });
  return referringActions;
}

function renderActionRefs(script, collectionName, resource) {
  const referringActions = gatherReferringActions(script, collectionName,
    resource);
  if (!referringActions.length) {
    return null;
  }
  const renderedActions = referringActions
    .map(referringAction => (
      <li
        key={
          `${referringAction.triggerName}-` +
          `${referringAction.name}-` +
          `${_.values(referringAction.params).join(',')}`
        }>
        {renderLink(script.id, 'triggers', referringAction.triggerName)}
      </li>
    ));
  return (
    <div>
      <div><strong>triggers.actions</strong></div>
      <ul>
        {renderedActions}
      </ul>
    </div>
  );
}

function doesEventMatchResource(event, collectionName, resource) {
  const eventType = Object.keys(event)[0];
  const eventParams = event[eventType];
  const eventParamsObj = _.isObject(eventParams) ? eventParams :
    { self: eventParams };
  const eventParamsSpec = EventsRegistry[eventType].specParams;
  return _.some(eventParamsObj, (paramValue, paramName) => {
    // Check if action param matches this resource
    const paramSpec = eventParamsSpec[paramName];
    return doesParamMatchResource(paramSpec, paramValue,
      collectionName, resource);
  });
}

function renderEventRefs(script, collectionName, resource) {
  const referringEvents = _(script.content.triggers)
    .map(trigger => (
      _(trigger.events)
        .filter(event => (
          doesEventMatchResource(event, collectionName, resource)
        ))
        .map(event => ({ event: event, trigger: trigger }))
        .value()
    ))
    .flatten()
    .value();
  if (!referringEvents.length) {
    return null;
  }
  const renderedEvents = referringEvents
    .map(referringEvent => (
      <li
        key={
          `${referringEvent.trigger.name}-` +
          `${_.values(referringEvent.event).join(',')}`
        }>
        {renderLink(script.id, 'triggers', referringEvent.trigger.name)}
      </li>
    ));
  return (
    <div>
      <div><strong>triggers.events</strong></div>
      <ul>
        {renderedEvents}
      </ul>
    </div>
  );
}

function renderShallowRefs(script, collectionName, resource) {
  const reverseRelations = REVERSE_COLLECTION_NAMES[collectionName];
  if (!reverseRelations) {
    return null;
  }
  return reverseRelations.map(reverseRelation => (
    renderReverseRelation(script, reverseRelation, resource.name)
  ));
}

function renderReverseRefs(script, collectionName, resource) {
  if (!resource.name) {
    return null;
  }
  return (
    <div>
      {renderShallowRefs(script, collectionName, resource)}
      {renderActionRefs(script, collectionName, resource)}
      {renderEventRefs(script, collectionName, resource)}
    </div>
  );
}

function renderActionParam(scriptId, actionName, paramName, paramValue) {
  const paramSpec = ActionsRegistry[actionName].params[paramName];
  return (
    <Param scriptId={scriptId} spec={paramSpec} value={paramValue} />
  );
}

function renderActionPhrase(scriptId, actionPhrase) {
  const modifierAndAction = ActionPhraseCore.extractModifier(actionPhrase);
  const modifier = modifierAndAction[1];
  const plainActionPhrase = modifierAndAction[2];
  const [actionName, ...actionParams] = TextUtil.splitWords(plainActionPhrase);
  const renderedModifier = modifier ? (
    <span className="faint">{modifier}: </span>
  ) : null;

  const paramNames = ActionsRegistry[actionName].phraseForm;
  const renderedActionParams = actionParams.map((paramValue, i) => (
    <span key={paramNames[i]} style={{ paddingRight: '0.25em' }}>
      {renderActionParam(scriptId, actionName, paramNames[i], paramValue)}
    </span>
  ));
  return (
    <span>
      {renderedModifier}
      {actionName}&nbsp;
      {renderedActionParams}
    </span>
  );
}

function renderIf(ifClause, isNested) {
  if (_.isString(ifClause)) {
    return ifClause;
  }
  if (_.isArray(ifClause)) {
    const clauses = ifClause.map(ifClauseItem => (
      renderIf(ifClauseItem, true)
    ));
    const joined = clauses.join(' and ');
    return isNested ? `(${joined})` : joined;
  }
  if (ifClause.or) {
    const clauses = ifClause.or.map(ifClauseItem => (
      renderIf(ifClauseItem, true)
    ));
    const joined = clauses.join(' or ');
    return isNested ? `(${joined})` : joined;
  }
  return '<empty>';
}

function renderActions(scriptId, actions) {
  if (!actions) {
    return '<no action>';
  }
  // Plain string, render
  if (_.isString(actions)) {
    return renderActionPhrase(scriptId, actions);
  }
  // Array, render each simply
  if (_.isArray(actions)) {
    if (actions.length === 0) {
      return '<no action>';
    }
    if (actions.length === 1) {
      return renderActions(scriptId, actions[0]);
    }
    // eslint-disable-next-line no-use-before-define
    return renderActionList(scriptId, actions);
  }
  // Complex object
  // eslint-disable-next-line no-use-before-define
  return renderActionClause(scriptId, actions);
}

function renderActionList(scriptId, actionList, actionIf = null) {
  const renderedActionIf = actionIf ? (
    <div>if: {renderIf(actionIf)}</div>
  ) : null;
  const actionListAsArray = _.isArray(actionList) ? actionList : [actionList];
  const renderedActionItems = actionListAsArray.map(actionItem => (
    <li key={JSON.stringify(actionItem)}>
      {renderActions(scriptId, actionItem)}
    </li>
  ));
  return (
    <div>
      {renderedActionIf}
      <ul>
        {renderedActionItems}
      </ul>
    </div>
  );
}


function renderActionClause(scriptId, action) {
  // No plain text here, since this is the clause of an if block.
  // If no else or else ifs, can just render a nested list.
  if (!action.else && !action.elseifs) {
    return renderActionList(scriptId, action.actions, action.if);
  }
  // Otherwise need a doubly nested list to deal with all
  // else / elseifs.
  const ifClause = (
    <li>
      <div>if: {renderIf(action.if)}</div>
      {renderActions(scriptId, action.actions)}
    </li>
  );
  const elseifClauses = action.elseifs ? (
    action.elseifs.map((elseif, i) => (
      <li key={elseif.if}>
        <div>else if: {renderIf(elseif.if)}</div>
        {renderActions(scriptId, elseif.actions)}
      </li>
    ))
  ) : null;
  const elseClause = action.else ? (
    <li>
      <div>else:</div>
      {renderActions(scriptId, action.else)}
    </li>
  ) : null;
  return (
    <ul>
      {ifClause}
      {elseifClauses}
      {elseClause}
    </ul>
  );
}

function renderEventParam(scriptId, eventType, paramName, paramValue) {
  const event = EventsRegistry[eventType];
  const paramSpec = event.specParams[paramName];
  return (
    <Param scriptId={scriptId} spec={paramSpec} value={paramValue} />
  );
}

function renderEventParams(scriptId, eventType, eventParams) {
  if (_.isString(eventParams)) {
    return renderEventParam(scriptId, eventType, 'self', eventParams);
  }
  const renderedParams = Object.keys(eventParams).map(paramName => (
    <li key={paramName}>
      {paramName}:&nbsp;
      {renderEventParam(scriptId, eventType, paramName, eventParams[paramName])}
    </li>
  ));
  return (
    <ul>
      {renderedParams}
    </ul>
  );
}

function renderEvent(scriptId, event, index) {
  const eventType = Object.keys(event)[0];
  const eventParams = event[eventType];
  return (
    <li key={index}>
      {eventType}:&nbsp;
      {renderEventParams(scriptId, eventType, eventParams)}
    </li>
  );
}

function renderEvents(scriptId, events) {
  const eventsAsList = _.isArray(events) ? events : [events];
  const renderedEvents = eventsAsList.map((event, i) => (
    renderEvent(scriptId, event, i)
  ));
  return (
    <ul>
      {renderedEvents}
    </ul>
  );
}

function renderValue(script, collectionName, key, value) {
  const valueCollectionName = COLLECTION_NAMES[`${collectionName}.${key}`];
  if (valueCollectionName) {
    return renderLink(script.id, valueCollectionName, value);
  }
  if (key === 'coords') {
    return `${value[0]}, ${value[1]}`;
  }
  if (key === 'actions') {
    return renderActions(script.id, value);
  }
  if (key === 'event') {
    return renderEvents(script.id, value);
  }
  if (_.isNull(value)) {
    return 'null';
  }
  if (_.isString(value) || _.isBoolean(value) || _.isNumber(value)) {
    return value.toString();
  }
  if (_.isArray(value)) {
    const subcollectionName = `${collectionName}.${key}`;
    const renderedItems = value.map((item, i) => (
      // eslint-disable-next-line react/no-array-index-key
      <li key={`${collectionName}-${key}-${i}`}>
        {
          // eslint-disable-next-line no-use-before-define
          renderFields(script, subcollectionName, item)
        }
      </li>
    ));
    return (
      <ul>{renderedItems}</ul>
    );
  }
  return <pre>{yaml.safeDump(value)}</pre>;
}

function renderField(script, collectionName, key, value) {
  return (
    <div key={key}>
      <strong>{key}:</strong>&nbsp;
      {renderValue(script, collectionName, key, value)}
    </div>
  );
}

function sortPropName(propName) {
  const index = _.indexOf(PROP_ORDERING, propName);
  return index > -1 ? index : 100000;
}

function renderFields(script, collectionName, resource) {
  if (_.isString(resource)) {
    return <div>{resource}</div>;
  }
  return _(Object.keys(resource))
    .sortBy(propName => sortPropName(propName))
    .map(key => (
      renderField(script, collectionName, key, resource[key])
    ))
    .value();
}

function getCollection(script, collectionName) {
  return script.content[collectionName] || [];
}

function getResource(script, collectionName, resourceName) {
  const collection = getCollection(script, collectionName);
  if (!isNaN(Number(resourceName))) {
    return collection[Number(resourceName)];
  }
  return _.find(collection, { name: resourceName });
}

export default function ResourceIndex({ script, collectionName, resourceName }) {
  const resource = getResource(script, collectionName, resourceName);
  if (!resource) {
    return (
      <div>Not found.</div>
    );
  }
  const fields = renderFields(script, collectionName, resource);
  const reverseRefs = renderReverseRefs(script, collectionName, resource);
  const title = resource.title || resourceName;
  return (
    <div>
      <h3>{title}</h3>
      {fields}
      <hr />
      {reverseRefs}
    </div>
  );
}

ResourceIndex.propTypes = {
  script: PropTypes.object,
  collectionName: PropTypes.string,
  resourceName: PropTypes.string
};
