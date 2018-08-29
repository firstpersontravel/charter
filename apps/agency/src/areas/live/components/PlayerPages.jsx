import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import { EvalCore } from 'fptcore';

function renderPage(participant, page, postAction) {
  const trip = participant.trip;
  const context = participant.trip.context;
  const cueButtons = _(page.panels)
    .filter({ type: 'button' })
    .map(panel => (
      <li key={`${page.name}-${panel.cue}`}>
        {EvalCore.templateText(trip.context, panel.text, trip.script.timezone)}
      </li>
    ))
    .value();
  const cueOptions = cueButtons.length > 0 ? (
    <ul style={{ margin: 0 }}>{cueButtons}</ul>
  ) : null;
  const title = EvalCore.templateText(context, page.title,
    participant.trip.script.timezone);
  const directiveText = EvalCore.templateText(context, page.directive,
    trip.script.timezone);
  const directive = page.directive ? `: ${directiveText}` : '';
  return (
    <div key={page.name}>
      <div><strong>{title}</strong>{directive}</div>
      {cueOptions}
    </div>
  );
}

function renderScenePages(participant, sceneName, pages, postAction) {
  const scene = _.find(participant.trip.script.content.scenes, {
    name: sceneName
  });
  const renderedPages = pages.map(page => (
    renderPage(participant, page, postAction)
  ));
  return (
    <div key={sceneName}>
      <h3>{scene.title}</h3>
      {renderedPages}
    </div>
  );
}

function renderPages(participant, postAction) {
  const pages = _(participant.trip.script.content.pages)
    .filter({ role: participant.roleName })
    .value();
  const sceneNames = _.uniq(_.map(pages, 'scene'));
  return sceneNames
    .map(sceneName => (
      renderScenePages(participant, sceneName,
        _.filter(pages, { scene: sceneName }), postAction)
    ));
}

export default function PlayerPages({ participant, postAction }) {
  const renderedPages = renderPages(participant, postAction);
  return (
    <div>
      {renderedPages}
    </div>
  );
}

PlayerPages.propTypes = {
  participant: PropTypes.object.isRequired,
  postAction: PropTypes.func.isRequired
};
