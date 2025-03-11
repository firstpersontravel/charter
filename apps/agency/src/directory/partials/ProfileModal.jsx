import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Modal, ModalHeader, ModalBody, ModalFooter
} from 'reactstrap';

export default class ProfileModal extends Component {
  static getDefaultState(profile) {
    return {
      roleName: profile ? profile.roleName : '',
      values: profile ? profile.values : {}
    };
  }

  constructor(props) {
    super(props);
    this.state = ProfileModal.getDefaultState(props.profile);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleChangeField = this.handleChangeField.bind(this);
    this.handleChangeValue = this.handleChangeValue.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.firstInputRef = React.createRef();
  }

  componentWillReceiveProps(nextProps) {
    this.setState(ProfileModal.getDefaultState(nextProps.profile));
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.isOpen
        && !prevProps.isOpen
        && this.firstInputRef.current) {
      this.firstInputRef.current.focus();
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

  handleChangeField(fieldName, event) {
    this.setState({ [fieldName]: event.target.value });
  }

  handleChangeValue(nestedAttribute, event) {
    this.setState(prevState => ({
      values: {
        ...prevState.values,
        [nestedAttribute]: event.target.value
      }
    }));
  }

  isValid() {
    if (!this.state.roleName) {
      return false;
    }
    return true;
  }

  render() {
    const { profile } = this.props;
    const title = profile ? 'Edit profile' : 'New profile';
    const isNew = !profile;
    const confirmLabel = isNew ? 'Create' : 'Update';
    const isValid = this.isValid();

    const { experience } = this.props;
    if (!experience || !experience.script) {
      return null;
    }
    const roles = experience.script.content.roles || [];
    const roleOptions = roles.map(role => (
      <option key={role.name} value={role.name}>{role.title}</option>
    ));
    const role = _.find(roles, { name: this.state.roleName });
    const requiredValues = (role && role.role_values) || [];
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
              <div className="form-group col-sm-12">
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
  experience: PropTypes.object.isRequired,
  profile: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

ProfileModal.defaultProps = {
  profile: null
};
