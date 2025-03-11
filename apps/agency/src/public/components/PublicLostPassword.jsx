import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class PublicLostPassword extends Component {
  constructor(props) {
    super(props);
    this.state = { email: '' };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  canSend() {
    if (!this.state.email) {
      return false;
    }
    if (this.isSending()) {
      return false;
    }
    if (this.props.lostPasswordRequest === 'fulfilled') {
      return false;
    }
    return true;
  }

  isSending() {
    return this.props.lostPasswordRequest === 'pending';
  }

  handleSubmit(e) {
    e.preventDefault();
    this.props.lostPassword(this.state.email);
  }

  renderRecoveryErrorAlert() {
    if (this.props.lostPasswordRequest === 'rejected') {
      const defaultErrorMsg = 'There was an error while trying to send the recovery email.';
      const errorMsg = this.props.lostPasswordError || defaultErrorMsg;
      return (
        <div className="alert alert-danger" role="alert">
          {errorMsg}
        </div>
      );
    }
    return null;
  }

  renderRecoveryFailedAlert() {
    if (this.props.lostPasswordRequest === 'fulfilled') {
      return (
        <div className="alert alert-success" role="alert">
          Please check your inbox for an email with a password recovery link.
        </div>
      );
    }
    return null;
  }

  renderForm() {
    if (this.props.lostPasswordRequest === 'fulfilled') {
      return null;
    }
    return (
      <form onSubmit={this.handleSubmit}>
        <div className="form-group">
          <label htmlFor="emailInput">Email address</label>
          <input
            type="email"
            name="email"
            className="form-control"
            autoComplete="username"
            id="emailInput"
            value={this.state.email}
            onChange={e => this.setState({ email: e.target.value })}
            placeholder="Enter email" />
        </div>
        <button
          type="submit"
          disabled={!this.canSend()}
          onClick={this.handleSubmit}
          className="btn btn-primary">
          {this.isSending() ? 'Sending...' : 'Send recovery link'}
        </button>
      </form>
    );
  }

  render() {
    return (
      <div className="container-fluid">
        <div className="col-md-6 offset-md-3">
          <h1>Lost your password?</h1>
          <p>Enter your email and a recovery link will be sent there.</p>
          {this.renderRecoveryErrorAlert()}
          {this.renderRecoveryFailedAlert()}
          {this.renderForm()}
        </div>
      </div>
    );
  }
}

PublicLostPassword.propTypes = {
  lostPassword: PropTypes.func.isRequired,
  lostPasswordRequest: PropTypes.string,
  lostPasswordError: PropTypes.string
};

PublicLostPassword.defaultProps = {
  lostPasswordRequest: null,
  lostPasswordError: null
};
