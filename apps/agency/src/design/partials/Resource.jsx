import _ from 'lodash';
import React, { Component } from 'react';
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
import Param, { renderLink } from '../../partials/Param';

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
  'events',
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


function sortPropName(propName) {
  const index = _.indexOf(PROP_ORDERING, propName);
  return index > -1 ? index : 100000;
}

export default class Resource extends Component {

  getCollectionName() {
    return this.props.collectionName;
  }

  getResourceName() {
    return this.props.resourceName;
  }

  getResource() {
    const collectionName = this.getCollectionName();
    const collection = this.props.script.content[collectionName] || [];
    return _.find(collection, { name: this.getResourceName() });
  }

  findReverseResources(reverseRelation, resourceName) {
    const reverseRelationParts = reverseRelation.split('.');
    const reverseCollectionName = reverseRelationParts[0];
    const resourceSubkey = reverseRelationParts.length === 3 ?
      reverseRelationParts[1] : null;
    const reverseProp = reverseRelationParts[reverseRelationParts.length - 1];
    const reverseCollection = this.props.script[reverseCollectionName];
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

  doesParamMatchResource(paramSpec, paramValue) {
    const collectionName = this.getCollectionName();
    const resource = this.getResource();
    if (paramSpec.type === 'reference') {
      if (paramSpec.collection === collectionName) {
        if (paramValue === resource.name) {
          return true;
        }
      }
    }
    return false;
  }

  doesActionReferToResource(action) {
    const actionParamsSpec = ActionsRegistry[action.name].params;
    return _.some(action.params, (paramValue, paramName) => {
      // Check if action param matches this resource
      const paramSpec = actionParamsSpec[paramName];
      return this.doesParamMatchResource(paramSpec, paramValue);
    });
  }

  doesEventMatchResource(event) {
    const eventType = Object.keys(event)[0];
    const eventParams = event[eventType];
    const eventParamsObj = _.isObject(eventParams) ? eventParams :
      { self: eventParams };
    const eventParamsSpec = EventsRegistry[eventType].specParams;
    return _.some(eventParamsObj, (paramValue, paramName) => {
      // Check if action param matches this resource
      const paramSpec = eventParamsSpec[paramName];
      return this.doesParamMatchResource(paramSpec, paramValue);
    });
  }

  gatherReferringActions() {
    const referringActions = [];
    _.each(this.props.script.content.triggers, (trigger) => {
      TriggerCore.walkActions(trigger.actions, '', (action, path) => {
        const modifierAndAction = ActionPhraseCore.extractModifier(action);
        const plainActionPhrase = modifierAndAction[2];
        const plainAction = ActionPhraseCore.expandPlainActionPhrase(
          plainActionPhrase);
        if (this.doesActionReferToResource(plainAction)) {
          referringActions.push({
            action: plainAction,
            triggerName: trigger.name
          });
        }
      }, () => {});
    });
    return _.uniqBy(referringActions, 'triggerName');
  }

  renderLink(collectionName, resourceName) {
    return renderLink(this.props.script, collectionName, resourceName);
  }

  renderReverseRelation(reverseRelation) {
    const resource = this.getResource();
    const reverseCollectionName = reverseRelation.split('.')[0];
    const reverseResources = this.findReverseResources(
      reverseRelation, resource.name);
    if (!reverseResources.length) {
      return null;
    }
    const reverseItems = reverseResources.map(revResource => (
      <li key={revResource.name}>
        {this.renderLink(reverseCollectionName, revResource.name)}
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

  renderActionRefs() {
    const referringActions = this.gatherReferringActions();
    if (!referringActions.length) {
      return null;
    }
    const renderedActions = referringActions
      .map(referringAction => (
        <li
          key={
            `${referringAction.triggerName}-` +
            `${referringAction.action.name}-` +
            `${_.values(referringAction.action.params).join(',')}`
          }>
          {this.renderLink('triggers', referringAction.triggerName)}
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

  renderEventRefs() {
    const script = this.props.script;
    const referringEvents = _(script.content.triggers)
      .map(trigger => (
        _(trigger.events)
          .filter(event => this.doesEventMatchResource(event))
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
          {this.renderLink('triggers', referringEvent.trigger.name)}
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

  renderShallowRefs() {
    const collectionName = this.getCollectionName();
    const reverseRelations = REVERSE_COLLECTION_NAMES[collectionName];
    if (!reverseRelations) {
      return null;
    }
    return reverseRelations.map(reverseRelation => (
      this.renderReverseRelation(reverseRelation)
    ));
  }

  renderReverseRefs() {
    return (
      <div>
        {this.renderShallowRefs()}
        {this.renderActionRefs()}
        {this.renderEventRefs()}
      </div>
    );
  }

  renderActionParam(actionName, paramName, paramValue) {
    const paramSpec = ActionsRegistry[actionName].params[paramName];
    return (
      <Param
        script={this.props.script}
        spec={paramSpec}
        value={paramValue} />
    );
  }

  renderActionPhrase(actionPhrase) {
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
        {this.renderActionParam(actionName, paramNames[i], paramValue)}
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

  renderIf(ifClause, isNested) {
    if (_.isString(ifClause)) {
      return ifClause;
    }
    if (_.isArray(ifClause)) {
      const clauses = ifClause.map(ifClauseItem => (
        this.renderIf(ifClauseItem, true)
      ));
      const joined = clauses.join(' and ');
      return isNested ? `(${joined})` : joined;
    }
    if (ifClause.or) {
      const clauses = ifClause.or.map(ifClauseItem => (
        this.renderIf(ifClauseItem, true)
      ));
      const joined = clauses.join(' or ');
      return isNested ? `(${joined})` : joined;
    }
    return '<empty>';
  }

  renderActions(actions) {
    if (!actions) {
      return '<no action>';
    }
    // Plain string, render
    if (_.isString(actions)) {
      return this.renderActionPhrase(actions);
    }
    // Array, render each simply
    if (_.isArray(actions)) {
      if (actions.length === 0) {
        return '<no action>';
      }
      // eslint-disable-next-line no-use-before-define
      return this.renderActionList(actions);
    }
    // Complex object
    // eslint-disable-next-line no-use-before-define
    return this.renderActionClause(actions);
  }

  renderActionList(actionList, actionIf = null) {
    const renderedActionIf = actionIf ? (
      <div>if: {this.renderIf(actionIf)}</div>
    ) : null;
    const renderedActionItems = actionList.map(actionItem => (
      <li key={JSON.stringify(actionItem)}>
        {this.renderActions(actionItem)}
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

  renderActionClause(action) {
    // No plain text here, since this is the clause of an if block.
    // If no else or else ifs, can just render a nested list.
    if (!action.else && !action.elseifs) {
      return this.renderActionList(action.actions, action.if);
    }
    // Otherwise need a doubly nested list to deal with all
    // else / elseifs.
    const ifClause = (
      <li>
        <div>if: {this.renderIf(action.if)}</div>
        {this.renderActions(action.actions)}
      </li>
    );
    const elseifClauses = action.elseifs ? (
      action.elseifs.map((elseif, i) => (
        <li key={elseif.if}>
          <div>else if: {this.renderIf(elseif.if)}</div>
          {this.renderActions(elseif.actions)}
        </li>
      ))
    ) : null;
    const elseClause = action.else ? (
      <li>
        <div>else:</div>
        {this.renderActions(action.else)}
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

  renderEventParam(eventType, paramName, paramValue) {
    const event = EventsRegistry[eventType];
    const paramSpec = event.specParams[paramName];
    return (
      <Param
        script={this.props.script}
        spec={paramSpec}
        value={paramValue} />
    );
  }

  renderEventParams(eventType, eventParams) {
    if (_.isString(eventParams)) {
      return this.renderEventParam(eventType, 'self', eventParams);
    }
    const renderedParams = Object.keys(eventParams).map(paramName => (
      <li key={paramName}>
        {paramName}:&nbsp;
        {this.renderEventParam(eventType, paramName, eventParams[paramName])}
      </li>
    ));
    return (
      <ul>
        {renderedParams}
      </ul>
    );
  }

  renderEvent(event, index) {
    const eventType = Object.keys(event)[0];
    const eventParams = event[eventType];
    return (
      <li key={index}>
        {eventType}:&nbsp;
        {this.renderEventParams(eventType, eventParams)}
      </li>
    );
  }

  renderEvents(events) {
    const renderedEvents = events.map((event, i) => (
      this.renderEvent(event, i)
    ));
    return (
      <ul>
        {renderedEvents}
      </ul>
    );
  }

  renderValue(collectionName, key, value) {
    const valueCollectionName = COLLECTION_NAMES[`${collectionName}.${key}`];
    if (valueCollectionName) {
      return this.renderLink(valueCollectionName, value);
    }
    if (key === 'coords') {
      return `${value[0]}, ${value[1]}`;
    }
    if (key === 'actions') {
      return this.renderActions(value);
    }
    if (key === 'events') {
      return this.renderEvents(value);
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
            this.renderFields(subcollectionName, item)
          }
        </li>
      ));
      return (
        <ul>{renderedItems}</ul>
      );
    }
    return <pre>{yaml.safeDump(value)}</pre>;
  }

  renderField(collectionName, key, value) {
    return (
      <div key={key}>
        <strong>{key}:</strong>&nbsp;
        {this.renderValue(collectionName, key, value)}
      </div>
    );
  }

  renderFields(collectionName, resource) {
    if (_.isString(resource)) {
      return <div>{resource}</div>;
    }
    return _(Object.keys(resource))
      .sortBy(propName => sortPropName(propName))
      .map(key => this.renderField(collectionName, key, resource[key]))
      .value();
  }

  render() {
    const collectionName = this.getCollectionName();
    const resource = this.getResource();
    if (!resource) {
      return (
        <div>Not found.</div>
      );
    }
    return (
      <div>
        {this.renderFields(collectionName, resource)}
        <hr />
        {this.renderReverseRefs()}
      </div>
    );
  }
}

Resource.propTypes = {
  script: PropTypes.object.isRequired,
  collectionName: PropTypes.string.isRequired,
  resourceName: PropTypes.string.isRequired
};
