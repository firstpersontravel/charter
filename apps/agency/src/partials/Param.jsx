import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

const sections = {
  roles: ['roles', 'appearances', 'relays'],
  locations: ['waypoints', 'geofences', 'routes'],
  variants: ['variants', 'departures'],
  media: ['layouts', 'content_pages', 'audio']
};

function sliceForResource(collectionName, resource) {
  if (collectionName === 'scenes') {
    return { sliceType: 'scene', sliceName: resource.name };
  }
  if (resource.scene) {
    return { sliceType: 'scene', sliceName: resource.scene };
  }
  const section = _.find(Object.keys(sections), sectionName => (
    _.includes(sections[sectionName], collectionName)
  ));
  return { sliceType: 'section', sliceName: section };
}

export function linkForResource(script, collectionName, resourceName) {
  const collection = script.content[collectionName];
  const resource = _.find(collection, { name: resourceName });
  const { sliceType, sliceName } = sliceForResource(collectionName, resource);
  return (
    `/${script.org.name}/${script.experience.name}` +
    `/design/script/${script.id}` +
    `/${sliceType}/${sliceName}` +
    `/${collectionName}/${resourceName}`
  );
}

export function renderLink(script, collectionName, resourceName) {
  return (
    <Link
      activeClassName="bold"
      to={linkForResource(script, collectionName, resourceName)}>
      {resourceName}
    </Link>
  );
}

export default function Param({ script, spec, value }) {
  if (spec.type === 'reference') {
    return renderLink(script, spec.collection, value);
  }
  return value;
}

Param.propTypes = {
  script: PropTypes.object.isRequired,
  spec: PropTypes.object.isRequired,
  value: PropTypes.oneOfType([PropTypes.string]).isRequired
};
