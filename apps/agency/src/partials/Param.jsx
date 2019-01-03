import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

export function renderLink(orgName, scriptId, collectionName, resourceName) {
  return (
    <Link
      activeClassName="bold"
      to={
        `/${orgName}/design/script/${scriptId}` +
        `/collection/${collectionName}` +
        `/resource/${resourceName}`
      }>
      {resourceName}
    </Link>
  );
}

export default function Param({ orgName, scriptId, spec, value }) {
  if (spec.type === 'reference') {
    return renderLink(orgName, scriptId, spec.collection, value);
  }
  return value;
}

Param.propTypes = {
  orgName: PropTypes.string.isRequired,
  scriptId: PropTypes.number.isRequired,
  spec: PropTypes.object.isRequired,
  value: PropTypes.oneOfType([PropTypes.string]).isRequired
};
