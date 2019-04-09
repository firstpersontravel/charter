import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

import { ResourcesRegistry, TextUtil } from 'fptcore';

import { getSliceContent } from '../utils/section-utils';

function renderCreateResource(script, sliceType, sliceName, collectionName) {
  const resourceType = TextUtil.singularize(collectionName);
  const resourceClass = ResourcesRegistry[resourceType];
  return (
    <p key={collectionName} className="mb-3">
      {resourceClass.help}
      &nbsp;
      <Link
        to={
          `/${script.org.name}/${script.experience.name}` +
          `/script/${script.revision}` +
          `/design/${sliceType}/${sliceName}` +
          `/${collectionName}/new`
        }>
        Add {TextUtil.titleForKey(resourceType).toLowerCase()}
      </Link>
    </p>
  );
}

export default function SliceIndex({ script, params }) {
  const sliceContent = getSliceContent(params.sliceType, params.sliceName);
  if (!sliceContent) {
    return 'Invalid section.';
  }
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
