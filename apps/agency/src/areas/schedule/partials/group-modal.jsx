import _ from 'lodash';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

export default class GroupModal extends Component {

  static getDefaultState(scripts, group, defaultDate, defaultScriptId) {
    return {
      date: group ? moment.utc(group.date) : (defaultDate || moment.utc()),
      scriptId: group ? group.scriptId : (defaultScriptId || scripts[0].id)
    };
  }

  constructor(props) {
    super(props);
    this.state = GroupModal.getDefaultState(props.scripts, props.group,
      props.defaultDate, props.defaultScriptId);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleChangeField = this.handleChangeField.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.handleChangeDate = this.handleChangeDate.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const nextState = GroupModal.getDefaultState(
      nextProps.scripts, nextProps.group, nextProps.defaultDate,
      nextProps.defaultScriptId);
    this.setState(nextState);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.isOpen && !prevProps.isOpen) {
      this.scriptSelect.focus();
    }
  }

  handleToggle() {
    if (this.props.isOpen) {
      this.props.onClose();
    }
  }

  handleConfirm() {
    this.props.onConfirm(_.extend({}, this.state, {
      date: this.state.date.format('YYYY-MM-DD'),
      scriptId: this.state.scriptId
    }));
  }

  handleChangeField(fieldName, event) {
    this.setState({ [fieldName]: event.target.value });
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
    const isValid = this.state.date !== '' && this.state.title !== '';

    const scriptOptions = this.props.scripts.map(script => (
      <option
        key={script.id}
        value={script.id}>
        {script.title}
      </option>
    ));
    return (
      <Modal isOpen={this.props.isOpen} toggle={this.handleToggle} zIndex={3000}>
        <ModalHeader toggle={this.handleToggle}>{title}</ModalHeader>
        <ModalBody>
          <form>
            <div className="form-group row">
              <label className="col-sm-3 col-form-label" htmlFor="g_script">
                Script
              </label>
              <div className="col-sm-9">
                <select
                  className="form-control"
                  id="g_script"
                  onChange={_.curry(this.handleChangeField)('scriptId')}
                  ref={(input) => { this.scriptSelect = input; }}
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
  scripts: PropTypes.array.isRequired,
  group: PropTypes.object,
  defaultDate: PropTypes.string,
  defaultScriptId: PropTypes.number,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

GroupModal.defaultProps = {
  group: null,
  defaultDate: null,
  defaultScriptId: null
};
