import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { TextUtil } from 'fptcore';

function getContentTree(sliceType, sliceName, scriptContent) {
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

export default class Slice extends Component {
  renderItem(collectionName, item) {
    const resourceName = TextUtil.singularize(collectionName);
    const script = this.props.script;
    const itemName = item.title || item.name;
    return (
      <Link
        className="list-group-item list-group-item-action constrain-text"
        key={item.name}
        activeClassName="active"
        to={
          `/${script.org.name}/${script.experience.name}` +
          `/design/script/${script.id}` +
          `/${this.props.params.sliceType}/${this.props.params.sliceName}` +
          `/${collectionName}/${item.name}`
        }>
        {TextUtil.titleForKey(resourceName)}: {itemName}
      </Link>
    );
  }

  renderItems(collectionName, items) {
    const renderedItems = _.map(items, item => (
      this.renderItem(collectionName, item)
    ));
    return (
      <ul className="script-content-slice list-group list-group-flush" key={collectionName}>
        {renderedItems}
      </ul>
    );
  }

  renderContentTree(contentTree) {
    return _.map(contentTree, (items, collectionName) => (
      this.renderItems(collectionName, items)
    ));
  }

  render() {
    const contentTree = getContentTree(this.props.params.sliceType,
      this.props.params.sliceName, this.props.script.content);

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
