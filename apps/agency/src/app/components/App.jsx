import React, { Component } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import PropTypes from 'prop-types';
import * as Sentry from '@sentry/browser';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidMount() {
    this.props.fetchAuthInfo();
  }

  componentDidCatch(error, errorInfo) {
    this.props.crash(error, errorInfo);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  renderUnknownError() {
    return (
      <Modal isOpen centered zIndex={3000}>
        <ModalHeader>
          <i className="fa fa-exclamation-triangle" />&nbsp;
          We&apos;re sorry, there was an error.
        </ModalHeader>
        <ModalBody>
          We&apos;ve been notified and we&apos;ll fix this right away.
          In the meantime, you can reload the page and try what you were doing again.
        </ModalBody>
        <ModalFooter>
          <Button
            color="secondary mr-1"
            onClick={() => Sentry.showReportDialog()}>
            Report feedback
          </Button>
          <Button
            color="primary"
            onClick={() => { window.location = window.location.href; }}>
            Reload the page
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  renderNetworkError() {
    return (
      <Modal isOpen centered zIndex={3000}>
        <ModalHeader>
          <i className="fa fa-wifi" />&nbsp;
          Couldn&apos;t reach the Charter server.
        </ModalHeader>
        <ModalBody>
          Please check your connection and try again.
          You may need to retry your last action.
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onClick={() => { window.location = window.location.href; }}>
            Reload the page
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  renderValidationError() {
    return (
      <Modal isOpen centered zIndex={3000}>
        <ModalHeader>
          <i className="fa fa-exclamation-triangle" />&nbsp;
          There was a validation error updating your project.
        </ModalHeader>
        <ModalBody>
          This shouldn&apos;t normally happen.
          We&apos;ve been notified and we&apos;ll fix this right away.
          In the meantime, you can reload the page and try something different.
        </ModalBody>
        <ModalFooter>
          <Button
            color="secondary mr-1"
            onClick={() => Sentry.showReportDialog()}>
            Report feedback
          </Button>
          <Button
            color="primary"
            onClick={() => { window.location = window.location.href; }}>
            Reload the page
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  renderError(err) {
    if (!err) {
      return this.renderUnknownError();
    }
    if (!err.status || err.message === 'Failed to fetch') {
      return this.renderNetworkError();
    }
    if (err.status >= 400 && err.status < 500) {
      return this.renderValidationError();
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
  children: PropTypes.node.isRequired,
  globalError: PropTypes.object,
  crash: PropTypes.func.isRequired,
  fetchAuthInfo: PropTypes.func.isRequired
};

App.defaultProps = {
  globalError: null
};
