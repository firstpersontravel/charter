import Markdown from 'react-markdown';
import React from 'react';
import PropTypes from 'prop-types';

export default function TextPanel({ panel, evaluator }) {
  const textStyleClass = panel.style ? `page-panel-text-${panel.style}` : '';
  const humanizedText = evaluator.humanizeText(panel.text);
  return (
    <div className={`page-panel-text page-panel-padded ${textStyleClass}`}>
      <div className="pure-g">
        <div className="pure-u-1">
          <Markdown>
            {humanizedText}
          </Markdown>
        </div>
      </div>
    </div>
  );
}

TextPanel.propTypes = {
  panel: PropTypes.object.isRequired,
  evaluator: PropTypes.object.isRequired
};
