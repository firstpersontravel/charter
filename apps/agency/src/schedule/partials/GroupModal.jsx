import _ from 'lodash';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

export default class GroupModal extends Component {
  static getDefaultState(group, scripts, propDefaults) {
    const defaults = {
      date: propDefaults.date || moment(),
      scriptId: propDefaults.scriptId ||
        _.get(_.find(scripts, 'isActive'), 'id')
    };
    return {
      date: group ? moment(group.date) : defaults.date,
      scriptId: Number(group ? group.scriptId : defaults.scriptId)
    };
  }

  constructor(props) {
    super(props);
    const propDefaults = {
      date: this.props.defaultDate,
      scriptId: this.props.defaultScriptId
    };
    this.state = GroupModal.getDefaultState(
      this.props.group, this.props.scripts, propDefaults);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.handleChangeDate = this.handleChangeDate.bind(this);
    this.handleChangeScript = this.handleChangeScript.bind(this);
    this.firstSelectRef = React.createRef();
  }

  componentWillReceiveProps(nextProps) {
    const nextPropDefaults = {
      date: nextProps.defaultDate,
      scriptId: nextProps.defaultScriptId
    };
    const nextState = GroupModal.getDefaultState(
      nextProps.group, nextProps.scripts, nextPropDefaults);
    this.setState(nextState);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.isOpen &&
        !prevProps.isOpen &&
        this.firstSelectRef.current) {
      this.firstSelectRef.current.focus();
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
      scriptId: Number(this.state.scriptId)
    }));
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
    const title = group ? 'Edit run group' : 'New run group';
    const isNew = !group;
    const confirmLabel = isNew ? 'Create' : 'Update with values';
    const confirmColor = isNew ? 'primary' : 'danger';
    const isValid = (this.state.scriptId && this.state.date !== '');
    return (
      <Modal isOpen={this.props.isOpen} toggle={this.handleToggle} zIndex={3000}>
        <ModalHeader toggle={this.handleToggle}>{title}</ModalHeader>
        <ModalBody>
          <form>
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
