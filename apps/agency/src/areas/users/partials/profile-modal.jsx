import _ from 'lodash';
import yaml from 'js-yaml';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

const PHONE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^[\w._-]+@\w+\.\w+$/;

export default class ProfileModal extends Component {

  static getDefaultState(profile) {
    const values = profile ? _.trim(yaml.safeDump(profile.values)) : '';
    return {
      scriptName: profile ? profile.scriptName : '',
      roleName: profile ? profile.roleName : '',
      departureName: profile ? profile.departureName : '',
      photo: profile ? profile.photo : '',
      phoneNumber: profile ? profile.phoneNumber : '',
      facetimeUsername: profile ? profile.facetimeUsername : '',
      skypeUsername: profile ? profile.skypeUsername : '',
      values: values !== '{}' ? values : ''
    };
  }

  constructor(props) {
    super(props);
    this.state = ProfileModal.getDefaultState(props.profile);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleChangeField = this.handleChangeField.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(ProfileModal.getDefaultState(nextProps.profile));
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.isOpen && !prevProps.isOpen) {
      this.firstInput.focus();
    }
  }

  handleToggle() {
    if (this.props.isOpen) {
      this.props.onClose();
    }
  }

  handleConfirm() {
    this.props.onConfirm(_.assign({}, this.state, {
      values: yaml.safeLoad(this.state.values || '{}')
    }));
  }

  handleChangeField(fieldName, event) {
    let value = event.target.value;
    if (fieldName === 'phoneNumber') {
      value = value.replace(/\D/g, '');
    }
    this.setState({ [fieldName]: value });
  }

  isValid() {
    if (!this.state.scriptName) {
      return false;
    }
    if (!this.state.roleName) {
      return false;
    }
    if (this.state.phoneNumber &&
      !PHONE_REGEX.test(this.state.phoneNumber)) {
      return false;
    }
    if (this.state.facetimeUsername &&
      !EMAIL_REGEX.test(this.state.facetimeUsername)) {
      return false;
    }
    try {
      const values = yaml.safeLoad(this.state.values || '{}');
      if (!_.isPlainObject(values)) {
        return false;
      }
    } catch (err) {
      return false;
    }
    return true;
  }

  render() {
    const profile = this.props.profile;
    const title = profile ? 'Edit profile' : 'New profile';
    const isNew = !profile;
    const confirmLabel = isNew ? 'Create' : 'Update';
    const isValid = this.isValid();
    return (
      <Modal
        isOpen={this.props.isOpen}
        toggle={this.handleToggle}
        zIndex={3000}>
        <ModalHeader toggle={this.handleToggle}>{title}</ModalHeader>
        <ModalBody>
          <form>
            <div className="row">
              <div className="form-group col-sm-5">
                <label htmlFor="profile_script_name">Script</label>
                <input
                  type="text"
                  id="profile_script_name"
                  className="form-control"
                  value={this.state.scriptName}
                  ref={(input) => { this.firstInput = input; }}
                  onChange={_.curry(this.handleChangeField)('scriptName')}
                  placeholder="Script name" />
              </div>
              <div className="form-group col-sm-4">
                <label htmlFor="profile_role_name">Role</label>
                <input
                  type="text"
                  id="profile_role_name"
                  className="form-control"
                  value={this.state.roleName}
                  onChange={_.curry(this.handleChangeField)('roleName')}
                  placeholder="Role" />
              </div>
              <div className="form-group col-sm-3">
                <label htmlFor="profile_departure_name">Departure</label>
                <input
                  type="text"
                  id="profile_departure_name"
                  className="form-control"
                  value={this.state.departureName}
                  onChange={_.curry(this.handleChangeField)('departureName')}
                  placeholder="Departure" />
              </div>
            </div>
            <div className="row">
              <div className="form-group col-sm-6">
                <label htmlFor="profile_photo">Photo</label>
                <input
                  type="text"
                  id="profile_photo"
                  className="form-control"
                  value={this.state.photo}
                  ref={(input) => { this.firstInput = input; }}
                  onChange={_.curry(this.handleChangeField)('photo')}
                  placeholder="Photo media path" />
              </div>
              <div className="form-group col-sm-6">
                <label htmlFor="profile_phone_number">Phone number</label>
                <input
                  type="text"
                  id="profile_phone_number"
                  className="form-control"
                  value={this.state.phoneNumber}
                  onChange={_.curry(this.handleChangeField)('phoneNumber')}
                  placeholder="Phone number" />
              </div>
            </div>
            <div className="row">
              <div className="form-group col-sm-6">
                <label htmlFor="profile_facetime_username">Facetime</label>
                <input
                  type="text"
                  id="profile_facetime_username"
                  className="form-control"
                  value={this.state.facetimeUsername}
                  onChange={_.curry(this.handleChangeField)('facetimeUsername')}
                  placeholder="Facetime username" />
              </div>
              <div className="form-group col-sm-6">
                <label htmlFor="profile_skype_username">Skype</label>
                <input
                  type="text"
                  id="profile_skype_username"
                  className="form-control"
                  value={this.state.skypeUsername}
                  onChange={_.curry(this.handleChangeField)('skypeUsername')}
                  placeholder="Skype username" />
              </div>
            </div>
            <div className="row">
              <div className="form-group col-sm-12">
                <label htmlFor="profile_values">Values</label>
                <textarea
                  style={{ height: '8em' }}
                  id="profile_values"
                  className="form-control"
                  value={this.state.values}
                  onChange={_.curry(this.handleChangeField)('values')}
                  placeholder="Values" />
              </div>
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onClick={this.handleConfirm}
            disabled={!isValid}>
            {confirmLabel}
          </Button>
          &nbsp;
          <Button color="secondary" onClick={this.handleToggle}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    );
  }
}

ProfileModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  profile: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

ProfileModal.defaultProps = {
  profile: null
};
