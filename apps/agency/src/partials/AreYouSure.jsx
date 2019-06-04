import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

export default class AreYouSure extends Component {
  constructor(props) {
    super(props);
    this.cancelButtonRef = React.createRef();
  }

  componentDidUpdate() {
    if (this.cancelButtonRef.current) {
      this.cancelButtonRef.current.focus();
    }
  }

  render() {
    return (
      <Modal
        isOpen={this.props.isOpen}
        toggle={this.props.onToggle}
        zIndex={3000}>
        <ModalHeader toggle={this.props.onToggle}>
          Archive
        </ModalHeader>
        <ModalBody>
          <p>{this.props.message}</p>
        </ModalBody>
        <ModalFooter>
          <button
            className="btn btn-danger"
            onClick={this.props.onConfirm}>
            Confirm
          </button>
          {' '}
          <button
            ref={this.cancelButtonRef}
            className="btn btn-secondary"
            onClick={this.props.onToggle}>
            Cancel
          </button>
        </ModalFooter>
      </Modal>
    );
  }
}

AreYouSure.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  message: PropTypes.string.isRequired
};
