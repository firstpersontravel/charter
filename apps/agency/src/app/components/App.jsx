import React, { Component } from 'react';
import {
  Button, Modal, ModalHeader, ModalBody, ModalFooter
} from 'reactstrap';
import PropTypes from 'prop-types';
import * as Sentry from '@sentry/react';

const TOKEN_REFRESH_INTERVAL = 60 * 60 * 1000; // Refresh every hour

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.refreshToken = this.refreshToken.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
  }

  componentDidMount() {
    this.props.fetchAuthInfo();
    this.refreshTokenInterval = setInterval(this.refreshToken, TOKEN_REFRESH_INTERVAL);
    window.addEventListener('focus', this.handleFocus);
  }

  componentWillUnmount() {
    clearInterval(this.refreshTokenInterval);
    this.refreshTokenInterval = null;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.props.crash(error, errorInfo);
  }

  refreshToken() {
    // Only refresh if we're logged in.
    if (this.props.authInfo) {
      this.props.fetchAuthInfo();
    }
  }

  handleFocus() {
    console.log('checking version');
    this.props.checkVersion();
  }

  renderErrorModal(icon, header, body, feedback) {
    const feedbackBtn = feedback ? (
      <Button
        color="secondary me-1"
        onClick={() => Sentry.showReportDialog()}>
        Report feedback
      </Button>
    ) : null;
    return (
      <Modal isOpen centered zIndex={3000}>
        <ModalHeader>
          <i className={`me-1 fa fa-${icon}`} />
          {header}
        </ModalHeader>
        <ModalBody>{body}</ModalBody>
        <ModalFooter>
          {feedbackBtn}
          <Button
            color="primary"
            onClick={() => { window.location = window.location.href; }}>
            Reload the page
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  renderUnknownError() {
    return this.renderErrorModal(
      'exclamation-triangle',
      'We\'re sorry, there was an error.',
      'We\'ve been notified and we\'ll fix this right away. '
      + 'In the meantime, you can reload the page and try what you were doing again.',
      true
    );
  }

  renderUpgradeAvailable() {
    return this.renderErrorModal(
      'shipping-fast',
      'An upgrade is available!',
      'Please reload the page to get the newest version of Charter.',
      false
    );
  }

  renderNetworkError() {
    return this.renderErrorModal(
      'wifi',
      'Couldn\'t reach the Charter server.',
      'Please check your connection and try again. '
      + 'You may need to retry your last action.',
      false
    );
  }

  renderValidationError() {
    return this.renderErrorModal(
      'exclamation-triangle',
      'There was a validation error updating your project.',
      'This shouldn\'t normally happen. '
      + 'We\'ve been notified and we\'ll fix this right away. '
      + 'In the meantime, you can reload the page and try something different.',
      false
    );
  }

  renderAuthError() {
    return this.renderErrorModal(
      'lock',
      'You have been logged out',
      'Please log in again. Apologies for the inconvenience!',
      true
    );
  }

  renderForbiddenError() {
    return this.renderErrorModal(
      'lock',
      'You do not have permission to perform this operation',
      'Please let us know if you think you are seeing this message in error.',
      true
    );
  }

  renderError(err) {
    if (!err) {
      return this.renderUnknownError();
    }
    if (err.status) {
      if (err.status === -2) {
        return this.renderUpgradeAvailable();
      }
      if (err.status === -1) {
        return this.renderNetworkError();
      }
      if (err.status === 401) {
        return this.renderAuthError();
      }
      if (err.status === 403) {
        return this.renderForbiddenError();
      }
      if (err.status === 400 || err.status === 422) {
        return this.renderValidationError();
      }
    }
    return this.renderUnknownError();
  }

  render() {
    if (this.state.hasError || this.props.globalError) {
      return this.renderError(this.props.globalError);
    }
    return this.props.children;
  }
}

App.propTypes = {
  authInfo: PropTypes.object,
  children: PropTypes.node.isRequired,
  globalError: PropTypes.object,
  crash: PropTypes.func.isRequired,
  fetchAuthInfo: PropTypes.func.isRequired,
  checkVersion: PropTypes.func.isRequired
};

App.defaultProps = {
  authInfo: null,
  globalError: null
};
