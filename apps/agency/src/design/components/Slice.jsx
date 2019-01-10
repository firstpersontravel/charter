import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { ActionPhraseCore, TextUtil, TriggerCore, ResourcesRegistry } from 'fptcore';

function getContentList(sliceType, sliceName, scriptContent) {
  if (sliceType === 'scene') {
    return {
      scenes: _.filter(scriptContent.scenes, { name: sliceName }),
      pages: _.filter(scriptContent.pages, { scene: sliceName }),
      triggers: _.filter(scriptContent.triggers, { scene: sliceName }),
      messages: _.filter(scriptContent.messages, { scene: sliceName }),
      cues: _.filter(scriptContent.cues, { scene: sliceName }),
      achievements: _.filter(scriptContent.achievements, { scene: sliceName }),
      times: _.filter(scriptContent.times, { scene: sliceName }),
      checkpoints: _.filter(scriptContent.checkpoints, { scene: sliceName })
    };
  }
  if (sliceType === 'section') {
    if (sliceName === 'roles') {
      return {
        roles: scriptContent.roles,
        appearances: scriptContent.appearances,
        relays: scriptContent.relays
      };
    }
    if (sliceName === 'locations') {
      return {
        waypoints: scriptContent.waypoints,
        geofences: scriptContent.geofences,
        routes: scriptContent.routes
      };
    }
    if (sliceName === 'variants') {
      return {
        variants: scriptContent.variants,
        departures: scriptContent.departures
      };
    }
    if (sliceName === 'media') {
      return {
        layouts: scriptContent.layouts,
        content_pages: scriptContent.content_pages,
        audio: scriptContent.audio
      };
    }
  }
  return null;
}

function getResourceChildClaims(scriptContent, collectionName, resource) {
  const childClaims = [];
  if (collectionName === 'triggers') {
    TriggerCore.walkActions(resource.actions, '', (action, path) => {
      const modifierAndAction = ActionPhraseCore.extractModifier(action);
      const plainActionPhrase = modifierAndAction[2];
      const plainAction = ActionPhraseCore.expandPlainActionPhrase(
        plainActionPhrase);
      if (plainAction.name === 'signal_cue') {
        childClaims.push(`cues.${plainAction.params.cue_name}`);
      }
      if (plainAction.name === 'send_message') {
        childClaims.push(`messages.${plainAction.params.message_name}`);
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

const collectionsWithParents = [
  'appearances',
  'relays',
  'geofences',
  'routes',
  'messages',
  'cues'
];

function getResourceParentClaim(collectionName, resource) {
  if (collectionName === 'appearances' || collectionName === 'relays') {
    return `roles.${resource.role}`;
  }
  if (collectionName === 'geofences') {
    return `waypoints.${resource.center}`;
  }
  if (collectionName === 'routes') {
    return `waypoints.${resource.from}`;
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
  const children = {};
  const parents = {};
  const collectionNames = Object.keys(contentList);
  _.each(collectionNames, (collectionName) => {
    _.each(contentList[collectionName], (resource) => {
      const selfName = `${collectionName}.${resource.name}`;
      const parentClaim = getResourceParentClaim(collectionName, resource);
      if (parentClaim) {
        parents[selfName] = parentClaim;
        children[parentClaim] = addToList(children[parentClaim], selfName);
      }
      const childClaims = getResourceChildClaims(scriptContent,
        collectionName, resource);
      _.each(childClaims, (childClaim) => {
        parents[childClaim] = selfName;
        children[selfName] = addToList(children[selfName], childClaim);
      });
    });
  });
  return _.fromPairs(collectionNames.map((collectionName) => {
    // If we're a collectionsWithParents, then we're just showing orphans.
    if (_.includes(collectionsWithParents, collectionName)) {
      const orphans = _.filter(contentList[collectionName], resource => (
        !parents[`${collectionName}.${resource.name}`]
      ));
      return [collectionName, { orphans: orphans }];
    }

    // Otherwise we are showing parents with children. Guaranteed not to have
    // orphans.
    const parentsAndChildren = _(contentList[collectionName])
      .map((resource) => {
        const resChildren = {};
        const selfName = `${collectionName}.${resource.name}`;
        _.each(children[selfName], (childName) => {
          const [childCol, childResName] = childName.split('.');
          const child = _.find(contentList[childCol], {
            name: childResName
          });
          if (!child) {
            // Miscategorized somehow
            return;
          }
          resChildren[childCol] = addToList(resChildren[childCol], child);
        });
        return { parent: resource, children: resChildren };
      })
      .value();
    return [collectionName, { parents: parentsAndChildren }];
  }));
}

export default class Slice extends Component {
  renderItem(collectionName, item, parentName) {
    const resourceName = TextUtil.singularize(collectionName);
    const resourceClass = ResourcesRegistry[resourceName];
    const script = this.props.script;
    const itemTitle = resourceClass.title ? resourceClass.title(item) :
      (item.title || item.name);
    const childPrefix = <span>&mdash;&nbsp;</span>;
    return (
      <Link
        className="list-group-item list-group-item-action constrain-text"
        key={`${parentName}-${item.name}`}
        activeClassName="active"
        to={
          `/${script.org.name}/${script.experience.name}` +
          `/design/script/${script.id}` +
          `/${this.props.params.sliceType}/${this.props.params.sliceName}` +
          `/${collectionName}/${item.name}`
        }>
        {parentName ? childPrefix : null}
        <span className="badge badge-info">{TextUtil.titleForKey(resourceName)}</span> {itemTitle}
      </Link>
    );
  }

  renderParent(collectionName, parent) {
    const items = [this.renderItem(collectionName, parent.parent, null)];
    _.each(Object.keys(parent.children), (childColName) => {
      _.each(parent.children[childColName], (child) => {
        items.push(this.renderItem(childColName, child, parent.parent.name));
      });
    });
    return items;
  }

  renderContentTree(contentTree) {
    const items = [];
    const orphanItems = [];
    _.each(contentTree, (collectionTree, collectionName) => {
      _.each(collectionTree.parents, (parent) => {
        const renderedParentItems = this.renderParent(collectionName, parent);
        items.push(...renderedParentItems);
      });
      _.each(collectionTree.orphans, (orphan) => {
        const renderedOrphan = this.renderItem(collectionName, orphan, 'orphan');
        orphanItems.push(renderedOrphan);
      });
    });

    if (orphanItems.length > 0) {
      items.push(
        <div
          className="list-group-item list-group-item-action disabled"
          key={'orphanParent'}>
          Orphaned
        </div>
      );
      items.push(...orphanItems);
    }

    return (
      <ul className="script-content-slice list-group list-group-flush">
        {items}
      </ul>
    );
  }

  render() {
    const contentList = getContentList(this.props.params.sliceType,
      this.props.params.sliceName, this.props.script.content);

    const contentTree = prepareContentTree(
      this.props.script.content, contentList);

    return (
      <div className="row row-eq-height script-editor-container">
        <div className="script-editor-col col-4">
          {this.renderContentTree(contentTree)}
        </div>
        <div className="script-editor-col col-8">
          {this.props.children}
        </div>
      </div>
    );
  }
}

Slice.propTypes = {
  children: PropTypes.node.isRequired,
  params: PropTypes.object.isRequired,
  script: PropTypes.object.isRequired
};
