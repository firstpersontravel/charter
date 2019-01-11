import React from 'react';
import PropTypes from 'prop-types';

import { TextUtil } from 'fptcore';

import { getSliceContent } from './utils';

function renderCreateResource(collectionName) {
  const resourceName = TextUtil.singularize(collectionName);
  return (
    <div key={collectionName} style={{ marginBottom: '1em' }}>
      <p>Info about {collectionName}</p>
      <button className="btn btn-outline-secondary">
        Create {resourceName}
      </button>
    </div>
  );
}

export default function SliceIndex({ params }) {
  const sliceContent = getSliceContent(params.sliceType, params.sliceName);
  const collectionNames = Object.keys(sliceContent);
  const renderedCreateItems = collectionNames.map(collectionName => (
    renderCreateResource(collectionName)
  ));
  return (
    <div>
      {renderedCreateItems}
    </div>
  );
}

SliceIndex.propTypes = {
  params: PropTypes.object.isRequired
};
