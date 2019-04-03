import React, { Component } from 'react';
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

  handleSubmit() {
    this.props.login(this.state.email, this.state.password);
  }

  renderLoginErrorAlert() {
    if (this.props.loginRequest === 'rejected') {
      return (
        <div className="alert alert-danger" role="alert">
          There was an error while trying to log in.
        </div>
      );
    }
    return null;
  }

  renderLoginFailedAlert() {
    if (this.props.loginRequest === 'fulfilled' && !this.props.authInfo) {
      return (
        <div className="alert alert-warning" role="alert">
          That email and password was incorrect.
        </div>
      );
    }
    return null;
  }

  render() {
    return (
      <div className="container-fluid">
        <div className="col-md-6 offset-md-3">
          <h1>Log in</h1>
          {this.renderLoginErrorAlert()}
          {this.renderLoginFailedAlert()}
          <form>
            <div className="form-group">
              <label htmlFor="exampleInputEmail1">Email address</label>
              <input
                type="email"
                name="email"
                autoComplete="new-password"
                className="form-control"
                id="exampleInputEmail1"
                value={this.state.email}
                onChange={e => this.setState({ email: e.target.value })}
                placeholder="Enter email" />
            </div>
            <div className="form-group">
              <label htmlFor="exampleInputPassword1">Password</label>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                className="form-control"
                id="exampleInputPassword1"
                value={this.state.password}
                onChange={e => this.setState({ password: e.target.value })}
                placeholder="Password" />
            </div>
            <button
              type="submit"
              disabled={!this.canSubmit()}
              onClick={this.handleSubmit}
              className="btn btn-primary">
              {this.isLoggingIn() ? 'Submitting...' : 'Submit'}
            </button>
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
