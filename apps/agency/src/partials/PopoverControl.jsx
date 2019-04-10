import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Popover, PopoverHeader, PopoverBody } from 'reactstrap';

export default class PopoverControl extends Component {

  constructor(props) {
    super(props);
    this.handleClose = this.handleClose.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.state = {
      isOpen: false,
      value: props.value,
      lastClosed: null
    };
    this.labelId = `label-${_.uniqueId()}`;
  }

  handleOpen() {
    // Don't proceed if it's open, since this also triggers a toggle event.
    if (this.state.isOpen) {
      return;
    }
    // Hack: since reactstrap popover doesn't pass us back the event,
    // we can't tell whether the popover was closed by a click to the label,
    // so we can't differentiate a double click event which would close
    // and immediately re-open the popover. So this hack.
    const timeSinceClosed = new Date().getTime() - this.state.lastClosed;
    if (timeSinceClosed < 10) {
      return;
    }
    this.setState({ isOpen: true, value: this.props.value });
  }

  handleClose(event) {
    if (event) {
      event.preventDefault();
    }
    this.setState({ isOpen: false, lastClosed: new Date().getTime() });
  }

  handleChange(event) {
    event.preventDefault();
    this.setState({ value: event.target.value });
  }

  handleConfirm(event) {
    event.preventDefault();
    if (!this.isValid()) {
      return;
    }
    this.props.onConfirm(this.state.value);
    this.handleClose();
  }

  isValid() {
    if (!this.props.validate) {
      return true;
    }
    return this.props.validate(this.state.value);
  }

  renderEdit() {
    // Select box
    if (this.props.choices) {
      const options = this.props.choices
        .map((choice) => {
          const value = _.isPlainObject(choice) ? choice.value : choice;
          const label = _.isPlainObject(choice) ? choice.label : choice;
          return <option key={value} value={value}>{label}</option>;
        });
      return (
        <select
          autoFocus
          className="form-control"
          value={this.state.value}
          onChange={this.handleChange}>
          {options}
        </select>
      );
    }
    // Text area
    if (this.props.value.length > 30) {
      return (
        <textarea
          autoFocus
          className="form-control"
          value={this.state.value}
          onChange={this.handleChange} />
      );
    }
    // Text input
    return (
      <input
        autoFocus
        type="text"
        className="form-control"
        value={this.state.value}
        onChange={this.handleChange} />
    );
  }

  render() {
    const valueStyle = {
      borderBottom: '1px dashed rgba(0, 0, 0, 0.5)',
      cursor: 'pointer'
    };
    const edit = this.renderEdit();
    const helpText = this.props.helpText ? (
      <p>{this.props.helpText}</p>
    ) : null;
    return (
      <span className="popover-control">
        <button
          style={valueStyle}
          id={this.labelId}
          onClick={this.handleOpen}
          className="btn-unstyled">
          <span className={this.props.labelClassName}>
            {this.props.label || this.props.value}
          </span>
        </button>
        <Popover
          placement="top"
          isOpen={this.state.isOpen}
          target={this.labelId}
          toggle={this.handleClose}>
          <PopoverHeader>{this.props.title}</PopoverHeader>
          <PopoverBody>
            {helpText}
            <form className="form-inline">
              {edit}
              &nbsp;
              <button
                className="btn btn-primary"
                disabled={!this.isValid()}
                onClick={this.handleConfirm}>
                <i className="fa fa-check" />
              </button>
              &nbsp;
              <button className="btn btn-secondary" onClick={this.handleClose}>
                <i className="fa fa-close" />
              </button>
            </form>
          </PopoverBody>
        </Popover>
      </span>
    );
  }
}

PopoverControl.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helpText: PropTypes.string,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]),
  labelClassName: PropTypes.string,
  title: PropTypes.string.isRequired,
  choices: PropTypes.array,
  validate: PropTypes.func,
  onConfirm: PropTypes.func.isRequired
};

PopoverControl.defaultProps = {
  labelClassName: '',
  label: '',
  choices: null,
  validate: null,
  helpText: null
};
