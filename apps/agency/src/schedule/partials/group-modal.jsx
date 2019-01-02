import _ from 'lodash';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

export default class GroupModal extends Component {

  static getDefaultState(group, scripts, propDefaults) {
    const defaults = {
      date: propDefaults.date || moment.utc(),
      scriptId: propDefaults.scriptId || scripts[0].id,
      experienceId: propDefaults.experienceId || scripts[0].experienceId
    };
    return {
      date: group ? moment.utc(group.date) : defaults.date,
      scriptId: Number(group ? group.scriptId : defaults.scriptId),
      experienceId: Number(group ? group.experienceId : defaults.experienceId)
    };
  }

  constructor(props) {
    super(props);
    const propDefaults = {
      date: this.props.defaultDate,
      scriptId: this.props.defaultScriptId,
      experienceId: this.props.defaultExperienceId
    };
    this.state = GroupModal.getDefaultState(
      this.props.group, this.props.scripts, propDefaults);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.handleChangeDate = this.handleChangeDate.bind(this);
    this.handleChangeExperience = this.handleChangeExperience.bind(this);
    this.handleChangeScript = this.handleChangeScript.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const nextPropDefaults = {
      date: nextProps.defaultDate,
      scriptId: nextProps.defaultScriptId,
      experienceId: nextProps.defaultExperienceId
    };
    const nextState = GroupModal.getDefaultState(
      nextProps.group, nextProps.scripts, nextPropDefaults);
    this.setState(nextState);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.isOpen && !prevProps.isOpen) {
      this.experienceSelect.focus();
    }
  }

  getScriptsForExperienceId(experienceId) {
    return this.props.scripts.filter(script => (
      Number(script.experienceId) === Number(experienceId)
    ));
  }

  handleToggle() {
    if (this.props.isOpen) {
      this.props.onClose();
    }
  }

  handleConfirm() {
    this.props.onConfirm(_.extend({}, this.state, {
      date: this.state.date.format('YYYY-MM-DD'),
      experienceId: Number(this.state.experienceId),
      scriptId: Number(this.state.scriptId)
    }));
  }

  handleChangeExperience(e) {
    const scripts = this.getScriptsForExperienceId(e.target.value);
    this.setState({
      experienceId: Number(e.target.value),
      scriptId: scripts[0] && scripts[0].id
    });
  }

  handleChangeScript(e) {
    this.setState({
      scriptId: Number(e.target.value)
    });
  }

  handleChangeDate(value) {
    this.setState({ date: value });
  }

  render() {
    const group = this.props.group;
    const title = group ? 'Edit group' : 'New group';
    const isNew = !group;
    const confirmLabel = isNew ? 'Create' : 'Update with values';
    const confirmColor = isNew ? 'primary' : 'danger';
    const isValid = (
      this.state.experienceId &&
      this.state.scriptId &&
      this.state.date !== ''
    );

    const experienceOptions = this.props.experiences
      .filter(exp => this.getScriptsForExperienceId(exp.id).length > 0)
      .map(experience => (
        <option
          key={experience.id}
          value={experience.id}>
          {experience.title}
        </option>
      ));
    const scriptOptions = this
      .getScriptsForExperienceId(this.state.experienceId)
      .map(script => (
        <option
          key={script.id}
          value={script.id}>
          Revision {script.revision}
        </option>
      ));
    return (
      <Modal isOpen={this.props.isOpen} toggle={this.handleToggle} zIndex={3000}>
        <ModalHeader toggle={this.handleToggle}>{title}</ModalHeader>
        <ModalBody>
          <form>
            <div className="form-group row">
              <label className="col-sm-3 col-form-label" htmlFor="g_script">
                Experience
              </label>
              <div className="col-sm-9">
                <select
                  className="form-control"
                  id="g_script"
                  onChange={this.handleChangeExperience}
                  ref={(input) => { this.experienceSelect = input; }}
                  value={this.state.experienceId}>
                  {experienceOptions}
                </select>
              </div>
            </div>
            <div className="form-group row">
              <label className="col-sm-3 col-form-label" htmlFor="g_script">
                Script
              </label>
              <div className="col-sm-9">
                <select
                  className="form-control"
                  id="g_script"
                  onChange={this.handleChangeScript}
                  value={this.state.scriptId}>
                  {scriptOptions}
                </select>
              </div>
            </div>
            <div className="form-group row">
              <label className="col-sm-3 col-form-label" htmlFor="g_date">
                Date
              </label>
              <div className="col-sm-9">
                <DatePicker
                  placeholderText="Date"
                  id="g_date"
                  dateFormat="YYYY-MM-DD"
                  className="form-control"
                  onChange={this.handleChangeDate}
                  selected={this.state.date} />
              </div>
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button
            color={confirmColor}
            onClick={this.handleConfirm}
            disabled={!isValid}>
            {confirmLabel}
          </Button>
          {' '}
          <Button color="secondary" onClick={this.handleToggle}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    );
  }
}

GroupModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  experiences: PropTypes.array.isRequired,
  scripts: PropTypes.array.isRequired,
  group: PropTypes.object,
  defaultDate: PropTypes.string,
  defaultScriptId: PropTypes.number,
  defaultExperienceId: PropTypes.number,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

GroupModal.defaultProps = {
  group: null,
  defaultDate: null,
  defaultScriptId: null,
  defaultExperienceId: null
};
