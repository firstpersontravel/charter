import React from 'react';
import PropTypes from 'prop-types';

import StaticMapImg from '../StaticMapImg';

export default function WaypointVisual({ resource }) {
  const coords = resource.options
    .map(opt => opt.coords)
    .filter(Boolean)
    .map(c => `markers=${c.join(',')}`)
    .join('|');
  return (
    <StaticMapImg
      className="img-fluid"
      markers={[coords]}
      size="300x300" />
  );
}

WaypointVisual.propTypes = {
  resource: PropTypes.object.isRequired
};
