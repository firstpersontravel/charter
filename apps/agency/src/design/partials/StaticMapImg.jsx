import React from 'react';
import PropTypes from 'prop-types';

const BASE_URL = 'https://maps.googleapis.com/maps/api/staticmap';

export default function StaticMapImg({ size, polylines, markers, ...props }) {
  let mapUrl = `${BASE_URL}?key=${process.env.GOOGLE_API_KEY}&size=${size}`;

  if (polylines) {
    const pathParams = polylines
      .map(polyline => `path=enc:${polyline}`)
      .join('&');
    mapUrl += `&${pathParams}`;
  }

  if (markers) {
    const markerParams = markers.join('&');
    mapUrl += `&${markerParams}`;
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
  size: PropTypes.string.isRequired
};

StaticMapImg.defaultProps = {
  polylines: [],
  markers: []
};
