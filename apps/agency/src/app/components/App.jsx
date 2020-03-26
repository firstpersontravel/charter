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

  renderError() {
    return (
      <Modal
        isOpen
        centered
        zIndex={3000}>
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
            color="secondary"
            onClick={() => Sentry.showReportDialog()}>
            Report feedback
          </Button>
          &nbsp;
          <Button
            color="primary"
            onClick={() => { window.location = window.location.href; }}>
            Reload the page
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  render() {
    if (this.state.hasError || this.props.hasError) {
      return this.renderError();
    }
    return this.props.children;
  }
}

App.propTypes = {
  children: PropTypes.node.isRequired,
  hasError: PropTypes.bool,
  crash: PropTypes.func.isRequired,
  fetchAuthInfo: PropTypes.func.isRequired
};

App.defaultProps = {
  hasError: false
};
