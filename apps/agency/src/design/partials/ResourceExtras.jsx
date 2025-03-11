import React, { Component } from 'react';
import PropTypes from 'prop-types';

import RouteAssets from './extras/RouteAssets';

const assetComponentsByResourceType = {
  route: RouteAssets
};

export default class ResourceExtras extends Component {
  render() {
    const { resourceType } = this.props;
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
