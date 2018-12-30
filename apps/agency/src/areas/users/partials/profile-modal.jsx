import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

const PHONE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^[\w._-]+@\w+\.\w+$/;

export default class ProfileModal extends Component {

  static getDefaultState(profile) {
    return {
      experienceId: profile ? profile.experienceId : '',
      roleName: profile ? profile.roleName : '',
      departureName: profile ? profile.departureName : '',
      photo: profile ? profile.photo : '',
      phoneNumber: profile ? profile.phoneNumber : '',
      facetimeUsername: profile ? profile.facetimeUsername : '',
      skypeUsername: profile ? profile.skypeUsername : '',
      values: profile ? profile.values : {}
    };
  }

  constructor(props) {
    super(props);
    this.state = ProfileModal.getDefaultState(props.profile);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleChangeField = this.handleChangeField.bind(this);
    this.handleChangeValue = this.handleChangeValue.bind(this);
    this.handleChangeExperienceId = this.handleChangeExperienceId.bind(this);
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
    this.props.onConfirm(_.assign({}, this.state));
  }

  handleChangeExperienceId(event) {
    this.setState({
      experienceId: event.target.value,
      roleName: '',
      departureName: ''
    });
  }

  handleChangeField(fieldName, event) {
    let value = event.target.value;
    if (fieldName === 'phoneNumber') {
      value = value.replace(/\D/g, '');
    }
    this.setState({ [fieldName]: value });
  }

  handleChangeValue(nestedAttribute, event) {
    this.setState({
      values: Object.assign(this.state.values, {
        [nestedAttribute]: event.target.value
      })
    });
  }

  isValid() {
    if (!this.state.experienceId) {
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
    return true;
  }

  render() {
    const profile = this.props.profile;
    const title = profile ? 'Edit profile' : 'New profile';
    const isNew = !profile;
    const confirmLabel = isNew ? 'Create' : 'Update';
    const isValid = this.isValid();

    const experienceOptions = this.props.experiences.map(experience => (
      <option key={experience.id} value={experience.id}>
        {experience.title}
      </option>
    ));
    const experience = _.find(this.props.experiences, {
      id: this.state.experienceId
    });
    const script = _.find(this.props.scripts, {
      experienceId: experience && experience.id,
      isArchived: false,
      isActive: true
    });
    const roles = script ? script.content.roles : [];
    const departures = script ? script.content.departures : [];
    const roleOptions = roles.map(role => (
      <option key={role.name} value={role.name}>{role.name}</option>
    ));
    const departureOptions = departures.map(departure => (
      <option key={departure.name} value={departure.name}>
        {departure.name}
      </option>
    ));
    const role = _.find(roles, { name: this.state.roleName });
    const requiredValues = (role && role.required_values) || [];
    const requiredValueRows = requiredValues
      .map(requiredValue => (
        <div className="row" key={requiredValue}>
          <div className="form-group col-sm-12">
            <label htmlFor={`profile_value_${requiredValue}`}>
              {requiredValue}
            </label>
            <input
              type="text"
              id={`profile_value_${requiredValue}`}
              className="form-control"
              value={this.state.values[requiredValue] || ''}
              onChange={_.curry(this.handleChangeValue)(requiredValue)}
              placeholder={requiredValue} />
          </div>
        </div>
      ));

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
                <label htmlFor="profile_script_name">Experience</label>
                <select
                  className="form-control"
                  id="profile_script_name"
                  onChange={this.handleChangeExperienceId}
                  value={this.state.experienceId}>
                  <option value="">--</option>
                  {experienceOptions}
                </select>
              </div>
              <div className="form-group col-sm-4">
                <label htmlFor="profile_role_name">Role</label>
                <select
                  className="form-control"
                  id="profile_role_name"
                  onChange={_.curry(this.handleChangeField)('roleName')}
                  value={this.state.roleName}>
                  <option value="">--</option>
                  {roleOptions}
                </select>
              </div>
              <div className="form-group col-sm-3">
                <label htmlFor="profile_departure_name">Departure</label>
                <select
                  className="form-control"
                  id="profile_departure_name"
                  onChange={_.curry(this.handleChangeField)('departureName')}
                  value={this.state.departureName}>
                  <option value="">--</option>
                  {departureOptions}
                </select>
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
            {requiredValueRows}
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
  scripts: PropTypes.array.isRequired,
  experiences: PropTypes.array.isRequired,
  profile: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

ProfileModal.defaultProps = {
  profile: null
};
