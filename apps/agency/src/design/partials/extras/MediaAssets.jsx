import _ from 'lodash';
import moment from 'moment';
import React from 'react';
import PropTypes from 'prop-types';

import { SubresourcesRegistry } from 'fptcore';

  // audio: MediaAssets,
  // page: MediaAssets,
  // content_page: MediaAssets,
  // message: MediaAssets,

function extractPanelPaths(panel) {
  const panelClasses = SubresourcesRegistry.panel.properties.self.classes;
  const panelClass = panelClasses[panel.type];
  const props = Object.keys(panelClass.properties);
  return props
    .filter(key => panelClass.properties[key].type === 'media')
    .map(key => ({
      medium: panelClass.properties[key].medium,
      path: panel[key]
    }));
}

function extraMediaReferences(resourceType, resource) {
  if (resourceType === 'audio') {
    return [{ medium: 'audio', path: resource.path }];
  }
  if (resourceType === 'page' || resourceType === 'content_page') {
    return _(resource.panels)
      .map(panel => extractPanelPaths(panel))
      .flatten()
      .value();
  }
  if (resourceType === 'message') {
    if (_.includes(['audio', 'image', 'video'], resource.medium)) {
      return [{ medium: resource.medium, path: resource.content }];
    }
  }
  return [];
}

function renderMediaAsset(mediaReference, assets) {
  const matchingAsset = assets
    .filter(asset => (
      asset.type === 'media' &&
      asset.data.medium === mediaReference.medium &&
      asset.data.path === mediaReference.path
    ))[0];
  let status = '';
  if (mediaReference.path.indexOf('{{') >= 0) {
    status = 'Dynamic';
  } else if (matchingAsset) {
    status = (
      <span className="text-success">
        Updated {moment.utc(matchingAsset.updatedAt).format('MMM DD, YYYY')}
      </span>
    );
  } else {
    status = <span className="text-danger">Not uploaded</span>;
  }
  const link = matchingAsset ? (
    <a
      style={{ marginLeft: '0.25em' }}
      href={matchingAsset.data.url}
      target="_blank"
      rel="noopener noreferrer">
      <i className="fa fa-external-link" />
    </a>
  ) : null;
  return (
    <div key={mediaReference.path}>
      {mediaReference.path}: {status}
      {link}
    </div>
  );
}

export default function MediaAssets({ script, resourceType, resource, assets,
  createInstance, updateInstance }) {
  const mediaReferences = extraMediaReferences(resourceType, resource);
  if (mediaReferences.length === 0) {
    return null;
  }
  const renderedMediaAssets = mediaReferences.map(mediaReference => (
    renderMediaAsset(mediaReference, assets)
  ));
  return (
    <div className="card">
      <h5 className="card-header">
        Attached media
      </h5>
      <div className="card-body">
        {renderedMediaAssets}
      </div>
    </div>
  );
}

MediaAssets.propTypes = {
  script: PropTypes.object.isRequired,
  resourceType: PropTypes.string.isRequired,
  resource: PropTypes.object.isRequired,
  assets: PropTypes.array.isRequired,
  createInstance: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired
};
