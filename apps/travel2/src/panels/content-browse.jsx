import React, { useState } from 'react';
import PropTypes from 'prop-types';

export default function ContentBrowsePanel({
  panel, evaluator, fireEvent, postAction, renderSubpanel
}) {
  const scriptContent = evaluator.getScriptContent();
  const sectionName = panel.section;
  if (!scriptContent || !scriptContent.content_pages) {
    return null;
  }
  const sectionItems = scriptContent.content_pages
    .filter(i => i.section === sectionName);
  const visibleItems = sectionItems
    .filter(i => evaluator.evaluateIf(i.active_if));

  const defaultItemName = visibleItems.length > 0 ? visibleItems[0].name : null;
  const [selectedItemName, setSelectedItemName] = useState(defaultItemName);

  const renderedItems = visibleItems.map(item => (
    <li
      key={item.name}
      className={
        `pure-menu-item ${item.name === selectedItemName ? 'pure-menu-selected' : ''}`
      }>
      <a onClick={() => setSelectedItemName(item.name)} className="pure-menu-link">
        {item.title}
      </a>
    </li>
  ));

  const selectedItem = visibleItems.find(i => i.name === selectedItemName);
  const selectedPanels = (selectedItem.panels || [])
    .filter(p => evaluator.evaluateIf(p.visible_if));
  const renderedPanels = selectedPanels
    .map(p => renderSubpanel({
      panel: p, evaluator, fireEvent, postAction, renderSubpanel, key: p.id
    }));

  return (
    <div>
      <div className="page-panel-content-browse pure-g">
        <div className="content-list pure-u-1-4">
          <div className="pure-menu">
            <div className="pure-menu-heading">{panel.title}</div>
            <ul className="pure-menu-list">
              {renderedItems}
            </ul>
          </div>
        </div>
        <div className="content-detail pure-u-3-4 scrollable">
          <div className="content-detail-inner">
            {renderedPanels}
          </div>
        </div>
      </div>
    </div>
  );
}

ContentBrowsePanel.propTypes = {
  panel: PropTypes.object.isRequired,
  evaluator: PropTypes.object.isRequired,
  fireEvent: PropTypes.func.isRequired,
  postAction: PropTypes.func.isRequired,
  renderSubpanel: PropTypes.func.isRequired
};
