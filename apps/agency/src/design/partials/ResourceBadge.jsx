import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import { ResourcesRegistry, SubresourcesRegistry, TextUtil } from 'fptcore';

const colors = [
  '#2e4d2e',
  '#2e4d45',
  '#2e3e4d',
  '#352e4d',
  '#2e7345',
  '#2e6d73',
  '#2e3973',
  '#562e73',
  '#2e9975',
  '#2e6d99',
  '#3f2e99',
  '#8f2e99',
  '#2db3b3',
  '#2d4eb3',
  '#702db3',
  '#b32d91',
  '#52a3cc',
  '#5c52cc',
  '#b852cc',
  '#cc5285',
  '#7ea1e5',
  '#a87ee5',
  '#e57ed5',
  '#e57e88'
];

const COLORS = _(ResourcesRegistry)
  .keys()
  .concat(Object.keys(SubresourcesRegistry))
  .uniq()
  .map((key, i) => [key, colors[i % colors.length]])
  .fromPairs()
  .value();

export default function ResourceBadge({ resourceType, style, ...props }) {
  const styleWithColor = Object.assign({
    backgroundColor: COLORS[resourceType] || '#cccccc'
  }, style);
  const resourceClass = ResourcesRegistry[resourceType] ||
    SubresourcesRegistry[resourceType];
  const resourceIcon = resourceClass.icon ? (
    <i className={`fa fa-${resourceClass.icon}`} />
  ) : null;
  return (
    <span style={styleWithColor} className="badge badge-secondary" {...props}>
      {resourceIcon}
      <span className="d-inline d-sm-none d-md-inline">
        {' '}{TextUtil.titleForKey(resourceType)}
      </span>
    </span>
  );
}

ResourceBadge.propTypes = {
  style: PropTypes.object,
  resourceType: PropTypes.string.isRequired
};

ResourceBadge.defaultProps = {
  style: {}
};
