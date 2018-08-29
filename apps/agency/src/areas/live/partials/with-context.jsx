import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default function withContext(WrappedComponent, context) {
  class ContextProvider extends Component {
    getChildContext() {
      return context;
    }
    render() {
      return <WrappedComponent {...this.props} />;
    }
  }
  ContextProvider.childContextTypes = {};
  Object.keys(context).forEach((key) => {
    ContextProvider.childContextTypes[key] = PropTypes.any.isRequired;
  });
  return ContextProvider;
}
