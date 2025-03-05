import React, { createRef } from 'react';
import PropTypes from 'prop-types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCrosshairs } from '@fortawesome/free-solid-svg-icons'

import { Circle, Map, Marker, Popup, TileLayer, Polyline } from 'react-leaflet';

import L from 'leaflet';
import PolylineEncoded from 'polyline-encoded';

L.Icon.Default.imagePath = '/static/images/';

// eslint-disable-next-line import/no-extraneous-dependencies
import fptCore from 'fptcore';

import 'leaflet/dist/leaflet.css';

const MAPBOX_TILE_URL = 'https://api.mapbox.com/styles/v1/mapbox/outdoors-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZ2FiZXNtZWQiLCJhIjoiY2lxcGhsZjBjMDI2eGZubm5pa2RkZ2M3aSJ9.e_3OxrkDEvTfRx6HrbUPmg';

export default class DirectionsPanel extends React.Component {
  constructor(props) {
    super(props);
    this.elementRef = createRef();
    this.updateRect = this.updateRect.bind(this);
    this.state = { rect: null };
  }

  onArrive() {}

  updateRect() {
    if (this.elementRef.current) {
      this.setState({ rect: this.elementRef.current.getBoundingClientRect() });
    }
  };

  componentDidMount() {
    this.updateRect();
    window.addEventListener('resize', this.updateRect);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateRect);
  }

  shouldShowArrivalConfirmation() {
    return false;
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

  getWaypointOption(waypointName) {
    const scriptContent = this.props.evaluator.getScriptContent();
    const waypointOptions = this.props.evaluator.getWaypointOptions();
    const routeName = this.props.panel.route;
    const route = (scriptContent.routes || []).find(r => r.name === routeName);
    if (!route) {
      return null;
    }
    return fptCore.WaypointCore.optionForWaypoint(scriptContent,
      waypointName, waypointOptions);
  }

  getFromWaypoint() {
    const routeName = this.props.panel.route;
    const route = (this.props.evaluator.getScriptContent().routes || []).find(r => r.name === routeName);
    return route && this.getWaypointOption(route.from);
  }

  getToWaypoint() {
    const routeName = this.props.panel.route;
    const route = (this.props.evaluator.getScriptContent().routes || []).find(r => r.name === routeName);
    return route && this.getWaypointOption(route.to);
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
      direction.route === routeName &&
      direction.from_option === fromOption.name &&
      direction.to_option === toOption.name
    ));
  }

  onZoomToSelf() {

  }

  onZoomToEnd() {

  }

  onZoomTo(step) {

  }

  renderPhoneFormat() {
    if (this.shouldShowArrivalConfirmation()) {
      return (
        <div className="pure-u-1-1 pure-visible-xs">
          <h3>Close to {this.getDestinationName()}</h3>
          <button className="pure-button pure-button-primary pure-button-block}" onClick={this.onArrive}>
            Confirm arrival
          </button>
        </div>
      );
    }
    return (
      <div className="pure-u-1-1 pure-visible-xs">
        <h3>Directions to {this.getDestinationName()}</h3>
      </div>
    );
  }

  getHeight() {
    if (!this.state.rect) {
      return 1000;
    }
    const bottomPadding = 35;
    return window.innerHeight - this.state.rect.top - bottomPadding;
  }

  renderMap() {
    return (
      <div className="pure-u-1-1 pure-u-sm-2-3 directions-map">
        <Map center={[37.7749, -122.4194]} zoom={13} style={{ height: this.getHeight() }}>
          <TileLayer url={MAPBOX_TILE_URL} />
          <Marker position={[37.7749, -122.4194]}>
            <Popup>
              A pretty CSS3 popup. <br/> Easily customizable.
            </Popup>
          </Marker>
        </Map>
      </div>
    );
  }

  renderDirectionsHeader() {
    if (this.shouldShowArrivalConfirmation()) {
      return (
        <>
          <h2>Close to {this.getDestinationName()}</h2>
          <button className="pure-button pure-button-primary pure-button-block" onClick={this.onArrive}>
            Confirm arrival
          </button>
        </>
      );
    }

    if (!this.getToWaypoint()) {
      return null;
    }

    let title = null;
    let destinationTitle = 'destination';
    if (this.getDestinationName()) {
      title = (
        <h2>
          Directions to {this.getDestinationName()}
        </h2>
      );
      destinationTitle += `: ${this.getDestinationName()}`;
    }

    return (
      <>
        {title}
        <p>
          <button className="pure-button pure-button-block" onClick={this.onZoomToSelf}>
            Zoom to current location
          </button>
        </p>
        <p>
          <button className="pure-button pure-button-block" onClick={this.onZoomToEnd}>
            Zoom to {destinationTitle}
          </button>
        </p>
      </>
    );
  }

  renderDirectionsList() {
    if (!this.getDirections()) {
      return null;
    }

    const renderedSteps = this.getDirections().steps.map((step) => (
      <tr key={step.instructions}>
        <td className="directions-list-instruction">
          <div dangerouslySetInnerHTML={{ __html: step.instructions }} />
        </td>
        <td className="directions-list-distance">
          {step.distance}
        </td>
        <td className="directions-list-zoom">
          <button className="pure-button" onClick={() => this.onZoomTo(step)}>
            <FontAwesomeIcon icon={faCrosshairs} />
          </button>
        </td>
      </tr>
    ));

    return (
      <table className="pure-table pure-table-horizontal pure-table-striped">
        <tbody>
          {renderedSteps}
          <tr>
            <td className="directions-list-instruction">
              Arrive at <strong>{this.getDestinationName()}</strong>
            </td>
            <td className="directions-list-distance"></td>
            <td className="directions-list-zoom">
              <button className="pure-button" onClick={this.onZoomToEnd}>
                <FontAwesomeIcon icon={faCrosshairs} />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  renderDirections() {
    return (
      <div className="pure-u-sm-1-3 directions-list scrollable">
        <div className="directions-list-inner">
          {this.renderDirectionsHeader()}
          {this.renderDirectionsList()}
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="page-panel-directions pure-g" ref={this.elementRef}>
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
  fireEvent: PropTypes.func.isRequired
};
