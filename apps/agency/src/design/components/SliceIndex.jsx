import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { coreRegistry, TextUtil } from 'fptcore';

import ResourceBadge from '../../partials/ResourceBadge';
import { getSliceFilters } from '../utils/section-utils';
import { titleForResourceType } from '../utils/text-utils';

function renderCreateResource(script, sliceType, sliceName, collectionName) {
  const resourceType = TextUtil.singularize(collectionName);
  const resourceClass = coreRegistry.resources[resourceType];
  const query = sliceType === 'scene' ? `?scene=${sliceName}` : '';
  return (
    <p key={collectionName} className="mb-3">
      <ResourceBadge resourceType={resourceType} className="mr-1" />
      {resourceClass.help}
      &nbsp;
      <Link
        to={
          `/${script.org.name}/${script.experience.name}` +
          `/script/${script.revision}` +
          `/design/${sliceType}/${sliceName}` +
          `/${collectionName}/new${query}`
        }>
        Add {titleForResourceType(resourceType).toLowerCase()}
      </Link>
    </p>
  );
}

export default function SliceIndex({ script, match }) {
  const contentFilters = getSliceFilters(script.content,
    match.params.sliceType, match.params.sliceName);
  if (!contentFilters) {
    return 'Invalid section.';
  }
  const collectionNames = [...new Set(contentFilters.map(i => i.collection))];
  const renderedCreateItems = collectionNames.map(collectionName => (
    renderCreateResource(script, match.params.sliceType,
      match.params.sliceName, collectionName)
  ));
  return (
    <div>
      {renderedCreateItems}
    </div>
  );
}

SliceIndex.propTypes = {
  script: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired
};
