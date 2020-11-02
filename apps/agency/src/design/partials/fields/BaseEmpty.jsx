import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import { defaultForSpec, doesSpecHaveDefault } from '../../utils/resource-utils';

const booleanLabels = ['No', 'Yes'];

function stringOrYesNo(val) {
  if (_.isBoolean(val)) {
    return booleanLabels[Number(val)];
  }
  return val.toString();
}

function BaseEmpty({ spec }) {
  const nullIsNone = (
    spec.type === 'reference' ||
    spec.type === 'timeOffset'
  );
  const nullText = nullIsNone ? 'None' : 'Empty';
  let label = _.get(spec, 'display.placeholder') || nullText;
  if (doesSpecHaveDefault(spec)) {
    label = `${stringOrYesNo(defaultForSpec(spec))} by default`;
  }
  return (
    <em className="faint">{label}</em>
  );
}

BaseEmpty.propTypes = {
  spec: PropTypes.object.isRequired
};

export default BaseEmpty;
