import Ember from 'ember';
import EmberLeafletComponent from 'ember-leaflet/components/leaflet-map';
import WindowHeightMixin from '../../../mixins/panels/window-height';
import PolylineLayer from 'ember-leaflet/layers/polyline';
import MarkerLayer from 'ember-leaflet/layers/marker';
import TileLayer from 'ember-leaflet/layers/tile';

var isHeadlandsGamble = window.location.pathname.indexOf('Tablet') > -1;
var userIcon = isHeadlandsGamble ? 'horse-icon' : 'marker-orange';

var horseIcon = L.icon({
  iconUrl: '/static/images/' + userIcon + '.png',
  iconRetinaUrl: '/static/images/' + userIcon + '-2x.png',
  shadowUrl: '/static/images/marker-shadow.png',
  shadowRetinaUrl: '/static/images/marker-shadow@2x.png',
  iconSize:     [25, 41],
  shadowSize:   [41, 41],
  iconAnchor:   [12, 41],
  shadowAnchor: [12, 41]
});

export default EmberLeafletComponent.extend(WindowHeightMixin, {

  contentEl: '',

  childLayers: [

    // Tile layer
    TileLayer.extend({
      tileUrl: 'https://api.mapbox.com/styles/v1/mapbox/outdoors-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZ2FiZXNtZWQiLCJhIjoiY2lxcGhsZjBjMDI2eGZubm5pa2RkZ2M3aSJ9.e_3OxrkDEvTfRx6HrbUPmg'
    }),

    // Overview path
    PolylineLayer.extend({
      options: {opacity: 0.6, weight: 10},
      locations: Ember.computed.oneWay('parentLayer.path')
    }),

    // Self
    MarkerLayer.extend({
      location: Ember.computed.oneWay('parentLayer.selfLocation'),
      options: {
        icon: horseIcon
      }
    }),

    // Next waypoint
    MarkerLayer.extend({
      location: Ember.computed.oneWay('parentLayer.waypointLocation')
    })
  ]
});
