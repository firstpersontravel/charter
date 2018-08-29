import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

export default class Checkbox extends React.Component {
  componentDidMount() {
    this.el.indeterminate = this.props.indeterminate;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.indeterminate !== this.props.indeterminate) {
      this.el.indeterminate = this.props.indeterminate;
    }
  }

  render() {
    return (
      <input
        {..._.omit(this.props, 'indeterminate')}
        type="checkbox"
        // eslint-disable-next-line no-return-assign
        ref={el => this.el = el} />
    );
  }
}

Checkbox.propTypes = {
  indeterminate: PropTypes.bool.isRequired
};

Checkbox.defaultProps = {
  indeterminate: false
};
