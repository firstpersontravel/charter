import React, { Component } from 'react';
import PropTypes from 'prop-types';

// eslint-disable-next-line react/prefer-stateless-function
export default class Test extends Component {
  render() {
    return (
      <span>
        Coming soon...
      </span>
    );
  }
}

Test.propTypes = {
  script: PropTypes.object.isRequired
};
