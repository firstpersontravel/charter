import _ from 'lodash';
import React, { Component } from 'react';

function didPropChange(oldProps, newProps, propName) {
  const oldVal = _.get(oldProps, propName);
  const newVal = _.get(newProps, propName);
  // If no new value, no change.
  if (_.isUndefined(newVal)) {
    return false;
  }
  return oldVal !== newVal;
}

function didAnyPropChange(oldProps, newProps, propsToWatch) {
  return _.some(propsToWatch, propName => (
    didPropChange(oldProps, newProps, propName)
  ));
}


export function withLoader(WrappedComponent, propsToWatch, loaderFunc) {
  return class extends Component {
    componentWillMount() {
      this.handlePropsReceived(null, this.props);
    }

    componentWillReceiveProps(nextProps) {
      this.handlePropsReceived(this.props, nextProps);
    }

    // eslint-disable-next-line class-methods-use-this
    handlePropsReceived(oldProps, newProps) {
      if (didAnyPropChange(oldProps, newProps, propsToWatch)) {
        loaderFunc(newProps);
      }
    }

    render() {
      return (
        <WrappedComponent {...this.props} />
      );
    }
  };
}
