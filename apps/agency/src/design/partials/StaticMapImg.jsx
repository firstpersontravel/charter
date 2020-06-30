import React from 'react';
import PropTypes from 'prop-types';

import config from '../../config';

const BASE_URL = 'https://maps.googleapis.com/maps/api/staticmap';

export default function StaticMapImg({ size, polylines, markers, paths, ...props }) {
  let mapUrl = `${BASE_URL}?key=${config.googleApiKey}&size=${size}`;

  if (polylines) {
    const pathParams = polylines
      .map(polyline => `path=enc:${polyline}`)
      .join('&');
    mapUrl += `&${pathParams}`;
  }

  if (markers && markers.length) {
    const markerParams = markers
      .map(c => `markers=${c.join(',')}`)
      .join('&');
    mapUrl += `&${markerParams}`;
  }

  if (paths) {
    const pathParams = paths.join('&');
    mapUrl += `&${pathParams}`;
  }

  return (
    <img
      src={mapUrl}
      alt="Map"
      {...props} />
  );
}

StaticMapImg.propTypes = {
  polylines: PropTypes.array,
  markers: PropTypes.array,
  paths: PropTypes.array,
  size: PropTypes.string.isRequired
};

StaticMapImg.defaultProps = {
  polylines: [],
  markers: [],
  paths: []
};
