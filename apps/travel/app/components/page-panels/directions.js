import Ember from 'ember';

import distance from '../../utils/distance';
import WindowHeightMixin from '../../mixins/panels/window-height';

import fptCore from 'fptcore';

export default Ember.Component.extend(WindowHeightMixin, {

  contentEl: '.leaflet-container, .directions-list',
  footerEl: '.page-layout-tabs-menu',

  recenterThreshold: 5000,

  init: function() {
    this._super();
    L.Icon.Default.imagePath = '/static/images';

    var destinationLocation = this.get('destinationLocation');
    var originLocation = this.get('originLocation');
    var initialCenter = this.get('selfLocation') ||
      originLocation ||
      destinationLocation ||
      L.latLng(37.884223, -122.312019);
    this.set('centerLocation', initialCenter);
    this.set('waypointLocation', destinationLocation);
    this._lastRecenter = new Date();
  },

  path: function() {
    var route = this.get('directions');
    if (!route) { return []; }
    return L.Polyline.fromEncoded(route.polyline).getLatLngs();
  }.property('directions'),

  selfLocation: function() {
    var selfPlayer = this.get('player');
    if (!selfPlayer.get('participant.locationTimestamp')) { return null; }
    return L.latLng(
      selfPlayer.get('participant.locationLatitude'),
      selfPlayer.get('participant.locationLongitude'));
  }.property('player.participant.locationTimestamp'),

  centerLocation: null,
  waypointLocation: null,

  selfLocationDidChange: function() {
    var timeSinceRecenter = new Date() - this._lastRecenter;
    if (timeSinceRecenter > this.recenterThreshold) {
      this._lastRecenter = new Date();
      this.set('centerLocation', this.get('selfLocation'));
    }
  }.observes('selfLocation'),

  distanceToWaypoint: function() {
    var currentCoords = this.get('selfLocation');
    var destCoords = this.get('toWaypoint.location.coords');
    if (!currentCoords || !destCoords) {
      return null;
    }
    return distance(
      currentCoords.lat, currentCoords.lng,
      destCoords[0], destCoords[1]);
  }.property('selfLocation', 'toWaypoint'),

  isCloseToWaypoint: function() {
    var DEFAULT_DIST = 500;
    var distanceThreshold = this.get('toGeofence.distance') || DEFAULT_DIST;
    var distance = this.get('distanceToWaypoint');
    return distance !== null && distance < distanceThreshold;
  }.property('distanceToWaypoint'),

  hasArrivalTrigger: function() {
    return !!(this.get('trip.script.content.triggers') || []).find(trigger => (
      trigger.event &&
      trigger.event.type === 'directions_arrived' &&
      trigger.event.directions === this.get('params.id')
    ));
  }.property('params.id'),

  shouldShowArrivalConfirmation: function() {
    return this.get('isCloseToWaypoint') && this.get('hasArrivalTrigger');
  }.property('isCloseToWaypoint', 'hasArrivalTrigger'),

  directionsRoute: function() {
    if (!this.get('params.route')) { return null; }
    return this.get('trip.script.content.routes')
      .findBy('name', this.get('params.route'));
  }.property('params'),

  directions: function() {
    if (!this.get('params.route')) { return null; }
    var trip = this.get('trip');
    var scriptContent = trip.get('script.content');
    var waypointOptions = trip.get('waypointOptions');
    var routeName = this.get('params.route');
    var route = (scriptContent.routes || []).findBy('name', routeName);
    if (!route) {
      return null;
    }
    var fromOption = fptCore.WaypointCore.optionForWaypoint(scriptContent,
      route.from, waypointOptions);
    var toOption = fptCore.WaypointCore.optionForWaypoint(scriptContent,
      route.to, waypointOptions);
    return (scriptContent.directions || []).find(direction => (
      direction.route === routeName &&
      direction.from_option === fromOption.name &&
      direction.to_option === toOption.name
    ));
  }.property('params'),

  toGeofence: function() {
    if (!this.get('params.geofence')) { return null; }
    var toGeofenceName = this.get('params.geofence');
    return this.get('trip.script.content.geofences')
      .findBy('name', toGeofenceName);
  }.property('params'),

  fromWaypoint: function() {
    if (!this.get('params.route')) { return null; }
    var trip = this.get('trip');
    var waypointOptions = trip.get('waypointOptions');
    var fromWaypointName = this.get('directionsRoute').from;
    return fptCore.WaypointCore.optionForWaypoint(
      this.get('trip.script.content'),
      fromWaypointName, waypointOptions);
  }.property('params'),

  toWaypoint: function() {
    var trip = this.get('trip');
    var waypointOptions = trip.get('waypointOptions');
    if (!this.get('params.route')) {
      if (this.get('params.waypoint')) {
        return fptCore.WaypointCore.optionForWaypoint(
          this.get('trip.script.content'),
          this.get('params.waypoint'), waypointOptions);
      }
    }
    var toWaypointName = this.get('directionsRoute').to;
    return fptCore.WaypointCore.optionForWaypoint(
      this.get('trip.script.content'),
      toWaypointName, waypointOptions);
  }.property('params'),

  destinationName: function() {
    return this.get('params.destination_name') ||
      this.get('toWaypoint.location.address') ||
      this.get('toWaypoint.location.title');
  }.property('params', 'toWaypoint'),

  originLocation: function() {
    var coords = this.get('fromWaypoint.location.coords');
    return coords ? L.latLng(coords[0], coords[1]) : null;
  }.property('fromWaypoint'),

  destinationLocation: function() {
    var coords = this.get('toWaypoint.location.coords');
    return coords ? L.latLng(coords[0], coords[1]) : null;
  }.property('toWaypoint'),

  actions: {
    zoomToSelf: function() {
      this.set('centerLocation', this.get('selfLocation'));
    },
    zoomTo: function(step) {
      var stepStart = L.latLng(step.start[0], step.start[1]);
      this.setProperties({
        centerLocation: stepStart,
        waypointLocation: stepStart
      });
    },
    zoomToEnd: function() {
      var destinationLocation = this.get('destinationLocation');
      if (!destinationLocation) { return; }
      this.setProperties({
        centerLocation: destinationLocation,
        waypointLocation: destinationLocation
      });      
    },
    arrive: function() {
      this.triggerAction({
        action: 'directionsArrived',
        actionContext: [this.get('params.id')]
      });
    }
  }
});
