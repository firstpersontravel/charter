import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import { labelForSpec } from '../../utils/spec-utils';
import LabelWithTip from '../LabelWithTip';

function Label({ spec, name }) {
  const shouldShowLabel = _.get(spec, 'display.label') !== false;
  if (!shouldShowLabel) {
    return null;
  }
  const labelText = labelForSpec(spec, name);
  return (
    <LabelWithTip label={labelText} identifier={name} help={spec.help} />
  );
}

Label.propTypes = {
  spec: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired
};

export default Label;
