import _ from 'lodash';
import moment from 'moment-timezone';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  Circle, MapContainer, Marker, Popup, TileLayer, Polyline
} from 'react-leaflet';
import L from 'leaflet';
import PolylineEncoded from 'polyline-encoded';

import { WaypointCore } from 'fptcore';

import Constants from '../../constants.ts';
import RouterForwarder from './RouterForwarder';

const GROUPING_THRESHOLD = 20;

const PlayerIcon = L.Icon.extend({
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

const participantIcon = new PlayerIcon();
const participantIconExpired = new PlayerIcon({
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
    script.content, geofence.center
  );
  return waypointOptions.map(waypointOption => (
    <Circle
      key={`${geofence.name}-${waypointOption.name}`}
      center={L.latLng(waypointOption.location.coords[0], waypointOption.location.coords[1])}
      radius={geofence.distance}
      weight={2}
      fill={false}
      fillOpacity={0}>
      <Popup>
        <div>
          {geofence.distance}
          m around
          {waypoint.title}
        </div>
      </Popup>
    </Circle>
  ));
}

function groupByLocation(items, latProp, lngProp, threshold) {
  const itemGroups = [];
  items.forEach((item) => {
    const itemPos = L.latLng(
      _.get(item, latProp),
      _.get(item, lngProp)
    );
    const nearbyGroups = itemGroups
      .filter((existingGroup) => {
        const groupPos = L.latLng(
          _.get(existingGroup[0], latProp),
          _.get(existingGroup[0], lngProp)
        );
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
    const metersPerPixel = (40075016.686
      * Math.abs(Math.cos((center.lat * 180) / Math.PI)))
      / (2 ** (zoom + 8));
    const pixels = dist / metersPerPixel;
    if (pixels > threshold) {
      return zoom;
    }
  }
  return maxZoom;
}

function fastDist(coords1, coords2) {
  return (
    ((coords1[0] - coords2[0]) ** 2)
    + ((coords1[1] - coords2[1]) ** 2)
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

export default class ActiveTripsMap extends Component {
  getWaypointLatLngs() {
    const { script } = this.props.trips[0];
    const waypoints = WaypointCore.getAllWaypointOptions(script.content);
    return waypoints
      .map(waypoint => (
        L.latLng(waypoint.location.coords[0], waypoint.location.coords[1])
      ));
  }

  getRoutePolylines() {
    const directions = this.props.directions || [];
    const polylines = directions.map((directionsItem) => {
      const latlngs = PolylineEncoded.decode(directionsItem.data.polyline);
      return (
        <Polyline
          key={directionsItem.id}
          positions={latlngs}
          weight={4} />
      );
    });
    return polylines;
  }

  getActiveRoutePolylines() {
    const { script } = this.props.trips[0];
    const activePlayers = _(this.props.trips)
      .map('players')
      .flatten()
      .filter((player) => {
        const trip = _.find(this.props.trips, { id: player.tripId });
        const pageNamesByRole = trip.tripState.currentPageNamesByRole || {};
        return !!pageNamesByRole[player.roleName];
      })
      .value();

    return _(activePlayers)
      .map((player) => {
        const trip = _.find(this.props.trips, { id: player.tripId });
        const role = (script.content.roles || []).find(r => r.name === player.roleName);
        const playerLink = (
          <Link to={`/${trip.org.name}/${trip.experience.name}/operate/role/${player.roleName}/${player.participantId || 0}`}>
            {trip.title}
            {role ? `: ${role.title}` : ''}
          </Link>
        );
        const pageName = trip.tripState.currentPageNamesByRole[player.roleName];
        const page = _.find(script.content.pages, { name: pageName });
        if (!page) {
          return null;
        }
        if (page.waypoint) {
          const waypointOption = WaypointCore.optionForWaypoint(
            script.content, page.waypoint,
            trip.waypointOptions
          );
          return [
            <Marker
              key={`${player.id}-target`}
              position={waypointOption.location.coords}
              icon={activeWaypointIcon}>
              <Popup>
                <RouterForwarder context={this.context}>
                  <div>
                    {playerLink}
                    &nbsp;at&nbsp;
                    {page.title}
                  </div>
                </RouterForwarder>
              </Popup>
            </Marker>
          ];
        }
        if (!page.route) {
          return null;
        }

        const route = _.find(script.content.routes, { name: page.route });
        if (!route) {
          return null;
        }
        const fromOption = WaypointCore.optionForWaypoint(script.content,
          route.from, trip.waypointOptions);
        const toOption = WaypointCore.optionForWaypoint(script.content,
          route.to, trip.waypointOptions);
        const directions = _.find(this.props.directions, {
          data: {
            route: page.route,
            from_option: fromOption.name,
            to_option: toOption.name
          }
        });
        if (!directions) {
          return null;
        }
        const coords = PolylineEncoded.decode(directions.data.polyline);
        const destination = coords[coords.length - 1];
        const { participant } = player;
        const participantCoords = participant
          && participant.locationLatitude
          && [participant.locationLatitude, participant.locationLongitude];
        const coordsRemaining = getPolylineRemaining(coords, participantCoords);
        return [
          <Polyline
            key={player.id}
            positions={coordsRemaining}
            color="#f3a842"
            weight={6} />,
          <Marker
            key={`${player.id}-target`}
            position={destination}
            icon={activeWaypointIcon}>
            <Popup>
              <RouterForwarder context={this.context}>
                <div>
                  {playerLink}
                  {' '}
                  destination of
                  {page.title}
                </div>
              </RouterForwarder>
            </Popup>
          </Marker>
        ];
      })
      .filter(Boolean)
      .flatten()
      .value();
  }

  getPlayerGroups() {
    const players = _.filter(
      _.flatMap(this.props.trips, 'players'),
      'participant.locationLatitude'
    );
    return groupByLocation(players,
      'participant.locationLatitude',
      'participant.locationLongitude',
      GROUPING_THRESHOLD);
  }

  renderMarkerPlayerSection(player) {
    const trip = _.find(this.props.trips, { id: player.tripId });
    const role = (trip.script.content.roles || []).find(r => r.name === player.roleName);
    const { timezone } = this.props.trips[0].experience;
    return (
      <div key={player.id}>
        <div>
          <Link to={`/${trip.org.name}/${trip.experience.name}/operate/role/${player.roleName}/${player.participantId || 0}`}>
            {trip.title}
            {' '}
            {role.title}
            {' '}
            (
            {player.participant.name}
            )
          </Link>
        </div>
        <div className="mb-1">
          <i className="fa fa-location-arrow" />
          &nbsp;
          {moment
            .utc(player.participant.locationTimestamp)
            .tz(timezone)
            .format('ddd, h:mmA z')}
        </div>
      </div>
    );
  }

  renderMarker(playerGroup) {
    const { participant } = playerGroup[0];
    const oneHourAgo = moment.utc().subtract(1, 'hour');
    const locatedAt = moment.utc(participant.locationTimestamp);
    const locIsRecent = locatedAt.isAfter(oneHourAgo);
    const icon = locIsRecent ? participantIcon : participantIconExpired;
    const position = L.latLng(
      participant.locationLatitude,
      participant.locationLongitude
    );
    const playerSections = playerGroup
      .map(player => (
        this.renderMarkerPlayerSection(player)
      ));
    return (
      <Marker key={participant.id} position={position} icon={icon}>
        <Popup>
          <RouterForwarder context={this.context}>
            <div>
              {playerSections}
            </div>
          </RouterForwarder>
        </Popup>
      </Marker>
    );
  }

  renderMarkers() {
    const playerGroups = this.getPlayerGroups();
    return playerGroups.map(playerGroup => (
      this.renderMarker(playerGroup)
    ));
  }

  renderGeofences() {
    const { script } = this.props.trips[0];
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
    const latLngs = (allRoutes.length > 0)
      ? allRoutes.map(polyline => polyline.props.positions[0])
      : this.getWaypointLatLngs();

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
      <MapContainer
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
      </MapContainer>
    );
  }
}

L.Icon.Default.imagePath = '/static/images/';

ActiveTripsMap.propTypes = {
  center: PropTypes.instanceOf(L.LatLng),
  zoom: PropTypes.number,
  directions: PropTypes.array,
  trips: PropTypes.array.isRequired
};

ActiveTripsMap.defaultProps = {
  center: null,
  zoom: null,
  directions: []
};
