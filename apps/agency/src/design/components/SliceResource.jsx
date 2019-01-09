import React from 'react';
import PropTypes from 'prop-types';

import Resource from '../partials/Resource';

export default function SliceResource({ script, params }) {
  return (
    <Resource
      script={script}
      collectionName={params.collectionName}
      resourceName={params.resourceName} />
  );
}

SliceResource.propTypes = {
  script: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};
