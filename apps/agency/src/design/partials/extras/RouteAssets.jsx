import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import StaticMapImg from '../StaticMapImg';

class RouteOption extends Component {
  constructor(props) {
    super(props);
    this.state = { fetching: false, error: null };
    this.handleFetch = this.handleFetch.bind(this);
  }

  getDirAsset() {
    return _.find(this.props.directions, dir => (
      dir.data.from_option === this.props.fromOpt.name &&
      dir.data.to_option === this.props.toOpt.name
    ));
  }

  fetchGoogleRoute() {
    const directionsService = new google.maps.DirectionsService();
    const fromOpt = this.props.fromOpt;
    const toOpt = this.props.toOpt;
    const mode = this.props.route.mode || 'driving';
    const request = {
      origin: `${fromOpt.location.coords[0]},${fromOpt.location.coords[1]}`,
      destination: `${toOpt.location.coords[0]},${toOpt.location.coords[1]}`,
      travelMode: mode.toUpperCase()
    };
    if (this.props.route.via && this.props.route.via.length > 0) {
      request.waypoints = this.props.route.via.map(coords => ({
        location: new google.maps.LatLng(coords[0], coords[1])
      }));
    }
    return new Promise((resolve, reject) => {
      directionsService.route(request, (result, status) => {
        if (status === 'OK') {
          resolve(result.routes[0]);
          return;
        }
        reject(new Error(`Failed to fetch directions: ${status}.`));
      });
    });
  }

  directionsAssetDataForGoogleRoute(googleRoute) {
    const leg = googleRoute.legs[0];
    const steps = leg.steps.map(step => ({
      start: [step.start_location.lat(), step.start_location.lng()],
      instructions: step.instructions,
      distance: step.distance.text
    }));
    return {
      route: this.props.route.name,
      from_option: this.props.fromOpt.name,
      to_option: this.props.toOpt.name,
      start: [leg.start_location.lat(), leg.start_location.lng()],
      end: [leg.end_location.lat(), leg.end_location.lng()],
      steps: steps,
      polyline: googleRoute.overview_polyline
    };
  }

  handleFetch() {
    this.setState({ fetching: true, error: null });
    this.fetchGoogleRoute()
      .then((googleRoute) => {
        this.setState({ fetching: false, error: null });
        const data = this.directionsAssetDataForGoogleRoute(googleRoute);
        this.updateAsset(data);
      })
      .catch((err) => {
        this.setState({ fetching: false, error: err.message });
      });
  }

  updateAsset(newData) {
    const assetName = `${this.props.fromOpt.name} to ${this.props.toOpt.name}`;
    const dirAsset = this.getDirAsset();
    if (dirAsset) {
      this.props.updateInstance('assets', dirAsset.id, {
        data: newData
      });
    } else {
      this.props.createInstance('assets', {
        orgId: this.props.script.orgId,
        experienceId: this.props.script.experienceId,
        type: 'directions',
        name: assetName,
        data: newData
      });
    }
  }

  renderFetchBtn() {
    const dirAsset = this.getDirAsset();
    const fetchClass = dirAsset ? 'btn-outline-secondary' : 'btn-primary';
    let fetchTitle = dirAsset ? 'Refetch' : 'Fetch';
    if (this.state.fetching) {
      fetchTitle = 'Fetching';
    } else if (this.state.error) {
      fetchTitle = `Error: ${this.state.error}`;
    }
    return (
      <button
        disabled={this.state.fetching}
        onClick={this.handleFetch}
        className={`btn btn-xs ${fetchClass}`}>
        {fetchTitle}
      </button>
    );
  }

  render() {
    const fromOpt = this.props.fromOpt;
    const toOpt = this.props.toOpt;
    const dirAsset = this.getDirAsset();
    const status = dirAsset ? (
      <span className="text-success">
        Updated {moment.utc(dirAsset.updatedAt).format('MMM DD, YYYY')}
      </span>
    ) : (
      <span className="text-danger">Not generated</span>
    );
    return (
      <div>
        {fromOpt.title} to {toOpt.title}: {status}&nbsp;
        {this.renderFetchBtn()}
      </div>
    );
  }
}

RouteOption.propTypes = {
  script: PropTypes.object.isRequired,
  route: PropTypes.object.isRequired,
  directions: PropTypes.array.isRequired,
  fromOpt: PropTypes.object.isRequired,
  toOpt: PropTypes.object.isRequired,
  createInstance: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired
};

function RouteOptions(script, route, directions, createInstance, updateInstance) {
  const fromWaypoint = _.find(script.content.waypoints,
    { name: route.from });
  const toWaypoint = _.find(script.content.waypoints,
    { name: route.to });
  if (!fromWaypoint || !toWaypoint) {
    return null;
  }

  const opts = _(fromWaypoint.options)
    .map(fromOpt => (
      _(toWaypoint.options)
        .map(toOpt => (
          <RouteOption
            key={`${fromOpt.name}-${toOpt.name}`}
            script={script}
            route={route}
            fromOpt={fromOpt}
            toOpt={toOpt}
            directions={directions}
            createInstance={createInstance}
            updateInstance={updateInstance} />
        ))
        .value()
    ))
    .flatten()
    .value();

  return (
    <div>
      {opts}
    </div>
  );
}

export default function RouteAssets({ script, resource, assets,
  createInstance, updateInstance }) {
  const directions = _(assets)
    .filter({ type: 'directions' })
    .filter(asset => asset.data.route === resource.name)
    .value();
  const numDirections = directions.length;

  const polylines = directions.map(d => d.data.polyline);
  const img = numDirections > 0 ? (
    <StaticMapImg
      className="card-img-top"
      size="1000x250"
      polylines={polylines} />
  ) : null;

  const renderedRouteOptions = RouteOptions(script, resource, directions,
    createInstance, updateInstance);

  return (
    <div className="card">
      {img}
      <div className="card-body">
        {renderedRouteOptions}
      </div>
    </div>
  );
}

RouteAssets.propTypes = {
  script: PropTypes.object.isRequired,
  resource: PropTypes.object.isRequired,
  assets: PropTypes.array.isRequired,
  createInstance: PropTypes.func.isRequired,
  updateInstance: PropTypes.func.isRequired
};
