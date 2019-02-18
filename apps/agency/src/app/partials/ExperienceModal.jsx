import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

export default class ExperienceModal extends Component {

  static getDefaultState(experience, example) {
    if (experience) {
      return {
        name: experience.name,
        title: experience.title,
        domain: experience.domain,
        timezone: experience.timezone
      };
    }
    return {
      name: example ? example.name : '',
      title: example ? example.title : '',
      domain: '',
      timezone: 'US/Pacific'
    };
  }

  constructor(props) {
    super(props);
    this.state = ExperienceModal.getDefaultState(props.experience,
      props.example);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleChangeField = this.handleChangeField.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(ExperienceModal.getDefaultState(nextProps.experience,
      nextProps.example));
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
    this.props.onConfirm(this.state);
  }

  handleChangeField(fieldName, event) {
    const LOCKED_NAMES = ['theheadlandsgamble', 'tacosyndicate'];
    this.setState({ [fieldName]: event.target.value });
    if (fieldName === 'title' && this.state.name !== LOCKED_NAMES) {
      const newName = event.target.value
        .toLowerCase()
        .replace(/[\s_]/g, '-')
        .replace(/[^A-Za-z0-9-]/g, '');
      this.setState({ name: newName });
    }
  }

  isValid() {
    if (this.state.name === '') {
      return false;
    }
    if (!/^[a-zA-Z0-9-]+$/.test(this.state.name)) {
      return false;
    }
    if (this.state.title === '') {
      return false;
    }
    if (this.state.domain && !/^[a-zA-Z0-9-.]+$/.test(this.state.domain)) {
      return false;
    }
    return true;
  }

  render() {
    const experience = this.props.experience;
    const example = this.props.example;
    const exampleTitle = example ? example.title.toLowerCase() : 'experience';
    const title = experience ? 'Edit experience' :
      `New ${exampleTitle}`;
    const isNew = !experience;
    const confirmLabel = isNew ? 'Create' : 'Update';
    const isValid = this.isValid();

    const timezones = ['US/Eastern', 'US/Pacific'];
    const timezoneOptions = timezones.map(timezone => (
      <option key={timezone} value={timezone}>
        {timezone}
      </option>
    ));

    const host = window.location.host;
    const placeholderDomain = host;
    const domainRow = isNew ? null : (
      <div className="row">
        <div className="form-group col-12">
          <label htmlFor="exp_host">
            Custom domain (advanced; requires setup)
          </label>
          <input
            type="text"
            id="exp_host"
            className="form-control"
            value={this.state.domain}
            onChange={_.curry(this.handleChangeField)('domain')}
            placeholder={placeholderDomain} />
        </div>
      </div>
    );

    return (
      <Modal
        isOpen={this.props.isOpen}
        toggle={this.handleToggle}
        zIndex={3000}>
        <ModalHeader toggle={this.handleToggle}>{title}</ModalHeader>
        <ModalBody>
          <form>
            <div className="row">
              <div className="form-group col-12">
                <label htmlFor="exp_title">Title</label>
                <input
                  type="text"
                  id="exp_title"
                  className="form-control"
                  value={this.state.title}
                  ref={(input) => { this.firstInput = input; }}
                  onChange={_.curry(this.handleChangeField)('title')}
                  placeholder="Title" />
              </div>
            </div>
            <div className="row">
              <div className="form-group col-12">
                <label htmlFor="exp_timezone">Time zone</label>
                <select
                  className="form-control"
                  id="exp_timezone"
                  onChange={_.curry(this.handleChangeField)('timezone')}
                  value={this.state.timezone}>
                  {timezoneOptions}
                </select>
              </div>
            </div>
            {domainRow}
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

ExperienceModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  experience: PropTypes.object,
  example: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

ExperienceModal.defaultProps = {
  experience: null,
  example: null
};
