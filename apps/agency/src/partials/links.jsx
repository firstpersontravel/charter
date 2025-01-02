import React from 'react';

import { getPlayerIframeUrl, getPlayerJoinUrl, getActorIframeUrl } from '../utils';

export function renderActorLink(org, participant) {
  return (
    <a
      className="badge badge-secondary"
      target="_blank"
      rel="noreferrer noopener"
      href={getActorIframeUrl(org, participant)}>
      <i className="fa fa-external-link-alt mr-1" />
      Perform
    </a>
  );
}

export function renderPlayLink(trip, player) {
  if (!player) {
    return null;
  }
  return (
    <a
      className="badge badge-secondary"
      target="_blank"
      rel="noreferrer noopener"
      href={getPlayerIframeUrl(trip, player)}>
      <i className="fa fa-external-link-alt mr-1" />
      Play
    </a>
  );
}

export function renderJoinLink(trip, player) {
  if (!player) {
    return null;
  }
  return (
    <a
      className="badge badge-secondary"
      target="_blank"
      rel="noreferrer noopener"
      href={getPlayerJoinUrl(trip, player)}>
      <i className="fa fa-external-link-alt mr-1" />
      Join
    </a>
  );
}
