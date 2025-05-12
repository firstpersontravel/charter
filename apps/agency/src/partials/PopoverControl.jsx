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
    this.inputRef = React.createRef();
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
    if (this.inputRef.current) {
      this.inputRef.current.focus();
    }
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
          ref={this.inputRef}
          className="form-control me-1 mb-1"
          style={{ maxWidth: '100%' }}
          value={this.state.value}
          onChange={this.handleChange}>
          {options}
        </select>
      );
    }
    // Text area
    if (this.props.isTextarea) {
      return (
        <textarea
          autoFocus
          ref={this.inputRef}
          style={{ width: '100%', display: 'block' }}
          className="form-control mb-2"
          value={this.state.value}
          onChange={this.handleChange} />
      );
    }
    // Text input
    return (
      <input
        autoFocus
        ref={this.inputRef}
        type="text"
        className="form-control me-1"
        style={{ width: '100%', display: 'block' }}
        value={this.state.value}
        onChange={this.handleChange} />
    );
  }

  renderHelp() {
    if (!this.props.helpText) {
      return null;
    }
    return (
      <div className="mb-1" style={{ width: '100%' }}>
        {this.props.helpText}
      </div>
    );
  }

  renderHelpBottom() {
    if (!this.props.helpTextBottom) {
      return null;
    }
    return (
      <div className="mb-1" style={{ fontStyle: 'italic', width: '100%' }}>
        {this.props.helpTextBottom}
      </div>
    );
  }

  render() {
    const valueStyle = {
      cursor: 'pointer',
      borderBottom: this.props.underlined
        ? '1px dashed rgba(0, 0, 0, 0.5)'
        : 'none'
    };
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
          modifiers={[{
            name: 'flip',
            options: {
              fallbackPlacements: ['bottom']
            }
          }]}
          isOpen={this.state.isOpen}
          target={this.labelId}
          toggle={this.handleClose}>
          <PopoverHeader>
            {this.props.title}
          </PopoverHeader>
          <PopoverBody>
            {this.renderHelp()}
            <form className="form-inline">
              {this.renderEdit()}
              {this.renderHelpBottom()}
              <button
                className="btn btn-primary me-1"
                disabled={!this.isValid()}
                onClick={this.handleConfirm}>
                <i className="fa fa-check" />
              </button>
              <button className="btn btn-secondary" onClick={this.handleClose}>
                <i className="fa fa-times" />
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
  helpTextBottom: PropTypes.string,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]),
  labelClassName: PropTypes.string,
  title: PropTypes.string.isRequired,
  choices: PropTypes.array,
  validate: PropTypes.func,
  onConfirm: PropTypes.func.isRequired,
  underlined: PropTypes.bool,
  isTextarea: PropTypes.bool
};

PopoverControl.defaultProps = {
  labelClassName: '',
  label: '',
  choices: null,
  validate: null,
  helpText: null,
  helpTextBottom: null,
  underlined: true,
  isTextarea: false
};
