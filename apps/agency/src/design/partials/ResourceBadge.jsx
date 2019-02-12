import React from 'react';
import PropTypes from 'prop-types';

import { TextUtil } from 'fptcore';

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

const COLORS = {
  achievement: colors[0],
  appearance: colors[1],
  audio: colors[2],
  checkpoint: colors[3],
  clip: colors[4],
  content_page: colors[5],
  cue: colors[6],
  departure: colors[7],
  geofence: colors[8],
  layout: colors[9],
  message: colors[10],
  page: colors[11],
  panel: colors[12],
  query: colors[13],
  relay: colors[14],
  role: colors[15],
  route: colors[16],
  scene: colors[17],
  time: colors[18],
  trigger: colors[19],
  variant: colors[20],
  waypoint: colors[21]
};

const RESOURCE_ICONS = {
  achievement: 'trophy',
  appearance: 'calendar',
  audio: 'music',
  checkpoint: '',
  clip: 'volume-control-phone',
  content_page: 'sticky-note',
  cue: 'bell',
  departure: 'space-shuttle',
  geofence: 'map-pin',
  layout: 'phone',
  message: 'envelope',
  page: 'sticky-note',
  panel: 'sticky-note',
  query: 'question',
  relay: 'phone',
  role: 'user',
  route: 'compass',
  scene: 'puzzle-piece',
  time: 'hourglass',
  trigger: 'certificate',
  variant: 'space-shuttle',
  waypoint: 'map-pin'
};

export default function ResourceBadge({ resourceType }) {
  const style = COLORS[resourceType] ? {
    backgroundColor: COLORS[resourceType]
  } : null;
  const resourceIcon = RESOURCE_ICONS[resourceType] ? (
    <i
      style={{ marginRight: '0.25em' }}
      className={`fa fa-${RESOURCE_ICONS[resourceType]}`} />
  ) : null;
  return (
    <span style={style} className="badge badge-secondary">
      {resourceIcon}
      {TextUtil.titleForKey(resourceType)}
    </span>
  );
}

ResourceBadge.propTypes = {
  resourceType: PropTypes.string.isRequired
};
