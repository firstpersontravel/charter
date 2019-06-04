import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

import { TextUtil } from 'fptcore';

function getVariantSections(script) {
  if (!script) {
    return [];
  }
  return _(script.content.variants)
    .map('section')
    .filter(Boolean)
    .uniq()
    .sort()
    .value();
}

function getDefaultState(group, trip, departureName) {
  const defaultDepartureName = departureName || '';
  const existingVariantNames = trip ?
    trip.variantNames.split(',').filter(Boolean) : [];
  const variantSections = getVariantSections(group && group.script);
  const variants = group && group.script && group.script.content.variants;
  const variantNames = variantSections.map((section, i) => (
    existingVariantNames[i] || _.get(_.filter(variants, {
      section: section
    })[0], 'name')
  ));
  return {
    departureName: trip ? trip.departureName : defaultDepartureName,
    variantNames: variantNames,
    title: trip ? trip.title : ''
  };
}

export default class TripModal extends Component {
  constructor(props) {
    super(props);
    this.state = getDefaultState(
      props.group,
      props.trip,
      props.defaultDepartureName);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleChangeField = this.handleChangeField.bind(this);
    this.handleChangeVariant = this.handleChangeVariant.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
    this.titleInputRef = React.createRef();
  }

  componentWillReceiveProps(nextProps) {
    this.setState(getDefaultState(
      nextProps.group,
      nextProps.trip,
      nextProps.defaultDepartureName));
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
    this.props.onConfirm(this.props.group, _.extend({}, this.state));
    if (e) {
      e.preventDefault();
    }
  }

  handleChangeField(fieldName, event) {
    this.setState({ [fieldName]: event.target.value });
  }

  handleChangeVariant(section, event) {
    const variantSections = getVariantSections(this.props.group.script);
    const sectionIndex = variantSections.indexOf(section);
    const variantNames = _.clone(this.state.variantNames);
    variantNames[sectionIndex] = event.target.value;
    this.setState({ variantNames: variantNames });
  }

  render() {
    const group = this.props.group;
    if (!group || !group.script) {
      return null;
    }
    const trip = this.props.trip;
    const newTitle = group ? `New trip on ${moment(group.date).format('MMM D, YYYY')}` : 'New trip';
    const title = trip ? `Edit ${trip.title}` : newTitle;
    const isNew = !trip;
    const confirmLabel = isNew ? 'Create' : 'Update with values';
    const confirmColor = isNew ? 'primary' : 'danger';
    const isValid = this.state.date !== '' && this.state.title !== '';

    const departures = group.script.content.departures || [];
    const departureOptions = departures.map(departure => (
      <option
        key={departure.name}
        value={departure.name}>
        {TextUtil.titleForKey(departure.name)}
      </option>
    ));
    const departureField = departures.length > 0 ? (
      <div className="form-group row">
        <label className="col-sm-3 col-form-label" htmlFor="trip_sched">
          Departure
        </label>
        <div className="col-sm-9">
          <select
            className="form-control"
            id="trip_sched"
            onChange={_.curry(this.handleChangeField)('departureName')}
            value={this.state.departureName}>
            {departureOptions}
          </select>
        </div>
      </div>
    ) : null;

    const variantSections = getVariantSections(group.script);
    const variantFields = variantSections.map((section, i) => {
      const options = _.filter(group.script.content.variants, {
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
            {departureField}
            {variantFields}
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

TripModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  defaultDepartureName: PropTypes.string,
  group: PropTypes.object,
  trip: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

TripModal.defaultProps = {
  trip: null,
  group: null,
  defaultDepartureName: null
};
