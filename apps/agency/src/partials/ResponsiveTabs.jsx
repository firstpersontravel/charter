import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Link, IndexLink, browserHistory } from 'react-router';

function selectItem(e) {
  if (!e.target.value) {
    return;
  }
  browserHistory.push(e.target.value);
}

function renderSelectOptgroup(item) {
  const subItems = item.subItems.map(subitem => (
    <option key={subitem.key || subitem.text} value={subitem.url}>
      {subitem.text}
    </option>
  ));
  return (
    <optgroup key={item.key || item.text} label={item.text}>
      {subItems}
    </optgroup>
  );
}

function renderSelectItem(item) {
  if (item.subItems) {
    return renderSelectOptgroup(item);
  }
  return (
    <option key={item.key || item.text} value={item.url}>
      {item.text}
    </option>
  );
}

export default class ResponsiveTabs extends Component {
  getAllUrls() {
    return _(this.props.items)
      .map((item) => {
        if (item.subItems) {
          return item.subItems.map(subitem => subitem.url);
        }
        return [item.url];
      })
      .flatten()
      .value();
  }

  renderSelect() {
    const selectedUrl = _(this.getAllUrls())
      .filter(url => _.startsWith(window.location.pathname, url))
      .reverse()
      .value()[0];
    const emptyOption = selectedUrl ? null : (
      <option value="">---</option>
    );
    const renderedOptions = this.props.items.map(item => (
      renderSelectItem(item)
    ));
    return (
      <div className="d-sm-none mb-2">
        <select
          className="form-control"
          value={selectedUrl || ''}
          onChange={selectItem}>
          {emptyOption}
          {renderedOptions}
        </select>
      </div>
    );
  }

  renderTabDropdown(item) {
    const subitemLinks = item.subItems.map(subitem => (
      <Link
        key={subitem.key || subitem.text}
        className="dropdown-item"
        to={subitem.url}>
        {subitem.label || subitem.text}
      </Link>
    ));
    return (
      <div
        key={item.key || item.text}
        className={`${this.props.itemClassName} dropdown`}>
        <Link
          className={`${this.props.linkClassName} dropdown-toggle`}
          activeClassName="active"
          data-toggle="dropdown"
          to={item.url}>
          {item.label || item.text}
        </Link>
        <div className="dropdown-menu">
          {subitemLinks}
        </div>
      </div>
    );
  }

  renderTabItem(item) {
    if (item.subItems) {
      return this.renderTabDropdown(item);
    }
    const LinkClass = item.linkClass || Link;
    return (
      <div
        className={this.props.itemClassName}
        key={item.key || item.text}>
        <LinkClass
          className={this.props.linkClassName}
          activeClassName={this.props.linkActiveClassName}
          to={item.url}>
          {item.label || item.text}
        </LinkClass>
      </div>
    );
  }

  renderTabs() {
    const renderedItems = this.props.items.map(item => (
      this.renderTabItem(item)
    ));
    return (
      <div className={`${this.props.listClassName} d-none d-sm-flex`}>
        {renderedItems}
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.renderSelect()}
        {this.renderTabs()}
      </div>
    );
  }
}

ResponsiveTabs.propTypes = {
  listClassName: PropTypes.string,
  itemClassName: PropTypes.string,
  linkClassName: PropTypes.string,
  linkActiveClassName: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    linkClass: PropTypes.oneOf([Link, IndexLink]),
    label: PropTypes.node,
    text: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    subItems: PropTypes.arrayOf(PropTypes.shape({
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.node,
      text: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired
    }))
  })).isRequired
};

ResponsiveTabs.defaultProps = {
  listClassName: 'nav nav-tabs',
  itemClassName: 'nav-item',
  linkClassName: 'nav-link',
  linkActiveClassName: 'active'
};
