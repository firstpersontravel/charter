import _ from 'lodash';
import moment from 'moment-timezone';
import React from 'react';
import { Link } from 'react-router';
import PropTypes from 'prop-types';
import yaml from 'js-yaml';
import L from 'leaflet';

import { TimeUtil } from 'fptcore';

import Preview from '../partials/Preview';
import GroupMap from '../partials/GroupMap';

function renderMap(player) {
  if (!player.user || !player.user.locationLatitude) {
    return null;
  }
  const center = L.latLng(
    player.user.locationLatitude,
    player.user.locationLongitude);
  return (
    <GroupMap
      center={center}
      zoom={15}
      trips={[player.trip]} />
  );
}

function renderGeo(player) {
  if (!player.user || !player.user.locationLatitude) {
    return null;
  }
  return (
    <div>
      <strong>Location:</strong>
      &nbsp;Last fix {TimeUtil.humanizeIso(
        player.user.locationTimestamp,
        player.trip.experience.timezone)}
    </div>
  );
}

function renderBatt(player) {
  if (!player.user || !player.user.deviceBattery) {
    return null;
  }
  const batteryPercent = player.user.deviceBattery >= 0 ?
    `${Math.floor(player.user.deviceBattery * 100)}%` : '–';
  return (
    <div>
      <strong>Batteries:</strong>
      {' '}{batteryPercent}
      {' '}as of {TimeUtil.humanizeIso(player.user.deviceTimestamp,
        player.trip.experience.timezone)}
    </div>
  );
}

function renderActivity(player) {
  if (!player.user || !player.user.deviceLastActive) {
    return null;
  }
  return (
    <div>
      <strong>Activity:</strong>
      &nbsp;Last active {TimeUtil.humanizeIso(
        player.user.deviceLastActive,
        player.trip.experience.timezone)}
    </div>
  );
}

function renderAudioStatus(values, audioEntry, timezone) {
  if (!values.audio_is_playing) {
    const pausedAt = values.audio_paused_time || 0;
    const remaining = (audioEntry.duration * 60) - pausedAt;
    const remainingStr = TimeUtil.humanizeDuration(remaining);
    return `${audioEntry.title} paused, ${remainingStr} remaining`;
  }
  const startedAt = moment.utc(values.audio_started_at);
  const startedTime = values.audio_started_time;
  const zeroPoint = startedAt.clone().subtract(startedTime, 'seconds');
  const finishAt = zeroPoint.clone().add(audioEntry.duration, 'minutes');
  const finishStr = finishAt.tz(timezone).format('h:mma');
  return `${audioEntry.title} playing until ${finishStr}`;
}

function renderAudio(trip, player) {
  if (!trip.values.audio_name || trip.values.audio_role !== player.roleName) {
    return null;
  }
  const audioEntry = _.find(player.trip.script.content.audio,
    { name: trip.values.audio_name });
  return (
    <div>
      <strong>Audio:</strong>
      &nbsp;{renderAudioStatus(trip.values, audioEntry,
        player.trip.experience.timezone)}
    </div>
  );
}

function renderValues(player) {
  if (!player.values || !_.keys(player.values).length) {
    return null;
  }
  return (
    <div>
      <div><strong>Values</strong></div>
      <pre>{yaml.safeDump(player.values)}</pre>
    </div>
  );
}

function renderUser(user) {
  if (!user) {
    return 'None';
  }
  return (
    <Link to={`/agency/users/user/${user.id}`}>
      {user.firstName} {user.lastName}
    </Link>
  );
}

function renderVars(player) {
  const script = player.trip.script;
  const trip = player.trip;
  const user = player.user;
  const currentPage = _.find(script.content.pages,
    { name: player.currentPageName });
  const acknowledgedPage = _.find(script.content.pages,
    { name: player.acknowledgedPageName });
  const acknowledgedPageAt = player.acknowledgedPageAt;
  return (
    <div>
      <div>
        <strong>Role:</strong>
        &nbsp;
        <Link to={`/agency/operate/${trip.groupId}/all/role/${player.roleName}/${user ? user.id : 0}`}>
          {player.roleName} ({user ? user.firstName : 'No user'})
        </Link>
        <br />

        <strong>User:</strong>
        &nbsp;
        {renderUser(user)}
        <br />

        <strong>Current page:</strong>
        &nbsp;{currentPage ? currentPage.title : 'None'}
        <br />

        <strong>Acknowledged page:</strong>
        &nbsp;{acknowledgedPage ? acknowledgedPage.title : 'None'}
        {acknowledgedPageAt ? ` at ${moment.utc(acknowledgedPageAt).tz(trip.experience.timezone).format('h:mma z')}` : ''}
      </div>
      {renderGeo(player)}
      {renderBatt(player)}
      {renderActivity(player)}
      {renderAudio(trip, player)}
      {renderValues(player)}
    </div>
  );
}

export default function PlayerOverview({ player }) {
  const map = renderMap(player);
  const vars = renderVars(player);
  return (
    <div className="row">
      <div className="col-sm-6">
        <Preview player={player} />
      </div>
      <div className="col-sm-6">
        {map}
        {vars}
      </div>
    </div>
  );
}

PlayerOverview.propTypes = {
  player: PropTypes.object.isRequired
};
