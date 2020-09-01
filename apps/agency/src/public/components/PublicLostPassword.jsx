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
      const defaultErrorMsg = 'There was an error while trying to send the link';
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
          Please check your email inbox.
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
      <form onSubmit={this.handleSubmit} className=" d-flex flex-column justify-content-center">
        <div className="form-group">
          <input
            type="email"
            name="email"
            className="form-control"
            autoComplete="username"
            id="emailInput"
            value={this.state.email}
            onChange={e => this.setState({ email: e.target.value })}
            placeholder="Email" />
        </div>
        <button
          type="submit"
          disabled={!this.canSend()}
          onClick={this.handleSubmit}
          className="btn btn-primary align-self-center w-50">
          {this.isSending() ? 'Sending...' : 'Send me a link'}
        </button>
      </form>
    );
  }

  render() {
    return (
      <div className="container d-flex h-100 justify-content-center">
        <div className="col-md-5 align-self-center">
          <h1 className="text-center">Lost your password?</h1>
          <p className="text-center">Enter your email and we&apos;ll send you a link to reset your password</p>
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
  authInfo: null,
  lostPasswordRequest: null,
  lostPasswordError: null
};
