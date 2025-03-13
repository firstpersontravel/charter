import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

export default class PublicSignup extends Component {
  constructor(props) {
    super(props);
    this.state = { password: '' };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  getToken() {
    const query = new URLSearchParams(this.props.location.search);
    return query.get('token');
  }

  canSubmit() {
    if (!this.getToken()) {
      return false;
    }
    if (!this.state.password) {
      return false;
    }
    if (this.isResetting()) {
      return false;
    }
    return true;
  }

  isResetting() {
    return this.props.resetPasswordRequest === 'pending';
  }

  handleSubmit(e) {
    e.preventDefault();
    this.props.resetPassword(this.getToken(), this.state.password);
  }

  renderResetErrorAlert() {
    if (this.props.resetPasswordRequest === 'rejected') {
      const defaultErrorMsg = 'There was an error while trying to sign up.';
      const errorMsg = this.props.resetPasswordError || defaultErrorMsg;
      const includeLink = !!this.props.resetPasswordError;
      const loginLink = includeLink
        ? <Link to="/login" className="ps-1">Log in?</Link>
        : null;
      return (
        <div className="alert alert-danger" role="alert">
          {errorMsg}
          {loginLink}
        </div>
      );
    }
    return null;
  }

  renderNoTokenError() {
    if (!this.getToken()) {
      return (
        <div className="alert alert-danger" role="alert">
          You must have a token that you should receive from an email.
        </div>
      );
    }
    return null;
  }

  renderResetFailedAlert() {
    if (this.props.resetPasswordRequest === 'fulfilled') {
      return (
        <div className="alert alert-success" role="alert">
          Your password was reset.
          {' '}
          <Link to="/login" className="ps-1">You may now log in.</Link>
        </div>
      );
    }
    return null;
  }

  renderForm() {
    if (this.props.resetPasswordRequest === 'fulfilled') {
      return null;
    }
    return (
      <form onSubmit={this.handleSubmit}>
        <div className="form-group">
          <label htmlFor="pwInput">Password</label>
          <input
            type="password"
            name="password"
            className="form-control"
            autoComplete="new-password"
            id="pwInput"
            value={this.state.password}
            onChange={e => this.setState({ password: e.target.value })}
            placeholder="Password" />
        </div>
        <button
          type="submit"
          disabled={!this.canSubmit()}
          onClick={this.handleSubmit}
          className="btn btn-primary">
          {this.isResetting() ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    );
  }

  render() {
    return (
      <div className="container-fluid">
        <div className="col-md-6 offset-md-3">
          <h1>Reset your password</h1>
          <p>Please choose a new password.</p>
          {this.renderNoTokenError()}
          {this.renderResetErrorAlert()}
          {this.renderResetFailedAlert()}
          {this.renderForm()}
        </div>
      </div>
    );
  }
}

PublicSignup.propTypes = {
  location: PropTypes.object.isRequired,
  resetPassword: PropTypes.func.isRequired,
  resetPasswordRequest: PropTypes.string,
  resetPasswordError: PropTypes.string
};

PublicSignup.defaultProps = {
  resetPasswordRequest: null,
  resetPasswordError: null
};
