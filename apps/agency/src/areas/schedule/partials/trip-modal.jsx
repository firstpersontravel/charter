import _ from 'lodash';
import moment from 'moment';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

import { TextCore } from 'fptcore';

export default class TripModal extends Component {

  static getDefaultState(script, playthrough, departureName) {
    const defaultDepartureName = departureName || 'T1';
    const existingVariantNames = playthrough ?
      playthrough.variantNames.split(',').filter(Boolean) : [];
    const variantGroups = (script && script.content.variant_groups) || [];
    const variantNames = variantGroups.map((g, i) => (
      existingVariantNames[i] || _.get(_.filter(script.content.variants, {
        variant_group: g.name
      })[0], 'name')
    ));
    return {
      departureName: playthrough ? playthrough.departureName :
        defaultDepartureName,
      variantNames: variantNames,
      title: playthrough ? playthrough.title : ''
    };
  }

  constructor(props) {
    super(props);
    this.state = TripModal.getDefaultState(
      props.script,
      props.playthrough,
      props.defaultDepartureName);
    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleChangeField = this.handleChangeField.bind(this);
    this.handleChangeVariant = this.handleChangeVariant.bind(this);
    this.handleToggle = this.handleToggle.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(TripModal.getDefaultState(
      nextProps.script,
      nextProps.playthrough,
      nextProps.defaultDepartureName));
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.isOpen && !prevProps.isOpen) {
      this.titleInput.focus();
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

  handleChangeVariant(variantGroupName, event) {
    const variantGroupIndex = _.findIndex(
      this.props.script.content.variant_groups, { name: variantGroupName });
    const variantNames = _.clone(this.state.variantNames);
    variantNames[variantGroupIndex] = event.target.value;
    this.setState({ variantNames: variantNames });
  }

  render() {
    const script = this.props.script;
    const group = this.props.group;
    const trip = this.props.playthrough;
    const newTitle = group ? `New trip on ${moment(group.date).format('MMM D, YYYY')}` : 'New trip';
    const title = trip ? `Edit ${trip.title}` : newTitle;
    const isNew = !trip;
    const confirmLabel = isNew ? 'Create' : 'Update with values';
    const confirmColor = isNew ? 'primary' : 'danger';
    const isValid = this.state.date !== '' && this.state.title !== '';

    const departures = script ? script.content.departures : [];
    const scheduleOptions = departures.map(departure => (
      <option
        key={departure.name}
        value={departure.name}>
        {TextCore.titleForKey(departure.name)}
      </option>
    ));

    const variantGroups = (script && script.content.variant_groups) || [];
    const variantFields = variantGroups.map((g, i) => {
      const options = _.filter(script.content.variants, {
        variant_group: g.name
      });
      const groupOptions = options.map(variant => (
        <option key={variant.name} value={variant.name}>
          {variant.title}
        </option>
      ));
      const htmlName = `trip_variant_group_${g.name}`;
      return (
        <div className="form-group row" key={htmlName}>
          <label className="col-sm-3 col-form-label" htmlFor={htmlName}>
            {g.title}
          </label>
          <div className="col-sm-9">
            <select
              className="form-control"
              id={htmlName}
              onChange={_.curry(this.handleChangeVariant)(g.name)}
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
                  ref={(input) => { this.titleInput = input; }}
                  onChange={_.curry(this.handleChangeField)('title')}
                  placeholder="Title" />
              </div>
            </div>
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
                  {scheduleOptions}
                </select>
              </div>
            </div>
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
  script: PropTypes.object,
  playthrough: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

TripModal.defaultProps = {
  playthrough: null,
  group: null,
  script: null,
  defaultDepartureName: null
};
