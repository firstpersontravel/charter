/* eslint-disable react/no-unused-prop-types */
import React from 'react';
import PropTypes from 'prop-types';

import TextPanel from '../panels/text';
import ButtonPanel from '../panels/button';

const panelTypes = {
  text: TextPanel,
  button: ButtonPanel
};

export default function Panel(props) {
  if (panelTypes[props.panel.type]) {
    return React.createElement(panelTypes[props.panel.type], props);
  }
  return (
    <div>
      Unknown type: {props.panel.type}
    </div>
  );
}

Panel.propTypes = {
  panel: PropTypes.object.isRequired,
  evaluator: PropTypes.object.isRequired,
  fireEvent: PropTypes.func.isRequired
};
