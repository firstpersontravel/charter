import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { ActionPhraseCore, TextUtil, TriggerCore, EventsRegistry } from 'fptcore';

import { titleForResource } from '../components/utils';

const sectionContent = {
  roles: { roles: {}, appearances: {}, relays: {} },
  locations: { waypoints: {}, geofences: {}, routes: {} },
  variants: { variants: {}, departures: {} },
  media: { layouts: {}, content_pages: {}, audio: {} }
};

const sliceContent = {
  scene: sliceName => ({
    scenes: { name: sliceName },
    pages: { scene: sliceName },
    triggers: { scene: sliceName },
    messages: { scene: sliceName },
    cues: { scene: sliceName },
    achievements: { scene: sliceName },
    times: { scene: sliceName },
    checkpoints: { scene: sliceName }
  }),
  section: sliceName => sectionContent[sliceName]
};

function getSliceContent(sliceType, sliceName) {
  return sliceContent[sliceType](sliceName);
}

function getContentList(scriptContent, sliceType, sliceName) {
  const contentMap = getSliceContent(sliceType, sliceName);
  return _.mapValues(contentMap, (filters, collectionName) => (
    _.filter(scriptContent[collectionName], filters)
  ));
}

function getChildClaims(scriptContent, collectionName, resource) {
  const childClaims = [];
  if (collectionName === 'triggers') {
    TriggerCore.walkActions(resource.actions, '', (actionPhrase, path) => {
      const action = ActionPhraseCore.parseActionPhrase(actionPhrase);
      if (action.name === 'signal_cue') {
        childClaims.push(`cues.${action.params.cue_name}`);
      }
      if (action.name === 'send_message') {
        childClaims.push(`messages.${action.params.message_name}`);
      }
    }, () => {});
  }
  if (collectionName === 'pages') {
    _.each(resource.panels, (panel) => {
      if (panel.cue) {
        childClaims.push(`cues.${panel.cue}`);
      }
    });
  }
  return childClaims;
}

function getEventParent(spec) {
  const eventClass = EventsRegistry[spec.type];
  if (!eventClass.parentResourceParam) {
    return null;
  }
  const paramSpec = eventClass.specParams[eventClass.parentResourceParam];
  if (paramSpec.type !== 'reference') {
    return null;
  }
  const collectionName = paramSpec.collection;
  const resourceName = spec[eventClass.parentResourceParam];
  return `${collectionName}.${resourceName}`;
}

function getParentClaims(collectionName, resource) {
  if (collectionName === 'triggers') {
    return resource.events
      .map(event => getEventParent(event))
      .filter(Boolean);
  }
  if (collectionName === 'pages') {
    return resource.appearance ?
      [`appearances.${resource.appearance}`] :
      [`roles.${resource.role}`];
  }
  if (collectionName === 'pages') {
    return [`roles.${resource.role}`];
  }
  if (collectionName === 'appearances') {
    return [`roles.${resource.role}`];
  }
  if (collectionName === 'relays') {
    return [`roles.${resource.for}`];
  }
  if (collectionName === 'geofences') {
    return [`waypoints.${resource.center}`];
  }
  if (collectionName === 'routes') {
    return [`waypoints.${resource.from}`];
  }
  return null;
}

function addToList(existing, toAdd) {
  if (!existing) {
    return [toAdd];
  }
  if (existing.indexOf(toAdd) > -1) {
    return existing;
  }
  existing.push(toAdd);
  return existing;
}

function prepareContentTree(scriptContent, contentList) {
  // First gather child claims for complicated cases. childClaims is a dict
  // of the child object to an array of claimed parent objects.
  const childClaims = {};
  const collectionNames = Object.keys(contentList);
  _.each(collectionNames, (collectionName) => {
    _.each(contentList[collectionName], (resource) => {
      const selfName = `${collectionName}.${resource.name}`;
      const claims = getChildClaims(scriptContent, collectionName, resource);
      _.each(claims, (claim) => {
        childClaims[claim] = addToList(childClaims[claim], selfName);
      });
    });
  });

  // Inline get parent functino that looks at memoized child claims first,
  // then looks up the standard function.
  function getParent(resourceStr) {
    // For now just one parent for every object -- THIS should be updated
    // since a msg could be sent by >1 trigger, a cue by >1 page, etc.
    if (childClaims[resourceStr]) {
      return childClaims[resourceStr][0];
    }
    const [collectionName, resourceName] = resourceStr.split('.');
    const resource = _.find(scriptContent[collectionName],
      { name: resourceName });
    if (!resource) {
      return null;
    }
    const parents = getParentClaims(collectionName, resource);
    // Also only handle first parent for now.
    if (parents && parents.length > 0) {
      return parents[0];
    }
    return null;
  }

  // Now place each item in the content tree.
  const contentTree = {};
  _.each(collectionNames, (collectionName) => {
    _.each(contentList[collectionName], (resource) => {
      // For each item, create a path by finding each parent in turn
      // until there are no more parents.
      const resourceStr = `${collectionName}.${resource.name}`;
      const path = [];
      let cursor = resourceStr;
      while (cursor) {
        path.unshift(cursor);
        cursor = getParent(cursor);
      }

      // Then iterate through that path in reverse to place each item
      // in the path in the content tree. If any item isn't in the content
      // list, no problem, it'll be fetched later.
      let treeCursor = contentTree;
      _.each(path, (pathEntry) => {
        if (!treeCursor[pathEntry]) {
          treeCursor[pathEntry] = {};
        }
        treeCursor = treeCursor[pathEntry];
      });
    });
  });
  return contentTree;
}

function walkContentTree(contentTree, path, iteree) {
  _.each(contentTree, (value, key) => {
    iteree(path, key);
    walkContentTree(value, path.concat(key), iteree);
  });
}

export default class ContentTree extends Component {
  renderItem(collectionName, item, path, isInContentList) {
    const resourceName = TextUtil.singularize(collectionName);
    const script = this.props.script;
    const itemTitle = titleForResource(collectionName, item);
    const prefix = path.map(pathEntry => (
      <span className="faint" key={pathEntry}>&ndash;&nbsp;</span>
    ));
    return (
      <Link
        className={`list-group-item list-group-item-action constrain-text ${isInContentList ? '' : 'disabled'}`}
        key={`${path.join('-')}-${item.name}`}
        activeClassName="active"
        to={
          `/${script.org.name}/${script.experience.name}` +
          `/design/script/${script.id}` +
          `/${this.props.sliceType}/${this.props.sliceName}` +
          `/${collectionName}/${item.name}`
        }>
        {prefix}
        <span className={`badge ${isInContentList ? 'badge-info' : 'badge-secondary'}`}>
          {TextUtil.titleForKey(resourceName)}
        </span> {itemTitle}
      </Link>
    );
  }

  renderContentTree(scriptContent, contentList, contentTree) {
    const items = [];

    walkContentTree(contentTree, [], (path, key) => {
      const [collectionName, resourceName] = key.split('.');
      const isInContentList = !!contentList[collectionName];
      const collection = scriptContent[collectionName];
      const resource = _.find(collection, { name: resourceName });
      if (!resource) {
        console.log(`Resource not found ${key}`);
        return null;
      }
      const renderedItem = this.renderItem(collectionName, resource, path,
        isInContentList);
      items.push(renderedItem);
      return null;
    });

    return (
      <ul className="script-content-slice list-group list-group-flush">
        {items}
      </ul>
    );
  }

  render() {
    const sliceType = this.props.sliceType;
    const sliceName = this.props.sliceName;
    const scriptContent = this.props.script.content;
    const contentList = getContentList(scriptContent, sliceType, sliceName);
    const contentTree = prepareContentTree(scriptContent, contentList);
    return this.renderContentTree(scriptContent, contentList, contentTree);
  }
}

ContentTree.propTypes = {
  sliceType: PropTypes.string.isRequired,
  sliceName: PropTypes.string.isRequired,
  script: PropTypes.object.isRequired
};
