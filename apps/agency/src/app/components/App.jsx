import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as Sentry from '@sentry/browser';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  componentDidMount() {
    this.props.fetchAuthInfo();
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error: error });
    Sentry.withScope((scope) => {
      Object.keys(errorInfo).forEach((key) => {
        scope.setExtra(key, errorInfo[key]);
      });
      Sentry.captureException(error);
    });
  }

  renderContent() {
    if (this.state.error) {
      return (
        <div className="container-fluid">
          <div className="alert alert-danger">
            <h4 className="alert-heading">
              <i className="fa fa-exclamation-triangle" />&nbsp;
              Sorry, there was an error.
            </h4>
            <p>Please reload the page and try again.</p>
            <hr />
            <p>
              <a
                className="btn btn-block btn-danger"
                onClick={() => Sentry.showReportDialog()}>
                Report feedback
              </a>
            </p>
          </div>
        </div>
      );
    }
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
