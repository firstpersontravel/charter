import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { TextUtil } from 'fptcore';

import { getSliceContent } from '../utils/section-utils';

function renderCreateResource(script, sliceType, sliceName, collectionName) {
  const resourceName = TextUtil.singularize(collectionName);
  return (
    <div key={collectionName} style={{ marginBottom: '1em' }}>
      <Link
        to={
          `/${script.org.name}/${script.experience.name}` +
          `/design/script/${script.revision}` +
          `/${sliceType}/${sliceName}` +
          `/${collectionName}/new`
        }
        className="btn btn-outline-secondary">
        Create {resourceName}
      </Link>
    </div>
  );
}

export default function SliceIndex({ script, params }) {
  const sliceContent = getSliceContent(params.sliceType, params.sliceName);
  const collectionNames = Object.keys(sliceContent);
  const renderedCreateItems = collectionNames.map(collectionName => (
    renderCreateResource(script, params.sliceType, params.sliceName,
      collectionName)
  ));
  return (
    <div>
      {renderedCreateItems}
    </div>
  );
}

SliceIndex.propTypes = {
  script: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};
