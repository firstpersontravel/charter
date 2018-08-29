import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

const PHONE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^[\w._-]+@\w+\.\w+$/;

export default class UserModal extends Component {

  static getDefaultState(user) {
    return {
      firstName: user ? user.firstName : '',
      lastName: user ? user.lastName : '',
      email: user ? user.email : '',
      phoneNumber: user ? user.phoneNumber : ''
    };
  }

  constructor(props) {
    super(props);
    this.state = UserModal.getDefaultState(props.user);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleChangeField = this.handleChangeField.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(UserModal.getDefaultState(nextProps.user));
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

  handleChangeField(fieldName, event) {
    let value = event.target.value;
    if (fieldName === 'phoneNumber') {
      value = value.replace(/\D/g, '');
    }
    this.setState({ [fieldName]: value });
  }

  isValid() {
    if (this.state.firstName === '') {
      return false;
    }
    if (this.state.phoneNumber && !PHONE_REGEX.test(this.state.phoneNumber)) {
      return false;
    }
    if (this.state.email && !EMAIL_REGEX.test(this.state.email)) {
      return false;
    }
    return true;
  }

  render() {
    const user = this.props.user;
    const title = user ? 'Edit user' : 'New user';
    const isNew = !user;
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
              <div className="form-group col-sm-6">
                <label htmlFor="user_first_name">First name</label>
                <input
                  type="text"
                  id="user_first_name"
                  className="form-control"
                  value={this.state.firstName}
                  ref={(input) => { this.firstInput = input; }}
                  onChange={_.curry(this.handleChangeField)('firstName')}
                  placeholder="First name" />
              </div>
              <div className="form-group col-sm-6">
                <label htmlFor="user_last_name">Last name</label>
                <input
                  type="text"
                  id="user_last_name"
                  className="form-control"
                  value={this.state.lastName}
                  onChange={_.curry(this.handleChangeField)('lastName')}
                  placeholder="Last name" />
              </div>
            </div>
            <div className="row">
              <div className="form-group col-sm-6">
                <label htmlFor="user_email">Email</label>
                <input
                  type="email"
                  id="user_email"
                  className="form-control"
                  value={this.state.email}
                  onChange={_.curry(this.handleChangeField)('email')}
                  placeholder="Email" />
              </div>
              <div className="form-group col-sm-6">
                <label htmlFor="user_last_name">Phone number</label>
                <input
                  type="text"
                  id="user_phone_number"
                  className="form-control"
                  value={this.state.phoneNumber}
                  onChange={_.curry(this.handleChangeField)('phoneNumber')}
                  placeholder="Phone number" />
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

UserModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  user: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

UserModal.defaultProps = {
  user: null
};
