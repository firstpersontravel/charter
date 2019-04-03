import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Link, browserHistory } from 'react-router';

function selectItem(e) {
  if (!e.target.value) {
    return;
  }
  browserHistory.push(e.target.value);
}

export default class ResponsiveListGroup extends Component {
  renderSelect() {
    const enabledItems = this.props.items.filter(item => !item.disabled);
    const selectedItem = _.find(enabledItems, item => (
      _.startsWith(window.location.pathname, item.url)
    ));
    const selectedUrl = _.get(selectedItem, 'url') || '';
    const emptyOption = selectedUrl ? null : (
      <option value="">---</option>
    );
    const renderedOptions = enabledItems
      .map(item => (
        <option key={item.key} value={item.url}>
          {item.text}
        </option>
      ));
    return (
      <div className="d-sm-none mb-2">
        <select
          className="form-control"
          value={selectedUrl}
          onChange={selectItem}>
          {emptyOption}
          {renderedOptions}
        </select>
      </div>
    );
  }

  renderGroup() {
    const renderedItems = this.props.items.map(item => (
      <Link
        className={`${this.props.itemClassName} ${item.disabled ? 'disabled faint' : ''}`}
        activeClassName={this.props.itemActiveClassName}
        key={item.key}
        to={item.url}>
        {item.label}
      </Link>
    ));
    return (
      <div className={`${this.props.listClassName} d-none d-sm-block`}>
        {renderedItems}
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.renderSelect()}
        {this.renderGroup()}
      </div>
    );
  }
}

ResponsiveListGroup.propTypes = {
  listClassName: PropTypes.string,
  itemClassName: PropTypes.string,
  itemActiveClassName: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.shape({
    disabled: PropTypes.bool,
    key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.node.isRequired,
    text: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired
  })).isRequired
};

ResponsiveListGroup.defaultProps = {
  listClassName: 'list-group list-group-flush',
  itemClassName: 'list-group-item list-group-item-action constrain-text',
  itemActiveClassName: 'active'
};
