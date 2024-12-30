import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

import { TextUtil } from 'fptcore';

function getVariantSections(script) {
  if (!script || !script.content) {
    return [];
  }
  return _(script.content.variants)
    .map('section')
    .filter(Boolean)
    .uniq()
    .sort()
    .value();
}

function getDefaultState(script, trip) {
  const existingVariantNames = trip ?
    trip.variantNames.split(',').filter(Boolean) : [];
  const variantSections = getVariantSections(script);
  const variants = script && script.content && script.content.variants;
  const variantNames = variantSections.map((section, i) => (
    existingVariantNames[i] || _.get(_.filter(variants, {
      section: section
    })[0], 'name')
  ));
  return {
    variantNames: variantNames,
    title: trip ? trip.title : ''
  };
}

export default class TripModal extends Component {
  constructor(props) {
    super(props);
    this.state = getDefaultState(props.script, props.trip);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleChangeField = this.handleChangeField.bind(this);
    this.handleChangeVariant = this.handleChangeVariant.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.titleInputRef = React.createRef();
  }

  componentWillReceiveProps(nextProps) {
    this.setState(getDefaultState(nextProps.script, nextProps.trip));
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.isOpen &&
        !prevProps.isOpen &&
        this.titleInputRef.current) {
      this.titleInputRef.current.focus();
    }
  }

  handleToggle() {
    if (this.props.isOpen) {
      this.props.onClose();
    }
  }

  handleConfirm(e) {
    this.props.onConfirm(this.props.script, _.extend({}, this.state));
    if (e) {
      e.preventDefault();
    }
  }

  handleChangeField(fieldName, event) {
    this.setState({ [fieldName]: event.target.value });
  }

  handleChangeVariant(section, event) {
    const variantSections = getVariantSections(this.props.script);
    const sectionIndex = variantSections.indexOf(section);
    const variantNames = _.clone(this.state.variantNames);
    variantNames[sectionIndex] = event.target.value;
    this.setState({ variantNames: variantNames });
  }

  render() {
    const script = this.props.script;
    if (!script || !script.content) {
      return null;
    }
    const trip = this.props.trip;
    const newTitle = 'New run';
    const title = trip ? `Edit ${trip.title}` : newTitle;
    const isNew = !trip;
    const confirmLabel = isNew ? 'Create' : 'Update';
    const isValid = this.state.date !== '' && this.state.title !== '';
    const variantSections = getVariantSections(script);
    const variantFields = variantSections.map((section, i) => {
      const options = _.filter(script.content.variants, {
        section: section
      });
      const groupOptions = options.map(variant => (
        <option key={variant.name} value={variant.name}>
          {variant.title}
        </option>
      ));
      const htmlName = `trip_variant_section_${section}`;
      return (
        <div className="form-group row" key={htmlName}>
          <label className="col-sm-3 col-form-label" htmlFor={htmlName}>
            {TextUtil.titleForKey(section)}
          </label>
          <div className="col-sm-9">
            <select
              className="form-control"
              id={htmlName}
              onChange={_.curry(this.handleChangeVariant)(section)}
              value={this.state.variantNames[i]}>
              {groupOptions}
            </select>
          </div>
        </div>
      );
    });

    return (
      <Modal isOpen={this.props.isOpen} toggle={this.handleToggle} zIndex={3000}>
        <ModalHeader toggle={this.handleToggle}>{title}</ModalHeader>
        <ModalBody>
          <form onSubmit={this.handleConfirm}>
            <div className="form-group row">
              <label className="col-sm-3 col-form-label" htmlFor="trip_title">Title</label>
              <div className="col-sm-9">
                <input
                  type="text"
                  id="trip_title"
                  className="form-control"
                  value={this.state.title}
                  ref={this.titleInputRef}
                  onChange={_.curry(this.handleChangeField)('title')}
                  placeholder="Title" />
              </div>
            </div>
            {variantFields}
          </form>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
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

TripModal.propTypes = {
  script: PropTypes.object.isRequired,
  isOpen: PropTypes.bool.isRequired,
  trip: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

TripModal.defaultProps = {
  trip: null
};
