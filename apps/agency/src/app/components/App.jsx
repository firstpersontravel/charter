import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class App extends Component {

  componentDidMount() {
    this.props.fetchAuthInfo();
  }

  renderContent() {
    return this.props.children;
  }

  render() {
    return (
      <div>
        {this.renderContent()}
      </div>
    );
  }
}

App.propTypes = {
  children: PropTypes.node.isRequired,
  fetchAuthInfo: PropTypes.func.isRequired
};
