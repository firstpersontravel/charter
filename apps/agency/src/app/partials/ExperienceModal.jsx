import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap';

const LOCKED_NAMES = ['theheadlandsgamble', 'tacosyndicate'];

const TIMEZONES = [
  'US/Eastern',
  'US/Mountain',
  'US/Central',
  'US/Pacific',
  'Europe/London',
  'Europe/Amsterdam',
  'Europe/Paris',
  'Europe/Berlin'
];

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

function getDefaultState(experience, example, existingExperiences) {
  if (experience) {
    return {
      name: experience.name,
      title: experience.title,
      domain: experience.domain,
      timezone: experience.timezone,
      countryCode: experience.countryCode,
      areaCode: experience.areaCode
    };
  }
  if (example) {
    const title = titleForExample(example, existingExperiences);
    return {
      name: nameForTitle(title),
      title: title,
      domain: '',
      timezone: 'US/Pacific',
      countryCode: 1,
      areaCode: null
    };
  }
  return {
    name: '', title: '', domain: '', timezone: 'US/Pacific', countryCode: 1, areaCode: null
  };
}

export default class ExperienceModal extends Component {
  static getDerivedStateFromProps(props, state) {
    if (props.experience && props.experience.id !== state.prevExpId) {
      return Object.assign(
        { prevExpId: props.experience.id },
        getDefaultState(props.experience, props.example,
          props.existingExperiences)
      );
    }
    return null;
  }

  constructor(props) {
    super(props);
    this.state = getDefaultState(props.experience, props.example,
      props.existingExperiences);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleChangeField = this.handleChangeField.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.firstInputRef = React.createRef();
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
    this.props.onConfirm(this.props.example, {
      name: this.state.name,
      title: this.state.title,
      domain: this.state.domain,
      timezone: this.state.timezone,
      countryCode: this.state.countryCode,
      areaCode: this.state.areaCode
    });
  }

  handleChangeField(fieldName, event) {
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
    const { experience } = this.props;
    const { example } = this.props;
    const exampleTitle = example ? example.title.toLowerCase() : 'project';
    const title = experience ? 'Edit project' : `New ${exampleTitle}`;
    const isNew = !experience;
    const confirmLabel = isNew ? 'Create' : 'Update';
    const isValid = this.isValid();
    const timezoneOptions = TIMEZONES.map(timezone => (
      <option key={timezone} value={timezone}>
        {timezone}
      </option>
    ));

    const { host } = window.location;
    const placeholderDomain = host;
    const timezoneRow = isNew ? null : (
      <div className="row">
        <div className="form-group col-12">
          <label htmlFor="exp_timezone">Time zone</label>
          <select
            className="form-control"
            id="exp_timezone"
            onChange={e => this.handleChangeField('timezone', e)}
            value={this.state.timezone}>
            {timezoneOptions}
          </select>
        </div>
      </div>
    );
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
            onChange={e => this.handleChangeField('domain', e)}
            placeholder={placeholderDomain} />
        </div>
      </div>
    );

    const countryAndAreaCodeRow = isNew ? null : (
      <div className="row">
        <div className="form-group col-6">
          <label htmlFor="exp_country_code">
            Country Code
          </label>
          <input
            type="number"
            id="exp_country_code"
            className="form-control"
            value={this.state.countryCode}
            onChange={e => this.handleChangeField('countryCode', e)}
            placeholder="Country code" />
        </div>
        <div className="form-group col-6">
          <label htmlFor="exp_area_code">
            Area Code
          </label>
          <input
            type="number"
            id="exp_area_code"
            className="form-control"
            value={this.state.areaCode || ''}
            onChange={e => this.handleChangeField('areaCode', e)}
            placeholder="Area code" />
        </div>
      </div>
    );

    const overlapWarning = this.hasOverlappingName() ? (
      <div className="alert alert-warning">
        An existing experience has a title too close to
        &quot;
        {this.state.title}
        &quot;; please choose a distinct title.
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
                  onChange={e => this.handleChangeField('title', e)}
                  placeholder="Title" />
              </div>
            </div>
            {timezoneRow}
            {countryAndAreaCodeRow}
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
