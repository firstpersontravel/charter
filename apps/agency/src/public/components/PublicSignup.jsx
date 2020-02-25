import React, { Component } from 'react';
import { Link } from 'react-router';
import PropTypes from 'prop-types';

export default class PublicSignup extends Component {
  constructor(props) {
    super(props);
    this.state = { email: '', password: '', orgTitle: '' };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  canSubmit() {
    if (!this.state.email || !this.state.password || !this.state.orgTitle) {
      return false;
    }
    if (this.isSigningUp()) {
      return false;
    }
    return true;
  }

  isSigningUp() {
    return this.props.signupRequest === 'pending';
  }

  handleSubmit(e) {
    e.preventDefault();
    this.props.signup(this.state.email, this.state.password,
      this.state.orgTitle);
  }

  renderSignupErrorAlert() {
    if (this.props.signupRequest === 'rejected') {
      const defaultErrorMsg = 'There was an error while trying to sign up.';
      const errorMsg = this.props.signupError || defaultErrorMsg;
      const includeLink = !!this.props.signupError;
      const loginLink = includeLink ?
        <Link to="/login" className="pl-1">Log in?</Link> :
        null;
      return (
        <div className="alert alert-danger" role="alert">
          {errorMsg}{loginLink}
        </div>
      );
    }
    return null;
  }

  renderSignupFailedAlert() {
    if (this.props.signupRequest === 'fulfilled' && !this.props.authInfo) {
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
            You can create an account here. If you already have an account, <Link to="/login">please log in.</Link>
          </p>
          {this.renderSignupErrorAlert()}
          {this.renderSignupFailedAlert()}
          <form onSubmit={this.handleSubmit}>
            <div className="form-group">
              <label htmlFor="emailInput">Email address</label>
              <input
                type="email"
                name="email"
                className="form-control"
                id="emailInput"
                value={this.state.email}
                onChange={e => this.setState({ email: e.target.value })}
                placeholder="Enter email" />
            </div>
            <div className="form-group">
              <label htmlFor="pwInput">Password</label>
              <input
                type="password"
                name="password"
                className="form-control"
                id="pwInput"
                value={this.state.password}
                onChange={e => this.setState({ password: e.target.value })}
                placeholder="Password" />
            </div>
            <div className="form-group">
              <label htmlFor="orgNameInput">
                Workspace name (this could be a company or group name, or just your name)
              </label>
              <input
                type="text"
                name="orgTitle"
                className="form-control"
                id="orgNameInput"
                value={this.state.orgTitle}
                onChange={e => this.setState({ orgTitle: e.target.value })}
                placeholder="Enter a name for your workspace" />
            </div>
            <button
              type="submit"
              disabled={!this.canSubmit()}
              onClick={this.handleSubmit}
              className="btn btn-primary">
              {this.isSigningUp() ? 'Signing up...' : 'Sign up'}
            </button>
          </form>
          <p>Please remember that this is an experimental toolkit and very much a work-in-progress.
            {' '}
            We&apos;re delighted that you&apos;re interested in trying out
            {' '}
            these tools and we&apos;d love your help making them better!
          </p>
          <p>
            This tool is provided for free for art projects, experiments,
            {' '}
            and other revenue-free experiences.
            {' '}
            It costs us money to run the servers and telephone relays,
            {' '}
            so if you are charging fees for experiences built using this platform,
            {' '}
            be in touch at <a href="mailto:agency@firstperson.travel">agency@firstperson.travel</a>
            {' '}
            and we&apos;ll work out a fair and reasonable pricing structure.
          </p>
        </div>
      </div>
    );
  }
}

PublicSignup.propTypes = {
  authInfo: PropTypes.object,
  signup: PropTypes.func.isRequired,
  signupRequest: PropTypes.string,
  signupError: PropTypes.string
};

PublicSignup.defaultProps = {
  authInfo: null,
  signupRequest: null,
  signupError: null
};
