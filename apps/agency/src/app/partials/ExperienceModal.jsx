import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

function nameForTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^A-Za-z0-9-_\s]/g, '')
    .replace(/[\s_-]+/g, '-');
}

function titleForExample(example, existingExperiences) {
  if (!_.find(existingExperiences, { title: example.title })) {
    return `${example.title}`;
  }
  const numExisting = _.filter(existingExperiences, exp => (
    _.startsWith(exp.title, example.title)
  )).length;
  return `${example.title} #${numExisting + 1}`;
}

export default class ExperienceModal extends Component {
  static getDefaultState(experience, example, existingExperiences) {
    if (experience) {
      return {
        name: experience.name,
        title: experience.title,
        domain: experience.domain,
        timezone: experience.timezone
      };
    }
    if (example) {
      const title = titleForExample(example, existingExperiences);
      return {
        name: nameForTitle(title),
        title: title,
        domain: '',
        timezone: 'US/Pacific'
      };
    }
    return { name: '', title: '', domain: '', timezone: 'US/Pacific' };
  }

  constructor(props) {
    super(props);
    this.state = ExperienceModal.getDefaultState(props.experience,
      props.example, props.existingExperiences);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleChangeField = this.handleChangeField.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.firstInputRef = React.createRef();
  }

  componentWillReceiveProps(nextProps) {
    this.setState(ExperienceModal.getDefaultState(nextProps.experience,
      nextProps.example, nextProps.existingExperiences));
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.isOpen && !prevProps.isOpen) {
      if (this.firstInputRef.current) {
        this.firstInputRef.current.focus();
      }
    }
  }

  getExperienceWithOverlappingName() {
    return _.find(this.props.existingExperiences, {
      name: this.state.name
    });
  }


  handleToggle() {
    if (this.props.isOpen) {
      this.props.onClose();
    }
  }

  handleConfirm(e) {
    e.preventDefault();
    this.props.onConfirm(this.props.example, this.state);
  }

  handleChangeField(fieldName, event) {
    const LOCKED_NAMES = ['theheadlandsgamble', 'tacosyndicate'];
    this.setState({ [fieldName]: event.target.value });
    if (fieldName === 'title' && this.state.name !== LOCKED_NAMES) {
      const newName = nameForTitle(event.target.value);
      this.setState({ name: newName });
    }
  }

  hasOverlappingName() {
    const overlap = this.getExperienceWithOverlappingName();
    if (!overlap) {
      return false;
    }
    if (!this.props.experience) {
      return true;
    }
    // if one overlaps ours, but it's the same id, it's fine.
    return overlap.id !== this.props.experience.id;
  }

  isValid() {
    if (this.state.name === '') {
      return false;
    }
    if (this.hasOverlappingName()) {
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

    const overlapWarning = this.hasOverlappingName() ? (
      <div className="alert alert-warning">
        An existing experience has a title too close to
        &nbsp;&quot;{this.state.title}&quot;; please choose a distinct title.
      </div>
    ) : null;

    return (
      <Modal
        isOpen={this.props.isOpen}
        toggle={this.handleToggle}
        zIndex={3000}>
        <ModalHeader toggle={this.handleToggle}>{title}</ModalHeader>
        <ModalBody>
          <form onSubmit={this.handleConfirm}>
            <div className="row">
              <div className="form-group col-12">
                {overlapWarning}
                <label htmlFor="exp_title">Title</label>
                <input
                  type="text"
                  id="exp_title"
                  className="form-control"
                  value={this.state.title}
                  ref={this.firstInputRef}
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
            type="submit"
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
  existingExperiences: PropTypes.array.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

ExperienceModal.defaultProps = {
  experience: null,
  example: null
};
