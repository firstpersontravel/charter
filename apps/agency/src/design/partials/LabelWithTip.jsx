import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'reactstrap';

export default class LabelWithTip extends React.Component {
  constructor(props) {
    super(props);
    this.toggle = this.toggle.bind(this);
    this.state = { open: false };
  }

  toggle() {
    this.setState({ open: !this.state.open });
  }

  render() {
    const labelId = `label-${this.props.identifier}`;
    const label = (
      <span
        id={labelId}
        className="mr-1"
        style={{ fontVariant: 'small-caps' }}>
        {this.props.label}:
      </span>
    );
    if (!this.props.help) {
      return label;
    }
    return (
      <>
        {label}
        <Tooltip
          placement="top"
          isOpen={this.state.open}
          target={labelId}
          toggle={this.toggle}>
          {this.props.help}
        </Tooltip>
      </>
    );
  }
}

LabelWithTip.propTypes = {
  label: PropTypes.string.isRequired,
  identifier: PropTypes.string.isRequired,
  help: PropTypes.string
};

LabelWithTip.defaultProps = {
  help: null
};
