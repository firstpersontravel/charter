import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import { TextUtil } from 'fptcore';

import ResourceView from '../partials/ResourceView';

export default function SliceResource({ script, params }) {
  const collection = script.content[params.collectionName];
  const resourceType = TextUtil.singularize(params.collectionName);
  const resource = _.find(collection, { name: params.resourceName });
  if (!resource) {
    return (
      <div>Not found.</div>
    );
  }
  return (
    <div>
      <div className="card" style={{ marginBottom: '1em' }}>
        <h5 className="card-header">
          <span className="badge badge-info">
            {TextUtil.titleForKey(resourceType)}
          </span>&nbsp;
          {resource.title || resource.name}
        </h5>
        <div className="card-body">
          <ResourceView
            script={script}
            collectionName={params.collectionName}
            resource={resource} />
        </div>
      </div>
    </div>
  );
}

SliceResource.propTypes = {
  script: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};
