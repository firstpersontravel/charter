import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { NavLink } from 'react-router-dom';

// Convert url object into string
function formatUrl(url) {
  if (typeof url === 'object') {
    return `${url.pathname}${url.search || ''}`;
  }
  return url;
}

function getUrlPath(url) {
  return url.pathname || url;
}

export default class ResponsiveListGroup extends Component {
  constructor(props) {
    super(props);
    this.handleSelectItem = this.handleSelectItem.bind(this);
  }

  handleSelectItem(e) {
    if (!e.target.value) {
      return;
    }
    this.props.history.push(e.target.value);
  }

  renderSelect() {
    const enabledItems = this.props.items.filter(item => !item.disabled);
    const selectedItem = _.find(enabledItems, item => (
      _.startsWith(window.location.pathname, getUrlPath(item.url))
    ));
    const selectedUrl = formatUrl(_.get(selectedItem, 'url') || '');
    const emptyOption = selectedUrl ? null : (
      <option value="">---</option>
    );
    const renderedOptions = enabledItems
      .map(item => (
        <option key={item.key} value={formatUrl(item.url)}>
          {item.text}
        </option>
      ));
    return (
      <div className="d-sm-none mb-2">
        <select
          className="form-control"
          value={selectedUrl}
          onChange={this.handleSelectItem}>
          {emptyOption}
          {renderedOptions}
        </select>
      </div>
    );
  }

  renderItem(item) {
    const disabledClass = item.disabled ? 'disabled faint' : '';
    const itemClass = `${this.props.itemClassName} ${item.className || ''}`;
    const className = `${itemClass} ${disabledClass}`;
    return (
      <NavLink
        className={className}
        activeClassName={item.disabled ? '' : this.props.itemActiveClassName}
        exact={item.isExact}
        isActive={item.isActive}
        key={item.key}
        to={item.url}>
        {item.label}
      </NavLink>
    );
  }

  renderGroup() {
    const renderedItems = this.props.items.map(i => this.renderItem(i));
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
  history: PropTypes.object.isRequired,
  listClassName: PropTypes.string,
  itemClassName: PropTypes.string,
  itemActiveClassName: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.shape({
    classNames: PropTypes.string,
    disabled: PropTypes.bool,
    isActive: PropTypes.func,
    isExact: PropTypes.bool,
    key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.node.isRequired,
    text: PropTypes.string.isRequired,
    url: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired
  })).isRequired
};

ResponsiveListGroup.defaultProps = {
  listClassName: 'list-group list-group-flush',
  itemClassName: 'list-group-item list-group-item-action constrain-text',
  itemActiveClassName: 'active'
};
