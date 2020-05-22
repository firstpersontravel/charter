import React from 'react';
import PropTypes from 'prop-types';

import { TextUtil } from 'fptcore';

import PopoverControl from '../../../partials/PopoverControl';
import {
  getNewComponent,
  getComponentVariantOptions
} from '../../utils/resource-utils';

function NewComponentBtn({ componentSpec, onConfirm, label }) {
  const componentType = componentSpec.component;
  const variantOptions = getComponentVariantOptions(componentType);
  return (
    <PopoverControl
      title={`New ${TextUtil.singularize(componentType)}`}
      choices={variantOptions}
      helpText={componentSpec.help}
      onConfirm={(val) => {
        if (!val) {
          return;
        }
        onConfirm(getNewComponent(componentType, val));
      }}
      label={label}
      value={''}
      underlined={false} />
  );
}

NewComponentBtn.propTypes = {
  label: PropTypes.node.isRequired,
  componentSpec: PropTypes.object.isRequired,
  onConfirm: PropTypes.func.isRequired
};

export default NewComponentBtn;
