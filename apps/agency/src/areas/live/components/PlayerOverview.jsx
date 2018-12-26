import _ from 'lodash';
import moment from 'moment-timezone';
import React from 'react';
import { Link } from 'react-router';
import PropTypes from 'prop-types';
import yaml from 'js-yaml';
import L from 'leaflet';

import { TimeCore } from 'fptcore';

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
      &nbsp;Last fix {TimeCore.humanizeIso(
        player.user.locationTimestamp,
        player.trip.script.timezone)}
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
      {' '}as of {TimeCore.humanizeIso(player.user.deviceTimestamp,
        player.trip.script.timezone)}
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
      &nbsp;Last active {TimeCore.humanizeIso(
        player.user.deviceLastActive,
        player.trip.script.timezone)}
    </div>
  );
}

function renderAudioStatus(audioStatus, audioEntry, timezone) {
  if (!audioStatus.is_playing) {
    const pausedAt = audioStatus.paused_time || 0;
    const remaining = (audioEntry.duration * 60) - pausedAt;
    const remainingStr = TimeCore.humanizeDuration(remaining);
    return `${audioEntry.title} paused, ${remainingStr} remaining`;
  }
  const startedAt = moment.utc(audioStatus.started_at);
  const startedTime = audioStatus.started_time;
  const zeroPoint = startedAt.clone().subtract(startedTime, 'seconds');
  const finishAt = zeroPoint.clone().add(audioEntry.duration, 'minutes');
  const finishStr = finishAt.tz(timezone).format('h:mma');
  return `${audioEntry.title} playing until ${finishStr}`;
}

function renderAudio(player) {
  if (!player.values.audio || !player.values.audio.name) {
    return null;
  }
  const audioStatus = player.values.audio;
  const audioEntry = _.find(player.trip.script.content.audio,
    { name: audioStatus.name });
  return (
    <div>
      <strong>Audio:</strong>
      &nbsp;{renderAudioStatus(audioStatus, audioEntry,
        player.trip.script.timezone)}
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
        <Link to={`/agency/live/${trip.groupId}/all/role/${player.roleName}/${user ? user.id : 0}`}>
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
        {acknowledgedPageAt ? ` at ${moment.utc(acknowledgedPageAt).tz(script.timezone).format('h:mma z')}` : ''}
      </div>
      {renderGeo(player)}
      {renderBatt(player)}
      {renderActivity(player)}
      {renderAudio(player)}
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
