import React, { Component } from 'react';
import PropTypes from 'prop-types';

import MediaAssets from './extras/MediaAssets';
import RouteAssets from './extras/RouteAssets';

const assetComponentsByResourceType = {
  audio: MediaAssets,
  page: MediaAssets,
  content_page: MediaAssets,
  message: MediaAssets,
  route: RouteAssets
};

export default class ResourceExtras extends Component {
  render() {
    const resourceType = this.props.resourceType;
    const AssetsComponent = assetComponentsByResourceType[resourceType];
    if (AssetsComponent) {
      return (
        <AssetsComponent
          script={this.props.script}
          resourceType={this.props.resourceType}
          resource={this.props.resource}
          assets={this.props.assets}
          createInstance={this.props.createInstance}
          updateInstance={this.props.updateInstance} />
      );
    }
    return null;
  }
}

ResourceExtras.propTypes = {
  script: PropTypes.object.isRequired,
  resourceType: PropTypes.string.isRequired,
  resource: PropTypes.object.isRequired,
  assets: PropTypes.array.isRequired,
  createInstance: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired
};
