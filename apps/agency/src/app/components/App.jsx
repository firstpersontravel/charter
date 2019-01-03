import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class App extends Component {

  componentDidMount() {
    this.props.fetchAuthInfo();
    this.props.listCollection('experiences', { isArchived: false });
    this.props.listCollection('groups', { isArchived: false });
    this.props.listCollection('trips', { isArchived: false });
    this.props.listCollection('scripts', { isArchived: false });
    this.props.listCollection('profiles');
    this.props.listCollection('users');
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
  fetchAuthInfo: PropTypes.func.isRequired,
  listCollection: PropTypes.func.isRequired
};
