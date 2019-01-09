import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import ResourceNew from '../partials/ResourceNew';
import ResourceReverseRefs from '../partials/ResourceReverseRefs';

export default function SliceResource({ script, params }) {
  const collection = script.content[params.collectionName];
  const resource = _.find(collection, { name: params.resourceName });
  if (!resource) {
    return (
      <div>Not found.</div>
    );
  }
  return (
    <div>
      <ResourceNew
        script={script}
        collectionName={params.collectionName}
        resource={resource} />
      <hr />
      <ResourceReverseRefs
        script={script}
        collectionName={params.collectionName}
        resource={resource} />
    </div>
  );
}

SliceResource.propTypes = {
  script: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};
