import React, { Component } from 'react';
import PropTypes from 'prop-types';

import BaseEmpty from './BaseEmpty';
import PopoverControl from '../../../partials/PopoverControl';
import { typeTitleForSpec, labelForSpec } from '../../utils/spec-utils';
import { bottomHelpForSpec } from './BaseString';
import StaticMapImg from '../StaticMapImg';

const TITLE_TYPES = ['establishment', 'park', 'point_of_interest', 'tourist_attraction'];

function longNameForResultTypes(result, types) {
  for (const type of types) {
    for (const addressComponent of result.address_components) {
      if (addressComponent.types.includes(type)) {
        return addressComponent.long_name;
      }
    }
  }
  return null;
}

function titleForResult(result) {
  const title = longNameForResultTypes(result, TITLE_TYPES);
  if (title) {
    return title;
  }
  const streetNum = longNameForResultTypes(result, ['street_number']);
  const streetName = longNameForResultTypes(result, ['route']);
  if (streetNum || streetName) {
    return `${streetNum || ''}${streetNum && streetName ? ' ' : ''}${streetName}`;
  }
  return result.formatted_address;
}

function labelForLocation(value) {
  return value.title || value.address || value.coords.map(i => i.toFixed(6).join(', '));
}

class LocationField extends Component {
  constructor(props) {
    super(props);
    this.state = { isGeocoding: false, geocodeError: false };
    this.geocoder = new google.maps.Geocoder();
    this.handleGeocodeRequest = this.handleGeocodeRequest.bind(this);
    this.handleGeocodeResponse = this.handleGeocodeResponse.bind(this);
  }

  handleGeocodeRequest(address) {
    this.setState({ isGeocoding: true, geocodeError: null });
    this.geocoder.geocode({ address: address }, this.handleGeocodeResponse);
  }

  handleGeocodeResponse(results, status) {
    if (status !== 'OK') {
      this.setState({ isGeocoding: false, geocodeError: `Error geocoding: ${status}.` });
      return;
    }

    this.setState({ isGeocoding: false });
    const latLng = results[0].geometry.location;
    this.props.onPropUpdate(this.props.path, {
      address: results[0].formatted_address,
      coords: [latLng.lat(), latLng.lng()],
      title: titleForResult(results[0])
    });
  }

  renderError() {
    if (this.state.geocodeError) {
      return (
        <div className="text-danger">
          Could not find updated address; please try again.
        </div>
      );
    }
    return null;
  }

  renderMap() {
    if (this.props.value) {
      return (
        <StaticMapImg
          markers={[this.props.value.coords]}
          size="750x150"
          className="my-2"
          style={{ display: 'block', width: '100%', height: 'auto' }} />
      );
    }
    return null;
  }

  render() {
    if (this.state.isGeocoding) {
      return 'Searching...';
    }
    const label = this.props.value
      ? labelForLocation(this.props.value)
      : <BaseEmpty spec={this.props.spec} />;
    return (
      <>
        <PopoverControl
          title={`${typeTitleForSpec(this.props.spec)}: ${labelForSpec(this.props.spec, this.props.name)}`}
          validate={val => !!val}
          helpText="Enter an address, including the city."
          helpTextBottom={bottomHelpForSpec(this.props.spec)}
          onConfirm={this.handleGeocodeRequest}
          label={label}
          value={this.props.value ? labelForLocation(this.props.value) : ''} />
        {this.renderError()}
        {this.renderMap()}
      </>
    );
  }
}

LocationField.propTypes = {
  spec: PropTypes.object.isRequired,
  value: PropTypes.object,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  onPropUpdate: PropTypes.func.isRequired
};

LocationField.defaultProps = {
  value: null
};

export default LocationField;
