import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { TextUtil } from 'fptcore';

import TripTestHarness from '../partials/TripTestHarness';

function variantSectionsForScript(script) {
  return _(_.get(script, 'content.variants'))
    .map('section')
    .filter(Boolean)
    .uniq()
    .value();
}

function variantOptionsForSection(script, section) {
  return _(_.get(script, 'content.variants'))
    .filter({ section: section })
    .value();
}

function initialStateForScript(script) {
  return {
    startedAt: new Date().getTime(),
    variantSections: _(variantSectionsForScript(script))
      .map(section => (
        [section, _.get(variantOptionsForSection(script, section), '[0].name')]
      ))
      .fromPairs()
      .value()
  };
}

// eslint-disable-next-line react/prefer-stateless-function
export default class Test extends Component {
  constructor(props) {
    super(props);
    this.state = initialStateForScript(props.script);
    this.handleChangeField = this.handleChangeField.bind(this);
    this.handleChangeVariant = this.handleChangeVariant.bind(this);
    this.handleReset = this.handleReset.bind(this);
  }

  handleChangeField(fieldName, event) {
    this.setState({
      [fieldName]: event.target.value
    });
  }

  handleChangeVariant(sectionName, event) {
    this.setState(prevState => ({
      variantSections: {
        ...prevState.variantSections,
        [sectionName]: event.target.value
      }
    }));
  }

  handleReset() {
    this.setState(initialStateForScript(this.props.script));
  }

  renderVariantSelect(section) {
    const variants = variantOptionsForSection(this.props.script, section);
    if (!variants.length) {
      return null;
    }
    const variantOptions = variants
      .map(variant => (
        <option key={variant.name} value={variant.name}>
          {variant.title}
        </option>
      ));
    return (
      <div className="form-group" key={section}>
        <label htmlFor={`variant_${section}`}>
          {TextUtil.titleForKey(section)}
        </label>
        <select
          className="form-control"
          id={`variant_${section}`}
          onChange={_.curry(this.handleChangeVariant)(section)}
          value={this.state.variantSections[section]}>
          {variantOptions}
        </select>
      </div>
    );
  }

  renderVariantSelects() {
    return variantSectionsForScript(this.props.script)
      .map(section => this.renderVariantSelect(section));
  }

  renderParams() {
    return (
      <div>
        {this.renderVariantSelects()}
      </div>
    );
  }

  renderReset() {
    return (
      <button
        className="btn btn-block btn-primary"
        onClick={this.handleReset}>
        Reset
      </button>
    );
  }

  render() {
    const variantNames = Object.values(this.state.variantSections);
    const hasSidePanel = !!variantSectionsForScript(this.props.script).length;
    const sidePanel = hasSidePanel ? (
      <div className="col-sm-1 script-tester-col">
        {this.renderParams()}
        {this.renderReset()}
      </div>
    ) : null;
    const testHarnessClass = hasSidePanel ? 'col-sm-11' : 'col-sm-12';
    return (
      <div className="container-fluid">
        <div className="row row-eq-height script-tester-container">
          {sidePanel}
          <div className={`${testHarnessClass} script-tester-col`}>
            <TripTestHarness
              script={this.props.script}
              variantNames={variantNames}
              startedAt={this.state.startedAt}
              trackEvent={this.props.trackEvent} />
          </div>
        </div>
      </div>
    );
  }
}

Test.propTypes = {
  script: PropTypes.object.isRequired,
  trackEvent: PropTypes.func.isRequired
};
