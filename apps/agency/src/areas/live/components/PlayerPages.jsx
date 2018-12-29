import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';

import { EvalCore } from 'fptcore';

function renderPage(player, page, postAction) {
  const trip = player.trip;
  const context = player.trip.context;
  const cueButtons = _(page.panels)
    .filter({ type: 'button' })
    .map(panel => (
      <li key={`${page.name}-${panel.cue}`}>
        {EvalCore.templateText(trip.context, panel.text, trip.experience.timezone)}
      </li>
    ))
    .value();
  const cueOptions = cueButtons.length > 0 ? (
    <ul style={{ margin: 0 }}>{cueButtons}</ul>
  ) : null;
  const title = EvalCore.templateText(context, page.title,
    player.trip.experience.timezone);
  const directiveText = EvalCore.templateText(context, page.directive,
    trip.experience.timezone);
  const directive = page.directive ? `: ${directiveText}` : '';
  return (
    <div key={page.name}>
      <div><strong>{title}</strong>{directive}</div>
      {cueOptions}
    </div>
  );
}

function renderScenePages(player, sceneName, pages, postAction) {
  const scene = _.find(player.trip.script.content.scenes, {
    name: sceneName
  });
  const renderedPages = pages.map(page => (
    renderPage(player, page, postAction)
  ));
  return (
    <div key={sceneName}>
      <h3>{scene.title}</h3>
      {renderedPages}
    </div>
  );
}

function renderPages(player, postAction) {
  const pages = _(player.trip.script.content.pages)
    .filter({ role: player.roleName })
    .value();
  const sceneNames = _.uniq(_.map(pages, 'scene'));
  return sceneNames
    .map(sceneName => (
      renderScenePages(player, sceneName,
        _.filter(pages, { scene: sceneName }), postAction)
    ));
}

export default function PlayerPages({ player, postAction }) {
  const renderedPages = renderPages(player, postAction);
  return (
    <div>
      {renderedPages}
    </div>
  );
}

PlayerPages.propTypes = {
  player: PropTypes.object.isRequired,
  postAction: PropTypes.func.isRequired
};
