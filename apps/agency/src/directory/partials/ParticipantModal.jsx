import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Modal, ModalHeader, ModalBody, ModalFooter
} from 'reactstrap';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';

const EMAIL_REGEX = /^[\w._-]+@[\w.-]+$/;

export default class ParticipantModal extends Component {
  static getDefaultState(participant) {
    return {
      name: participant ? participant.name : '',
      email: participant ? participant.email : '',
      phoneNumber: participant ? participant.phoneNumber : ''
    };
  }

  constructor(props) {
    super(props);
    this.state = ParticipantModal.getDefaultState(props.participant);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleChangeField = this.handleChangeField.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.firstInputRef = React.createRef();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState(ParticipantModal.getDefaultState(nextProps.participant));
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

  handleConfirm(e) {
    e.preventDefault();
    this.props.onConfirm(_.assign({}, this.state));
  }

  handleChangeField(fieldName, event) {
    this.setState({ [fieldName]: event.target.value });
  }

  isValid() {
    if (this.state.name === '') {
      return false;
    }
    if (this.state.phoneNumber && !isValidPhoneNumber(this.state.phoneNumber)) {
      return false;
    }
    if (this.state.email && !EMAIL_REGEX.test(this.state.email)) {
      return false;
    }
    return true;
  }

  render() {
    const { participant } = this.props;
    const title = participant ? 'Edit participant' : 'New participant';
    const isNew = !participant;
    const confirmLabel = isNew ? 'Create' : 'Update';
    const isValid = this.isValid();
    return (
      <Modal
        isOpen={this.props.isOpen}
        toggle={this.handleToggle}
        zIndex={3000}>
        <form onSubmit={this.handleConfirm}>
          <ModalHeader toggle={this.handleToggle}>{title}</ModalHeader>
          <ModalBody>
            <div className="row">
              <div className="form-group col-sm-12">
                <label htmlFor="participant_name">Full name</label>
                <input
                  type="text"
                  id="participant_name"
                  className="form-control"
                  value={this.state.name}
                  ref={this.firstInputRef}
                  onChange={_.curry(this.handleChangeField)('name')}
                  placeholder="Full name" />
              </div>
            </div>
            <div className="row">
              <div className="form-group col-sm-12">
                <label htmlFor="participant_email">Email</label>
                <input
                  type="email"
                  id="participant_email"
                  className="form-control"
                  value={this.state.email}
                  onChange={_.curry(this.handleChangeField)('email')}
                  placeholder="Email" />
              </div>
            </div>
            <div className="row">
              <div className="form-group col-sm-12">
                <label htmlFor="participant_phone_number">Phone number</label>
                <PhoneInput
                  id="participant_phone_number"
                  defaultCountry="US"
                  placeholder="Enter phone number"
                  value={this.state.phoneNumber}
                  onChange={val => this.setState({ phoneNumber: val || '' })} />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              type="submit"
              disabled={!isValid}>
              {confirmLabel}
            </Button>
            &nbsp;
            <Button color="secondary" onClick={this.handleToggle}>
              Cancel
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    );
  }
}

ParticipantModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  participant: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

ParticipantModal.defaultProps = {
  participant: null
};
