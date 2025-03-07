/* eslint-disable react/no-unused-prop-types */
import React from 'react';
import PropTypes from 'prop-types';

import AudioForegroundPanel from '../panels/audio-foreground';
import ButtonPanel from '../panels/button';
import ChoicePanel from '../panels/choice';
import ContentBrowsePanel from '../panels/content-browse';
import DirectionsPanel from '../panels/directions';
import ImagePanel from '../panels/image';
import MessagesBrowsePanel from '../panels/messages-browse';
import MessagesThreadPanel from '../panels/messages-thread';
import NumberpadPanel from '../panels/numberpad';
import TextEntryPanel from '../panels/text-entry';
import TextPanel from '../panels/text';
import VideoPanel from '../panels/video';
import YesnoPanel from '../panels/yesno';

const panelTypes = {
  audio_foreground: AudioForegroundPanel,
  button: ButtonPanel,
  choice: ChoicePanel,
  content_browse: ContentBrowsePanel,
  directions: DirectionsPanel,
  image: ImagePanel,
  messages_browse: MessagesBrowsePanel,
  messages: MessagesThreadPanel,
  numberpad: NumberpadPanel,
  text: TextPanel,
  text_entry: TextEntryPanel,
  video: VideoPanel,
  yesno: YesnoPanel
};

function renderSubpanel(props) {
  if (panelTypes[props.panel.type]) {
    return React.createElement(panelTypes[props.panel.type], props);
  }
  return (
    <div>
      Unknown type:
      {' '}
      {props.panel.type}
    </div>
  );
}

export default function Panel(props) {
  return renderSubpanel({ ...props, renderSubpanel: renderSubpanel });
}

Panel.propTypes = {
  panel: PropTypes.object.isRequired,
  evaluator: PropTypes.object.isRequired,
  fireEvent: PropTypes.func.isRequired,
  postAction: PropTypes.func.isRequired
};
