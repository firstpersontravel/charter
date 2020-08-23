import _ from 'lodash';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

import { coreWalker } from 'fptcore';

import {
  duplicateComponent,
  getNewComponent,
  getComponentVariantOptions
} from '../../utils/resource-utils';
import { newItemForSpec } from './utils';

function canRemove(script, itemSpec, item) {
  if (itemSpec.type === 'component') {
    const refs = coreWalker.getResourcesReferencingComponent(
      script.content, itemSpec.component, item.id);
    if (refs.length > 0) {
      return false;
    }
  }
  return true;
}

function renderRemoveBtn(script, value, path, itemSpec, item, index, onPropUpdate) {
  const removable = canRemove(script, itemSpec, item);
  return (
    <DropdownItem
      onClick={() => {
        const updated = value.slice(0, index).concat(value.slice(index + 1));
        onPropUpdate(path, updated);
      }}
      className={`dropdown-item btn btn-link ${removable ? '' : 'disabled'}`}>
      <i className="fa fa-trash-o" /> {removable ? 'Remove' : 'Can\'t remove'}
    </DropdownItem>
  );
}

function renderNewItemBtn(value, path, itemSpec, item, index, onPropUpdate,
  toggleDropdown) {
  if (itemSpec.type === 'component') {
    // Show component types -- default dropdown doesn't work because
    // disappearing this context menu removes the relative positioning for
    // the popover.
    const variantOptions = getComponentVariantOptions(itemSpec.component)
      .map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.value === '' ? 'Add above' : opt.label}
        </option>
      ));
    return (
      <DropdownItem>
        <select
          onClick={(e) => { e.stopPropagation(); }}
          className="form-control dropdown-item"
          onChange={(e) => {
            const val = e.target.value;
            if (!val) {
              return;
            }
            const newComponent = getNewComponent(itemSpec.component, val);
            const updated = value.slice(0, index)
              .concat([newComponent])
              .concat(value.slice(index));
            onPropUpdate(path, updated);
            toggleDropdown();
          }}>
          {variantOptions}
        </select>
      </DropdownItem>
    );
  }
  const newItem = newItemForSpec(itemSpec);
  return (
    <DropdownItem
      className="dropdown-item btn btn-link"
      onClick={() => {
        const updated = value.slice(0, index)
          .concat([newItem])
          .concat(value.slice(index));
        onPropUpdate(path, updated);
      }}>
      <i className="fa fa-plus" /> Add item above
    </DropdownItem>
  );
}

function duplicateItem(itemSpec, item) {
  if (itemSpec.type === 'component') {
    return duplicateComponent(itemSpec.component, item);
  }
  return _.cloneDeep(item);
}

function renderDupeBtn(value, path, itemSpec, item, index, onPropUpdate) {
  return (
    <DropdownItem
      onClick={() => {
        const dupe = duplicateItem(itemSpec, item);
        const updated = value.slice(0, index)
          .concat([dupe])
          .concat(value.slice(index));
        onPropUpdate(path, updated);
      }}
      className="dropdown-item btn btn-link">
      <i className="fa fa-copy" /> Duplicate
    </DropdownItem>
  );
}

function renderItemMenuContents(script, resource, spec, value, name, path, opts,
  item, index, onPropUpdate, toggleDropdown) {
  const itemSpec = spec.items;
  const newItemBtn = renderNewItemBtn(value, path, itemSpec, item, index,
    onPropUpdate, toggleDropdown);
  const removeBtn = renderRemoveBtn(script, value, path, itemSpec, item, index,
    onPropUpdate);
  const dupeBtn = renderDupeBtn(value, path, itemSpec, item, index,
    onPropUpdate);
  return (
    <>
      {newItemBtn}
      {dupeBtn}
      {removeBtn}
    </>
  );
}

function renderItemMenu(script, resource, spec, value, name, path, opts,
  item, index, onPropUpdate) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleDropdown = () => setDropdownOpen(prevState => !prevState);

  const menuContents = dropdownOpen ? (
    renderItemMenuContents(script, resource, spec, value, name, path, opts,
      item, index, onPropUpdate, toggleDropdown)
  ) : null;

  return (
    <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
      <DropdownToggle
        color=""
        className="btn-sm btn-outline-secondary">
        <i className="fa fa-circle" />
      </DropdownToggle>
      <DropdownMenu>
        {menuContents}
      </DropdownMenu>
    </Dropdown>
  );
}

function ListItem({ script, resource, spec, value, name, path, opts,
  item, index, onPropUpdate, renderAny }) {
  const AnyField = renderAny;
  const itemPath = `${path}[${index}]`;
  const itemMenu = renderItemMenu(script, resource, spec, value, name, path,
    opts, item, index, onPropUpdate);
  return (
    // eslint-disable-next-line react/no-array-index-key
    <div key={index}>
      <div style={{ float: 'left' }}>
        {itemMenu}
      </div>
      <div style={{ marginLeft: '2em', verticalAlign: 'top' }}>
        <AnyField
          script={script}
          resource={resource}
          onPropUpdate={onPropUpdate}
          spec={spec.items}
          value={item}
          name={`${name} Item`}
          path={itemPath}
          opts={opts} />
      </div>
    </div>
  );
}

ListItem.defaultProps = { opts: {}, value: [] };
ListItem.propTypes = {
  script: PropTypes.object.isRequired,
  resource: PropTypes.object.isRequired,
  onPropUpdate: PropTypes.func.isRequired,
  spec: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  opts: PropTypes.object,
  value: PropTypes.array,
  item: PropTypes.any.isRequired,
  index: PropTypes.number.isRequired,
  renderAny: PropTypes.func.isRequired
};

export default ListItem;
