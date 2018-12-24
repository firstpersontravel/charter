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

function renderMap(participant) {
  if (!participant.user || !participant.user.locationLatitude) {
    return null;
  }
  const center = L.latLng(
    participant.user.locationLatitude,
    participant.user.locationLongitude);
  return (
    <GroupMap
      center={center}
      zoom={15}
      trips={[participant.trip]} />
  );
}

function renderGeo(participant) {
  if (!participant.user || !participant.user.locationLatitude) {
    return null;
  }
  return (
    <div>
      <strong>Location:</strong>
      &nbsp;Last fix {TimeCore.humanizeIso(
        participant.user.locationTimestamp,
        participant.trip.script.timezone)}
    </div>
  );
}

function renderBatt(participant) {
  if (!participant.user || !participant.user.deviceBattery) {
    return null;
  }
  const batteryPercent = participant.user.deviceBattery >= 0 ?
    `${Math.floor(participant.user.deviceBattery * 100)}%` : '–';
  return (
    <div>
      <strong>Batteries:</strong>
      {' '}{batteryPercent}
      {' '}as of {TimeCore.humanizeIso(participant.user.deviceTimestamp,
        participant.trip.script.timezone)}
    </div>
  );
}

function renderActivity(participant) {
  if (!participant.user || !participant.user.deviceLastActive) {
    return null;
  }
  return (
    <div>
      <strong>Activity:</strong>
      &nbsp;Last active {TimeCore.humanizeIso(
        participant.user.deviceLastActive,
        participant.trip.script.timezone)}
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

function renderAudio(participant) {
  if (!participant.values.audio || !participant.values.audio.name) {
    return null;
  }
  const audioStatus = participant.values.audio;
  const audioEntry = _.find(participant.trip.script.content.audio,
    { name: audioStatus.name });
  return (
    <div>
      <strong>Audio:</strong>
      &nbsp;{renderAudioStatus(audioStatus, audioEntry,
        participant.trip.script.timezone)}
    </div>
  );
}

function renderValues(participant) {
  if (!participant.values || !_.keys(participant.values).length) {
    return null;
  }
  return (
    <div>
      <div><strong>Values</strong></div>
      <pre>{yaml.safeDump(participant.values)}</pre>
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

function renderVars(participant) {
  const script = participant.trip.script;
  const trip = participant.trip;
  const user = participant.user;
  const currentPage = _.find(script.content.pages,
    { name: participant.currentPageName });
  const acknowledgedPage = _.find(script.content.pages,
    { name: participant.acknowledgedPageName });
  const acknowledgedPageAt = participant.acknowledgedPageAt;
  return (
    <div>
      <div>
        <strong>Role:</strong>
        &nbsp;
        <Link to={`/agency/live/${trip.groupId}/all/role/${participant.roleName}/${user ? user.id : 0}`}>
          {participant.roleName} ({user ? user.firstName : 'No user'})
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
      {renderGeo(participant)}
      {renderBatt(participant)}
      {renderActivity(participant)}
      {renderAudio(participant)}
      {renderValues(participant)}
    </div>
  );
}

export default function PlayerOverview({ participant }) {
  const map = renderMap(participant);
  const vars = renderVars(participant);
  return (
    <div className="row">
      <div className="col-sm-6">
        <Preview participant={participant} />
      </div>
      <div className="col-sm-6">
        {map}
        {vars}
      </div>
    </div>
  );
}

PlayerOverview.propTypes = {
  participant: PropTypes.object.isRequired
};
