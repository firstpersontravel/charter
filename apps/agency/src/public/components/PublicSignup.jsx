import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

export default class PublicSignup extends Component {
  constructor(props) {
    super(props);
    this.state = { fullName: '', email: '', password: '', orgTitle: '' };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  canSubmit() {
    if (!this.state.fullName ||
        !this.state.email ||
        !this.state.password ||
        !this.state.orgTitle) {
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
    this.props.signup(this.state.fullName, this.state.email,
      this.state.password, this.state.orgTitle);
  }

  renderSignupErrorAlert() {
    if (this.props.signupRequest === 'rejected') {
      const defaultErrorMsg = 'Hmm, there was an error while trying to sign up';
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
        <div className="alert alert-warning text-center" role="alert">
          That email and password are incorrect
        </div>
      );
    }
    return null;
  }

  render() {
    return (
      <div className="container d-flex h-100 justify-content-center">
        <div className="col-md-5 flex align-self-center">
          <h1>Create an account</h1>
          <p>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
          {this.renderSignupErrorAlert()}
          {this.renderSignupFailedAlert()}
          <form onSubmit={this.handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                name="fullName"
                className="form-control"
                autoComplete="name"
                id="fullNameInput"
                value={this.state.fullName}
                onChange={e => this.setState({ fullName: e.target.value })}
                placeholder="Your name" />
            </div>
            <div className="form-group">
              <input
                type="email"
                name="email"
                className="form-control"
                autoComplete="email"
                id="emailInput"
                value={this.state.email}
                onChange={e => this.setState({ email: e.target.value })}
                placeholder="Email" />
            </div>
            <div className="form-group">
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
            <div className="form-group">
              <input
                maxLength="64"
                type="text"
                name="orgTitle"
                autoComplete="organization"
                className="form-control"
                id="orgNameInput"
                value={this.state.orgTitle}
                onChange={e => this.setState({ orgTitle: e.target.value })}
                placeholder="Workspace name" />
            </div>
            <button
              type="submit"
              disabled={!this.canSubmit()}
              onClick={this.handleSubmit}
              className="btn btn-primary">
              {this.isSigningUp() ? 'Signing up...' : 'Sign up'}
            </button>
          </form>
          <p className="">
            Charter is a beta toolkit and we’d love your help making it better.
          </p>
          <p>
            Right now we&apos;re free for art projects, experiments, and other no-revenue
            experiences. It costs us money to maintain our servers so if you are charging fees
            for experiences built using it, please get in touch with us at
            <a href="mailto:agency@firstperson.travel">agency@firstperson.travel </a>
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
