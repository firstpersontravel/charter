import React, { Component } from 'react';
import PropTypes from 'prop-types';

import GeofenceVisual from './visuals/GeofenceVisual';

const visualComponentsByResourceType = {
  geofence: GeofenceVisual
};

export function hasVisual(resourceType) {
  return !!visualComponentsByResourceType[resourceType];
}

export default class ResourceVisual extends Component {
  render() {
    const { resourceType } = this.props;
    const VisualComponent = visualComponentsByResourceType[resourceType];
    if (VisualComponent) {
      return (
        <VisualComponent
          script={this.props.script}
          resourceType={this.props.resourceType}
          resource={this.props.resource} />
      );
    }
    return null;
  }
}

ResourceVisual.propTypes = {
  script: PropTypes.object.isRequired,
  resourceType: PropTypes.string.isRequired,
  resource: PropTypes.object.isRequired
};
