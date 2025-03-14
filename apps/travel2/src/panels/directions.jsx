import React from 'react';
import PropTypes from 'prop-types';

import {
  MapContainer, Marker, TileLayer, Polyline
} from 'react-leaflet';

import L from 'leaflet';

// eslint-disable-next-line no-unused-vars
import PolylineEncoded from 'polyline-encoded';

// eslint-disable-next-line import/no-extraneous-dependencies
import fptCore from 'fptcore';
import distance from '../util/distance';

import 'leaflet/dist/leaflet.css';

L.Icon.Default.imagePath = '/static/images/';

const participantIcon = L.icon({
  iconUrl: '/static/images/marker-orange.png',
  iconRetinaUrl: '/static/images/marker-orange-2x.png',
  shadowUrl: '/static/images/marker-shadow.png',
  shadowRetinaUrl: '/static/images/marker-shadow@2x.png',
  iconSize: [25, 41],
  shadowSize: [41, 41],
  iconAnchor: [12, 41],
  shadowAnchor: [12, 41]
});

const MAPBOX_TILE_URL = 'https://api.mapbox.com/styles/v1/mapbox/outdoors-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZ2FiZXNtZWQiLCJhIjoiY2lxcGhsZjBjMDI2eGZubm5pa2RkZ2M3aSJ9.e_3OxrkDEvTfRx6HrbUPmg';

export default class DirectionsPanel extends React.Component {
  constructor(props) {
    super(props);
    this.onArrive = this.onArrive.bind(this);
    this.state = {
      center: null
    };
  }

  onArrive() {
    this.props.fireEvent({
      type: 'directions_arrived',
      directions_id: this.props.panel.id
    });
  }

  getWaypointOption(waypointName) {
    const scriptContent = this.props.evaluator.getScriptContent();
    const waypointOptions = this.props.evaluator.getWaypointOptions();
    return fptCore.WaypointCore.optionForWaypoint(scriptContent,
      waypointName, waypointOptions);
  }

  getFromWaypoint() {
    const routeName = this.props.panel.route;
    const route = (this.props.evaluator.getScriptContent().routes || [])
      .find(r => r.name === routeName);
    return route && this.getWaypointOption(route.from);
  }

  getToWaypoint() {
    if (this.props.panel.waypoint) {
      const waypointName = this.props.panel.waypoint;
      return this.getWaypointOption(waypointName);
    }
    const routeName = this.props.panel.route;
    const route = (this.props.evaluator.getScriptContent().routes || [])
      .find(r => r.name === routeName);
    return route && this.getWaypointOption(route.to);
  }

  getPolyline() {
    const route = this.getDirections();
    if (!route) { return []; }
    return L.Polyline.fromEncoded(route.polyline).getLatLngs();
  }

  getHeight() {
    // Limit map height on mobile
    const fullHeight = this.props.layoutHeight - 20;
    const maxHeight = window.innerWidth < 768 ? 300 : fullHeight;
    return Math.min(fullHeight, maxHeight);
  }

  getWaypointLocation() {
    const waypoint = this.getToWaypoint();
    if (!waypoint) { return null; }
    const { coords } = waypoint.location;
    return coords ? L.latLng(coords[0], coords[1]) : null;
  }

  getParticipantLocation() {
    const participant = this.props.evaluator.getParticipant();
    if (!participant || !participant.locationLatitude) { return null; }
    return L.latLng(participant.locationLatitude, participant.locationLongitude);
  }

  getDirections() {
    if (!this.props.panel.route) {
      return null;
    }

    const scriptContent = this.props.evaluator.getScriptContent();
    const routeName = this.props.panel.route;
    const route = (scriptContent.routes || []).find(r => r.name === routeName);
    if (!route) {
      return null;
    }

    const fromOption = this.getWaypointOption(route.from);
    const toOption = this.getWaypointOption(route.to);
    return (scriptContent.directions || []).find(direction => (
      direction.route === routeName
      && direction.from_option === fromOption.name
      && direction.to_option === toOption.name
    ));
  }

  getDistanceToWaypoint() {
    const participant = this.props.evaluator.getParticipant();
    if (!participant || !participant.locationLatitude) { return null; }
    const waypoint = this.getToWaypoint();
    if (!waypoint) { return null; }
    return distance(
      participant.locationLatitude,
      participant.locationLongitude,
      waypoint.location.coords[0],
      waypoint.location.coords[1]
    );
  }

  getDestinationName() {
    if (this.props.panel.destination_name) {
      return this.props.panel.destination_name;
    }
    if (this.getToWaypoint()) {
      return this.getToWaypoint().location.address || this.getToWaypoint().location.title;
    }
    return 'destination';
  }

  isCloseToWaypoint() {
    const distanceToWaypoint = this.getDistanceToWaypoint();
    return distanceToWaypoint !== null && distanceToWaypoint < 500;
  }

  hasArrivalTrigger() {
    return !!(this.props.evaluator.getScriptContent().triggers || []).find(trigger => (
      trigger.event
      && trigger.event.type === 'directions_arrived'
      && trigger.event.directions === this.props.panel.id
    ));
  }

  shouldShowArrivalConfirmation() {
    return this.isCloseToWaypoint() && this.hasArrivalTrigger();
  }

  renderPhoneFormat() {
    if (this.shouldShowArrivalConfirmation()) {
      return (
        <div className="pure-u-1-1 pure-visible-xs">
          <h3>
            Close to
            {this.getDestinationName()}
          </h3>
          <button className="pure-button pure-button-primary pure-button-block}" onClick={this.onArrive}>
            Confirm arrival
          </button>
        </div>
      );
    }
    return (
      <div className="pure-u-1-1 pure-visible-xs">
        <h3>
          Directions to&nbsp;
          {this.getDestinationName()}
        </h3>
      </div>
    );
  }

  renderMap() {
    const center = this.state.center || this.getParticipantLocation()
      || this.getWaypointLocation() || L.latLng(37.884223, -122.312019);
    const waypointMarker = this.getWaypointLocation() && (
      <Marker position={this.getWaypointLocation()} />
    );
    const participantMarker = this.getParticipantLocation() && (
      <Marker position={this.getParticipantLocation()} icon={participantIcon} />
    );
    return (
      <div className="pure-u-1-1 pure-u-sm-2-3 directions-map" style={{ height: this.getHeight() }}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', minHeight: '100%' }}>
          <TileLayer url={MAPBOX_TILE_URL} />
          <Polyline positions={this.getPolyline()} />
          {waypointMarker}
          {participantMarker}
        </MapContainer>
      </div>
    );
  }

  renderDirectionsHeader() {
    if (this.shouldShowArrivalConfirmation()) {
      return (
        <>
          <h2>
            Close to
            {this.getDestinationName()}
          </h2>
          <button className="pure-button pure-button-primary pure-button-block" onClick={this.onArrive}>
            Confirm arrival
          </button>
        </>
      );
    }

    if (!this.getToWaypoint()) {
      return null;
    }

    if (this.getDestinationName()) {
      return (
        <h2>
          Directions to
          {' '}
          {this.getDestinationName()}
        </h2>
      );
    }
    return null;
  }

  renderDirectionsList() {
    if (!this.getDirections()) {
      return null;
    }

    const renderedSteps = this.getDirections().steps.map(step => (
      <tr key={step.instructions}>
        <td className="directions-list-instruction">
          <div dangerouslySetInnerHTML={{ __html: step.instructions }} />
        </td>
        <td className="directions-list-distance">
          {step.distance}
        </td>
        <td className="directions-list-zoom" />
      </tr>
    ));

    return (
      <table className="pure-table pure-table-horizontal pure-table-striped">
        <tbody>
          {renderedSteps}
          <tr>
            <td className="directions-list-instruction">
              Arrive at
              {' '}
              <strong>{this.getDestinationName()}</strong>
            </td>
            <td className="directions-list-distance" />
            <td className="directions-list-zoom" />
          </tr>
        </tbody>
      </table>
    );
  }

  renderDirections() {
    return (
      <div className="pure-u-sm-1-3 directions-list scrollable" style={{ height: this.getHeight(), overflow: 'scroll' }}>
        <div className="directions-list-inner">
          {this.renderDirectionsHeader()}
          {this.renderDirectionsList()}
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="page-panel-directions pure-g">
        {this.renderPhoneFormat()}
        {this.renderMap()}
        {this.renderDirections()}
      </div>
    );
  }
}

DirectionsPanel.propTypes = {
  panel: PropTypes.object.isRequired,
  evaluator: PropTypes.object.isRequired,
  fireEvent: PropTypes.func.isRequired,
  layoutHeight: PropTypes.number.isRequired
};
