import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

export default class PublicLogin extends Component {
  constructor(props) {
    super(props);
    this.state = { email: '', password: '' };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  canSubmit() {
    if (!this.state.email || !this.state.password) {
      return false;
    }
    if (this.isLoggingIn()) {
      return false;
    }
    return true;
  }

  isLoggingIn() {
    return this.props.loginRequest === 'pending';
  }

  handleSubmit(e) {
    e.preventDefault();
    this.props.login(this.state.email, this.state.password);
  }

  renderLoginErrorAlert() {
    if (this.props.loginRequest === 'rejected') {
      return (
        <div className="alert alert-danger" role="alert">
          Hmm, there was an error while logging in
        </div>
      );
    }
    return null;
  }

  renderLoginFailedAlert() {
    if (this.props.loginRequest === 'fulfilled' && !this.props.authInfo) {
      return (
        <div className="alert alert-warning text-center" role="alert">
          That email and password are incorrect
        </div>
      );
    }
    return null;
  }

//Login Styling

  render() {
    return (
      <div className="container d-flex h-100 justify-content-center">
        <div className="col-md-5 flex align-self-center">
          <h1 className="text-center">Welcome to Charter</h1>
          <p className="text-center">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
          {this.renderLoginErrorAlert()}
          {this.renderLoginFailedAlert()}
          <form onSubmit={this.handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                name="email"
                className="form-control"
                autoComplete="email"
                id="email"
                value={this.state.email}
                onChange={e => this.setState({ email: e.target.value })}
                placeholder="Email" />
            </div>
            <div className="form-group">
              <input
                type="password"
                name="password"
                className="form-control"
                autoComplete="current-password"
                id="password"
                value={this.state.password}
                onChange={e => this.setState({ password: e.target.value })}
                placeholder="Password" />
            </div>
            <div>
              <button
                type="submit"
                disabled={!this.canSubmit()}
                onClick={this.handleSubmit}
                className="btn btn-primary w-100">
                {this.isLoggingIn() ? 'Logging in...' : 'Log in'}
              </button>
              <div className="d-flex justify-content-center pt-3">
                <Link
                  to="/lost-pw">Forgot your password?
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

PublicLogin.propTypes = {
  authInfo: PropTypes.object,
  login: PropTypes.func.isRequired,
  loginRequest: PropTypes.string
};

PublicLogin.defaultProps = {
  authInfo: null,
  loginRequest: null
};
