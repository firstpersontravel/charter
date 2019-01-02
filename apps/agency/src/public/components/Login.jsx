import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class Login extends Component {

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

  render() {
    const failedAlert = this.props.loginRequest === 'rejected' ? (
      <div className="alert alert-warning" role="alert">
        That email and password was incorrect.
      </div>
    ) : null;

    return (
      <div className="container-fluid">
        <div className="col-md-6 offset-md-3">
          <h1>Log in</h1>
          {failedAlert}
          <form>
            <div className="form-group">
              <label htmlFor="exampleInputEmail1">Email address</label>
              <input
                type="email"
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

Login.propTypes = {
  login: PropTypes.func.isRequired,
  loginRequest: PropTypes.string
};

Login.defaultProps = {
  loginRequest: null
};
