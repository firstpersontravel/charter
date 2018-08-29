import _ from 'lodash';
import moment from 'moment-timezone';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import { Circle, Map, Marker, Popup, TileLayer, Polyline, PropTypes as ReactLeafletPropTypes } from 'react-leaflet';
import L from 'leaflet';
import PolylineEncoded from 'polyline-encoded';

import { TextCore, WaypointCore } from 'fptcore';

import Constants from '../../../constants';
import withContext from './with-context';

const GROUPING_THRESHOLD = 20;

const ParticipantIcon = L.Icon.extend({
  options: {
    iconUrl: '/static/images/marker-icon.png',
    iconRetinaUrl: '/static/images/marker-icon-2x.png',
    shadowUrl: '/static/images/marker-shadow.png',
    shadowRetinaUrl: '/static/images/marker-shadow@2x.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
    className: ''
  }
});

const ActiveWaypointIcon = L.Icon.extend({
  options: {
    iconUrl: '/static/images/pin-orange-icon.png',
    iconRetinaUrl: '/static/images/pin-orange-icon-2x.png',
    shadowUrl: '/static/images/pin-shadow.png',
    shadowRetinaUrl: '/static/images/pin-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
    className: ''
  }
});

const HorseIcon = L.Icon.extend({
  options: {
    iconUrl: '/static/images/horse-icon.png',
    iconRetinaUrl: '/static/images/horse-icon-2x.png',
    shadowUrl: '/static/images/marker-shadow.png',
    shadowRetinaUrl: '/static/images/marker-shadow@2x.png',
    iconSize: [25, 41],
    shadowSize: [41, 41],
    iconAnchor: [12, 41],
    shadowAnchor: [12, 41]
  }
});

const userIcon = new HorseIcon();
const userIconExpired = new HorseIcon({
  className: 'marker-grayscale'
});
const actorIcon = new ParticipantIcon();
const actorIconLocExpired = new ParticipantIcon({
  className: 'marker-grayscale'
});

const activeWaypointIcon = new ActiveWaypointIcon({});

function renderGeofenceOptions(script, geofence) {
  const waypoints = script.content.waypoints || [];
  const waypoint = _.find(waypoints, { name: geofence.center });
  if (!waypoint) {
    return null;
  }
  const waypointOptions = WaypointCore.optionsForWaypoint(
    script.content, geofence.center);
  return waypointOptions.map(waypointOption => (
    <Circle
      key={`${geofence.name}-${waypointOption.name}`}
      center={L.latLng(waypointOption.coords[0], waypointOption.coords[1])}
      radius={geofence.distance}
      weight={2}
      fill={false}
      fillOpacity={0}>
      <Popup>
        <div>{TextCore.titleForTypedKey(geofence.name)}</div>
      </Popup>
    </Circle>
  ));
}

function groupByLocation(items, latProp, lngProp, threshold) {
  const itemGroups = [];
  items.forEach((item) => {
    const itemPos = L.latLng(
      _.get(item, latProp),
      _.get(item, lngProp));
    const nearbyGroups = itemGroups
      .filter((existingGroup) => {
        const groupPos = L.latLng(
          _.get(existingGroup[0], latProp),
          _.get(existingGroup[0], lngProp));
        return (groupPos.distanceTo(itemPos) < threshold);
      });
    if (nearbyGroups.length > 0) {
      nearbyGroups[0].push(item);
    } else {
      itemGroups.push([item]);
    }
  });
  return itemGroups;
}

function getZoomFit(center, dist, threshold) {
  const minZoom = 9;
  const maxZoom = 25;
  for (let zoom = minZoom; zoom < maxZoom; zoom += 0.5) {
    const metersPerPixel = (40075016.686 *
      Math.abs(Math.cos((center.lat * 180) / Math.PI))) /
      (2 ** (zoom + 8));
    const pixels = dist / metersPerPixel;
    if (pixels > threshold) {
      return zoom;
    }
  }
  return maxZoom;
}

function fastDist(coords1, coords2) {
  return (
    ((coords1[0] - coords2[0]) ** 2) +
    ((coords1[1] - coords2[1]) ** 2)
  );
}

function getPolylineRemaining(coords, currentCoords) {
  if (!currentCoords) {
    return coords;
  }
  const closetCoords = _.minBy(coords, latlng => (
    fastDist(latlng, currentCoords)
  ));
  const closestIndex = coords.indexOf(closetCoords);
  if (closestIndex === -1) {
    return coords;
  }
  const coordsRemaining = coords.slice(closestIndex);
  return coordsRemaining;
}

export default class GroupMap extends Component {

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  getWaypointLatLngs() {
    const script = this.props.trips[0].script;
    const waypoints = WaypointCore.getAllWaypointOptions(script.content);
    return waypoints
      .map(waypoint => (
        L.latLng(waypoint.coords[0], waypoint.coords[1])
      ));
  }

  getRoutePolylines() {
    const script = this.props.trips[0].script;
    const directions = script.content.directions || [];
    const polylines = directions.map((directionsItem) => {
      const latlngs = PolylineEncoded.decode(directionsItem.polyline);
      return (
        <Polyline
          key={`${directionsItem.name}-${directionsItem.polyline}`}
          positions={latlngs}
          weight={4} />
      );
    });
    return polylines;
  }

  getActiveRoutePolylines() {
    const script = this.props.trips[0].script;
    const LinkWithContext = withContext(Link, this.context);
    const activeParticipants = _(this.props.trips)
      .map('participants')
      .flatten()
      .filter('currentPageName')
      .value();

    return _(activeParticipants)
      .map((participant) => {
        const participantLink = (
          <LinkWithContext to={`/agency/live/${participant.trip.groupId}/trip/${participant.trip.id}/participants/${participant.roleName}`}>
            {participant.trip.departureName}{' '}
            {participant.roleName}
          </LinkWithContext>
        );
        const pageName = participant.currentPageName;
        const page = _.find(script.content.pages, { name: pageName });
        if (page.waypoint) {
          const waypointOption = WaypointCore.optionForWaypoint(
            script.content, page.waypoint,
            participant.trip.values.waypoint_options);
          return [
            <Marker
              key={`${participant.id}-target`}
              position={waypointOption.coords}
              icon={activeWaypointIcon}>
              <Popup>
                <div>
                  {participantLink} at {page.title}
                </div>
              </Popup>
            </Marker>
          ];
        }
        if (!page.route) {
          return null;
        }
        const directions = WaypointCore.directionsForRoute(
          script.content, page.route,
          participant.trip.values.waypoint_options);
        const coords = PolylineEncoded.decode(directions.polyline);
        const destination = coords[coords.length - 1];
        const user = participant.user;
        const userCoords = user &&
          user.locationLatitude &&
          [user.locationLatitude, user.locationLongitude];
        const coordsRemaining = getPolylineRemaining(coords, userCoords);
        return [
          <Polyline
            key={participant.id}
            positions={coordsRemaining}
            color={'#f3a842'}
            weight={6} />,
          <Marker
            key={`${participant.id}-target`}
            position={destination}
            icon={activeWaypointIcon}>
            <Popup>
              <div>
                {participantLink} destination of {page.title}
              </div>
            </Popup>
          </Marker>
        ];
      })
      .filter(Boolean)
      .flatten()
      .value();
  }

  getUsersWithLoc() {
    const participants = _.flatMap(this.props.trips, 'participants');
    const users = _.uniq(_.filter(_.map(participants, 'user'), Boolean));
    const usersWithLoc = _.filter(users, 'locationLatitude');
    return usersWithLoc;
  }

  getParticipantGroups() {
    const participants = _.filter(
      _.flatMap(this.props.trips, 'participants'),
      'user.locationLatitude');
    return groupByLocation(participants,
      'user.locationLatitude',
      'user.locationLongitude',
      GROUPING_THRESHOLD);
  }

  renderMarkerParticipantSection(participant) {
    const timezone = this.props.trips[0].script.timezone;
    const LinkWithContext = withContext(Link, this.context);
    return (
      <div key={participant.id}>
        <div>
          <LinkWithContext to={`/agency/live/${participant.trip.groupId}/trip/${participant.trip.id}/participants/${participant.roleName}`}>
            {participant.trip.departureName}{' '}
            {participant.roleName}{' '}
            ({participant.user.firstName})
          </LinkWithContext>
        </div>
        <div style={{ marginBottom: '0.25em' }}>
          <i className="fa fa-location-arrow" />
          &nbsp;{moment
            .utc(participant.user.locationTimestamp)
            .tz(timezone)
            .format('ddd, h:mmA z')}
        </div>
      </div>
    );
  }

  renderMarker(participantGroup) {
    const user = participantGroup[0].user;
    const oneHourAgo = moment.utc().subtract(1, 'hour');
    const locatedAt = moment.utc(user.locationTimestamp);
    const locIsRecent = locatedAt.isAfter(oneHourAgo);
    const isActor = participantGroup[0].role.actor;
    const icons = isActor ?
      [actorIcon, actorIconLocExpired] :
      [userIcon, userIconExpired];
    const icon = locIsRecent ? icons[0] : icons[1];
    const position = L.latLng(
      user.locationLatitude,
      user.locationLongitude);
    const participantSections = participantGroup
      .map(participant => (
        this.renderMarkerParticipantSection(participant)
      ));
    return (
      <Marker key={user.id} position={position} icon={icon}>
        <Popup>
          <div>
            {participantSections}
          </div>
        </Popup>
      </Marker>
    );
  }

  renderMarkers() {
    const participantGroups = this.getParticipantGroups();
    return participantGroups.map(participantGroup => (
      this.renderMarker(participantGroup)
    ));
  }

  renderGeofences() {
    const script = this.props.trips[0].script;
    const geofences = script.content.geofences || [];
    return _(geofences)
      .map(geofence => (
        renderGeofenceOptions(script, geofence)
      ))
      .flatten()
      .value();
  }

  render() {
    if (!this.props.trips.length) {
      return <div>Error - please reload</div>;
    }
    const allRoutes = this.getRoutePolylines();
    const activeRoutes = this.getActiveRoutePolylines();
    const latLngs = (allRoutes.length > 0) ?
      allRoutes.map(polyline => polyline.props.positions[0]) :
      this.getWaypointLatLngs();

    if (latLngs.length === 0) {
      return <div>No map locations</div>;
    }

    const bounds = L.latLngBounds(latLngs).pad(0.1);
    const markers = this.renderMarkers();
    const geofences = this.renderGeofences();
    const center = this.props.center || bounds.getCenter();

    const dist = bounds.getSouthWest().distanceTo(bounds.getNorthEast());
    const zoom = this.props.zoom || getZoomFit(center, dist, 200);

    return (
      <Map
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        minZoom={9}
        maxZoom={18}
        zoomSnap={0.5}>
        <TileLayer url={Constants.MAPBOX_TILE_URL} />
        {allRoutes}
        {activeRoutes}
        {geofences}
        {markers}
      </Map>
    );
  }
}

L.Icon.Default.imagePath = '/static/images/';

GroupMap.propTypes = {
  center: ReactLeafletPropTypes.latlng,
  zoom: PropTypes.number,
  trips: PropTypes.array.isRequired
};

GroupMap.defaultProps = {
  center: null,
  zoom: null
};
