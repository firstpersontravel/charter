import config from './config';

export function getStage() {
  return config.stage;
}

export function isProduction() {
  return getStage() === 'production';
}

export function getActorIframeUrl(group, participant) {
  return `${window.location.origin}/actor/${group.org.name}/${group.id}/${participant.id}`;
}

export function getPlayerIframeUrl(trip, player) {
  return `${window.location.origin}/travel/${trip.id}/${player.id}`;
}

export function getPlayerJoinUrl(trip, player) {
  return `${window.location.origin}/entry/t/${trip.id}/r/${player.roleName}`;
}
