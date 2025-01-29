/* eslint-disable react/no-unused-prop-types */
import React from 'react';
import PropTypes from 'prop-types';

import AudioForegroundPanel from '../panels/audio-foreground';
import ButtonPanel from '../panels/button';
import ChoicePanel from '../panels/choice';
import TextPanel from '../panels/text';

const panelTypes = {
  audio_foreground: AudioForegroundPanel,
  button: ButtonPanel,
  choice: ChoicePanel,
  text: TextPanel
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
