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
          <h1>Welcome to First Person Travel!</h1>
          <p>
            If you have an account, please sign in here. Otherwise you can <Link to="/signup">create an account.</Link>
          </p>
          {this.renderLoginErrorAlert()}
          {this.renderLoginFailedAlert()}
          <form onSubmit={this.handleSubmit}>
            <div className="form-group">
              <label htmlFor="exampleInputEmail1">Email address</label>
              <input
                type="email"
                name="email"
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
              {this.isLoggingIn() ? 'Logging in...' : 'Log in'}
            </button>
          </form>
          <p>
            {
              // eslint-disable-next-line max-len
            }Please remember that this is an experimental toolkit and very much a work-in-progress. We&apos;re delighted that you&apos;re interested in trying out these tools and we&apos;d love your help making them better!
          </p>
          <p>
            This tool is provided for free for art projects, experiments, and other revenue-free experiences. It costs us money to run the servers and telephone relays, so if you are charging fees for experiences built using this platform, be in touch at <a href="mailto:agency@firstperson.travel">agency@firstperson.travel</a> and we&apos;ll work out a fair and reasonable pricing structure.
          </p>
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
