import React from 'react';
import PropTypes from 'prop-types';

import { TextUtil } from 'fptcore';

const COLORS = {
  achievement: '#1f77b4',
  appearance: '#ff7f0e',
  audio: '#2ca02c',
  checkpoint: '#d62728',
  clip: '#9467bd',
  content_page: '#8c564b',
  cue: '#e377c2',
  departure: '#7f7f7f',
  geofence: '#bcbd22',
  layout: '#17becf',
  message: '#1f77b4',
  page: '#ff7f0e',
  panel: '#2ca02c',
  query: '#d62728',
  relay: '#9467bd',
  role: '#8c564b',
  route: '#e377c2',
  scene: '#7f7f7f',
  time: '#bcbd22',
  trigger: '#17becf',
  variant: '#1f77b4',
  waypoint: '#ff7f0e'
};

const RESOURCE_ICONS = {
  achievement: 'trophy',
  appearance: '',
  audio: 'music',
  checkpoint: '',
  clip: '',
  content_page: '',
  cue: 'bell',
  departure: '',
  geofence: '',
  layout: '',
  message: '',
  page: 'sticky-note',
  panel: '',
  query: 'question',
  relay: '',
  role: 'user',
  route: 'compass',
  scene: '',
  time: 'hourglass',
  trigger: 'certificate',
  variant: '',
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
