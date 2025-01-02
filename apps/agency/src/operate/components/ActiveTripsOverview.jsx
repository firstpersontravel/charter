import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { RoleCore, SceneCore } from 'fptcore';

import ActiveTripsMap from '../partials/ActiveTripsMap';
import { renderActorLink, renderJoinLink, renderPlayLink } from '../../partials/links';

function getAllPlayers(trips) {
  return _(trips)
    .map('players')
    .flatten()
    .value();
}

function getTripPlayer(trip, roleName, participant) {
  return trip.players.find(p => (
    p.roleName === roleName &&
    p.participantId === (participant ? participant.id : null)
  ));
}

function renderExternalLink(trips, role, participant) {
  if (!trips.length) {
    return null;
  }
  if (trips.length > 1 && participant) {
    return renderActorLink(trips[0].org, participant);
  }
  const trip = trips[0];
  const player = getTripPlayer(trip, role.name, participant);
  if (player) {
    const playerLink = renderPlayLink(trip, player);
    return player.participantId ? playerLink : (
      <React.Fragment>
        {playerLink} {renderJoinLink(trip, player)}
      </React.Fragment>
    );
  }
  return null;
}

export default class ActiveTripsOverview extends Component {
  renderRoleParticipant(role, participant) {
    const participantId = participant ? participant.id : 0;
    const participantName = participant ? participant.name : 'No user';
    const trips = this.props.trips
      .filter(trip => getTripPlayer(trip, role.name, participant));
    if (!trips.length) {
      return null;
    }
    const tripTitles = trips.map(t => t.title).join(', ');
    const externalLink = renderExternalLink(trips, role, participant);
    return (
      <div key={`${role.name}-${participantId}`} className="constrain-text">
        <Link
          to={`/${this.props.org.name}/${this.props.experience.name}/operate/role/${role.name}/${participantId}`}>
          <strong>{role.title}</strong> ({participantName}, {tripTitles})
        </Link> {externalLink}
      </div>
    );
  }

  renderRole(role, participants) {
    return participants.map(participant => this.renderRoleParticipant(role, participant));
  }

  renderTrip(trip) {
    const currentScene = _.find(trip.script.content.scenes, {
      name: trip.tripState.currentSceneName
    });
    const currentSceneTitle = currentScene ? currentScene.title :
      'Not started';
    return (
      <div key={trip.id}>
        <Link
          to={`/${this.props.org.name}/${this.props.experience.name}/operate/trip/${trip.id}`}>
          <strong>{trip.title}:</strong> {currentSceneTitle}
        </Link>
      </div>
    );
  }

  renderAllPlayers() {
    const renderedTrips = this.props.trips
      .map(trip => this.renderTrip(trip));

    const script = this.props.script;
    const roles = _(script.content.roles)
      .filter(role => RoleCore.canRoleHaveParticipant(script.content, role))
      .sort(SceneCore.sortResource)
      .value();
    const allPlayers = getAllPlayers(this.props.trips);

    function participantsForRole(role) {
      return _(allPlayers)
        .filter(player => player.role && player.role.interface)
        .filter({ roleName: role.name })
        .map('participant')
        .uniq()
        .flatten()
        .value();
    }

    const renderedPlayers = roles.map(role => (
      this.renderRole(role, participantsForRole(role))
    ));

    return (
      <div>
        <div className="mb-2">
          <h5>Runs</h5>
          {renderedTrips}
        </div>
        <div className="mb-2">
          <h5>Participants</h5>
          {renderedPlayers}
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        <div className="row">
          <div className="col-md-7">
            <ActiveTripsMap
              directions={this.props.directions}
              trips={this.props.trips} />
          </div>
          <div className="col-md-5">
            {this.renderAllPlayers()}
          </div>
        </div>
      </div>
    );
  }
}

ActiveTripsOverview.propTypes = {
  org: PropTypes.object.isRequired,
  experience: PropTypes.object.isRequired,
  script: PropTypes.object.isRequired,
  trips: PropTypes.array.isRequired,
  directions: PropTypes.array.isRequired
};
