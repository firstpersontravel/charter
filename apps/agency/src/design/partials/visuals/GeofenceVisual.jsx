import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import StaticMapImg from '../StaticMapImg';

function mPerLatDegree(lat) {
  return (
    111132.954 +
    (-559.822 * Math.cos(2 * lat)) +
    (1.175 * Math.cos(4 * lat))
  );
}

function mPerLngDegree(lat) {
  return 111132.954 * Math.cos(lat);
}

function circle(lat, lng, rad) {
  const latDegPerMeter = 1.0 / mPerLatDegree(lat);
  const lngDegPerMeter = 1.0 / mPerLngDegree(lat);
  const num = 8;
  const interval = Math.PI / num;
  return _.range(0, (Math.PI * 2) + interval, interval)
    .map(i => ([
      lat + (Math.sin(i) * rad * latDegPerMeter),
      lng + (Math.cos(i) * rad * lngDegPerMeter)
    ]));
}

export default function WaypointVisual({ script, resource }) {
  const waypointName = resource.center;
  const waypoint = _.find(script.content.waypoints, { name: waypointName });
  if (!waypoint) {
    return null;
  }
  const paths = waypoint.options
    .map(opt => opt.coords)
    .filter(Boolean)
    .map(c => circle(c[0], c[1], resource.distance || 1))
    .map(circ => `path=${circ.join('|')}`);

  return (
    <StaticMapImg
      className="img-fluid"
      paths={[paths]}
      size="300x300" />
  );
}

WaypointVisual.propTypes = {
  script: PropTypes.object.isRequired,
  resource: PropTypes.object.isRequired
};
