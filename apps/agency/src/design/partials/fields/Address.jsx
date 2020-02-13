import React from 'react';
import PropTypes from 'prop-types';

import BaseEmpty from './BaseEmpty';
import PopoverControl from '../../../partials/PopoverControl';

function AddressField({ spec, value, name, path, opts, onPropUpdate }) {
  const geocoder = new google.maps.Geocoder();
  const label = value || <BaseEmpty spec={spec} />;
  return (
    <PopoverControl
      title={name}
      validate={val => !!val}
      helpText={'Enter an address, including city, to find its coordinates.'}
      onConfirm={(val) => {
        geocoder.geocode({ address: val }, (results, status) => {
          if (status !== 'OK') {
            console.error(`Error geocooding: ${status}`);
            return;
          }

          // Update address
          onPropUpdate(path, results[0].formatted_address);

          // HACK HACK HACK for waypoints
          if (path.endsWith('.address')) {
            const latLng = results[0].geometry.location;
            onPropUpdate(
              path.replace(/\.address$/, '.coords'),
              [latLng.lat(), latLng.lng()]);
          }
        });
      }}
      label={label}
      value={''} />
  );
}

AddressField.propTypes = {
  spec: PropTypes.object.isRequired,
  value: PropTypes.string,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  onPropUpdate: PropTypes.func.isRequired
};

AddressField.defaultProps = {
  value: null,
  opts: {}
};

export default AddressField;
