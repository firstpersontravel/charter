import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
  ActionsRegistry,
  ActionPhraseCore,
  EventsRegistry,
  TriggerCore
} from 'fptcore';

import { COLLECTION_NAMES } from '../consts';
import { renderLink } from '../../partials/Param';

const REVERSE_COLLECTION_NAMES = _(COLLECTION_NAMES)
  .toPairs()
  .groupBy(pair => pair[1])
  .mapValues(items => items.map(i => i[0]))
  .value();

export default class Resource extends Component {

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
    const collectionName = this.props.collectionName;
    const resource = this.props.resource;
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

  doesEventSpecMatchResource(event) {
    const eventParamsSpec = EventsRegistry[event.type].specParams;
    return _.some(event, (paramValue, paramName) => {
      // Check if action param matches this resource
      const paramSpec = eventParamsSpec[paramName];
      return paramName !== 'type' &&
        this.doesParamMatchResource(paramSpec, paramValue);
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
    const resource = this.props.resource;
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
          .filter(event => this.doesEventSpecMatchResource(event))
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
    const collectionName = this.props.collectionName;
    const reverseRelations = REVERSE_COLLECTION_NAMES[collectionName];
    if (!reverseRelations) {
      return null;
    }
    return reverseRelations.map(reverseRelation => (
      this.renderReverseRelation(reverseRelation)
    ));
  }

  render() {
    return (
      <div>
        {this.renderShallowRefs()}
        {this.renderActionRefs()}
        {this.renderEventRefs()}
      </div>
    );
  }
}

Resource.propTypes = {
  script: PropTypes.object.isRequired,
  collectionName: PropTypes.string.isRequired,
  resource: PropTypes.object.isRequired
};
