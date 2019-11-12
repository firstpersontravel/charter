import React, { Component } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
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

  renderError() {
    return (
      <Modal
        isOpen={this.state.error || this.props.hasError}
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
    return (
      <div>
        {this.renderError()}
        {this.props.children}
      </div>
    );
  }
}

App.propTypes = {
  children: PropTypes.node.isRequired,
  hasError: PropTypes.bool,
  fetchAuthInfo: PropTypes.func.isRequired
};

App.defaultProps = {
  hasError: false
};
