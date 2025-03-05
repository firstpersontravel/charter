/* eslint-disable react/no-unused-prop-types */
import React from 'react';
import PropTypes from 'prop-types';

import AudioForegroundPanel from '../panels/audio-foreground';
import ButtonPanel from '../panels/button';
import ChoicePanel from '../panels/choice';
import ContentBrowsePanel from '../panels/content-browse';
import DirectionsPanel from '../panels/directions';
import TextPanel from '../panels/text';
import YesnoPanel from '../panels/yesno';

const panelTypes = {
  audio_foreground: AudioForegroundPanel,
  button: ButtonPanel,
  choice: ChoicePanel,
  content_browse: ContentBrowsePanel,
  directions: DirectionsPanel,
  text: TextPanel,
  yesno: YesnoPanel
};

function renderSubpanel(props) {
  if (panelTypes[props.panel.type]) {
    return React.createElement(panelTypes[props.panel.type], props);
  }
  return (
    <div>
      Unknown type: {props.panel.type}
    </div>
  );
}

export default function Panel(props) {
  return renderSubpanel({ ...props, renderSubpanel: renderSubpanel });
}

Panel.propTypes = {
  panel: PropTypes.object.isRequired,
  evaluator: PropTypes.object.isRequired,
  fireEvent: PropTypes.func.isRequired
};
