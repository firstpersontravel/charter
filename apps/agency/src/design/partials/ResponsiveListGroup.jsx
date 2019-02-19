import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import { Link, browserHistory } from 'react-router';

function selectItem(e) {
  if (!e.target.value) {
    return;
  }
  browserHistory.push(e.target.value);
}

function renderSelect(items) {
  const selectedItem = _.find(items, item => (
    _.startsWith(window.location.pathname, item.url)
  ));
  const selectedUrl = _.get(selectedItem, 'url') || '';
  const emptyOption = selectedUrl ? null : (
    <option value="">---</option>
  );
  const renderedOptions = items.map(item => (
    <option key={item.key} value={item.url}>
      {item.text}
    </option>
  ));
  return (
    <div className="d-sm-none" style={{ marginBottom: '0.5em' }}>
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

function renderGroup(items) {
  const renderedItems = items.map(item => (
    <Link
      className="list-group-item list-group-item-action constrain-text"
      activeClassName="active"
      key={item.key}
      to={item.url}>
      {item.label}
    </Link>
  ));
  return (
    <div className="list-group list-group-flush d-none d-sm-block">
      {renderedItems}
    </div>
  );
}

export default function ResponsiveListGroup({ items }) {
  return (
    <div>
      {renderSelect(items)}
      {renderGroup(items)}
    </div>
  );
}

ResponsiveListGroup.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.node.isRequired,
    text: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired
  })).isRequired
};
