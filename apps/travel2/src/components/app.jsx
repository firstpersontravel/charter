import React, { Component } from 'react';
import PropTypes from 'prop-types';

import CustomCss from '../partials/custom-css';
import Panel from '../partials/panel';
import EventSub from '../util/event-sub';

const DEFAULT_TABS = [{
  title: 'Main',
  panels: [{ type: 'current_page' }]
}];

export default class App extends Component {
  constructor(props) {
    super(props);
    this.onFireEvent = this.onFireEvent.bind(this);
    this.onSelectTab = this.onSelectTab.bind(this);
    this.state = {
      selectedTabName: null
    };
  }

  componentDidMount() {
    this.props.loadData(this.props.match.params.tripId, this.props.match.params.playerId);
  }

  onFireEvent(event) {
    this.props.fireEvent(this.props.trip.id, this.props.player.id, event);
  }

  onSelectTab(e, tabTitle) {
    e.preventDefault();
    this.setState({ selectedTabName: tabTitle });
  }

  getTabs() {
    const iface = this.props.iface;
    return iface && iface.tabs && iface.tabs.length ? iface.tabs : DEFAULT_TABS;
  }

  getVisibleTabs() {
    return this.getTabs().filter(t => this.props.evaluator.evaluateIf(t.visible_if));
  }

  getSelectedTabTitle() {
    const firstVisibleTab = this.getVisibleTabs()[0];
    if (!firstVisibleTab) {
      return null;
    }
    return this.state.selectedTabName || firstVisibleTab.title;
  }

  getSelectedTab() {
    const visibleTabs = this.getVisibleTabs();
    const tab = visibleTabs.find(t => t.title === this.state.selectedTabName);
    return tab || visibleTabs[0];
  }

  getCurrentPageName() {
    return this.props.trip.tripState.currentPageNamesByRole[this.props.player.roleName];
  }

  getCurrentPage() {
    const pageName = this.getCurrentPageName();
    const page = (this.props.script.content.pages || []).find(p => p.name === pageName);
    return page;
  }

  getTabPanels() {
    const selectedTab = this.getSelectedTab();
    const tabPanels = selectedTab ? selectedTab.panels : [];
    return this.collectPanelPartials(tabPanels);
  }

  getPagePanels() {
    const currentPage = this.getCurrentPage();
    if (!currentPage || !currentPage.panels) {
      return [];
    }
    return currentPage.panels.filter(p => this.props.evaluator.evaluateIf(p.visible_if));
  }

  getHeaderPanels() {
    // Show page directive if visible, otherwise just experience title.
    const headerPanels = [{
      type: 'text',
      visible_if: { op: 'value_is_true', ref: 'player.directive' },
      text: '{{player.directive}}',
      style: 'banner'
    }, {
      type: 'text',
      visible_if: {
        op: 'not', item: { op: 'value_is_true', ref: 'player.directive' }
      },
      text: this.props.experience.title,
      style: 'banner'
    }];
    return this.collectPanelPartials(headerPanels);
  }

  collectPanelPartials(basePanels) {
    let collectedPanels = [];
    basePanels.forEach((panel) => {
      if (panel.type === 'current_page') {
        let innerPanels = this.getPagePanels();
        if (!innerPanels || innerPanels.length === 0) {
          innerPanels = [{
            type: 'text',
            text: 'Nothing to display at the moment.',
            style: 'centered'
          }];
        }
        collectedPanels = collectedPanels.concat(innerPanels);
      } else {
        collectedPanels.push(panel);
      }
    }, this);

    collectedPanels = collectedPanels.filter(panel => (
      this.props.evaluator.evaluateIf(panel.visible_if)
    ));

    return collectedPanels;
  }

  shouldShowTabs() {
    return this.getTabs().length > 1;
  }

  renderPanel(panel, i) {
    return (
      <Panel
        key={i}
        panel={panel}
        evaluator={this.props.evaluator}
        fireEvent={this.onFireEvent} />
    );
  }

  renderHeaderPanels() {
    return this.getHeaderPanels().map((h, i) => this.renderPanel(h, i));
  }

  renderTabPanels() {
    return this.getTabPanels().map((p, i) => this.renderPanel(p, i));
  }

  renderTabs() {
    if (!this.shouldShowTabs()) {
      return null;
    }
    const tabItems = this.getVisibleTabs().map(t => (
      <li key={t.title} className={`pure-menu-item ${t.title === this.getSelectedTabTitle() ? 'pure-menu-selected' : ''}`}>
        <a href="#" className="pure-menu-link" onClick={(e) => this.onSelectTab(e, t.title)}>
          {t.title}
        </a>
      </li>
    ));
    return (
      <div className="page-layout-tabs-menu pure-menu pure-menu-horizontal">
        <ul className="pure-menu-list">
          {tabItems}
        </ul>
      </div>
    );
  }

  render() {
    if (!this.props.trip || !this.props.player) {
      return <div>Loading</div>;
    }
    return (
      <div className="trip-container">
        <EventSub tripId={this.props.trip.id} receiveMessage={this.props.receiveMessage} />
        <CustomCss iface={this.props.iface} />
        <div className="page-layout page-layout-tabs">
          {this.renderHeaderPanels()}
          <div className="page-layout-tabs-content pure-g">
            <div className="page-layout-tabs-content-inner pure-u-1">
              {this.renderTabPanels()}
            </div>
          </div>
          {this.renderTabs()}
        </div>
      </div>
    );
  }
}

App.propTypes = {
  evaluator: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  experience: PropTypes.object,
  script: PropTypes.object,
  trip: PropTypes.object,
  player: PropTypes.object,
  iface: PropTypes.object,
  loadData: PropTypes.func.isRequired,
  fireEvent: PropTypes.func.isRequired,
  receiveMessage: PropTypes.func.isRequired
};

App.defaultProps = {
  experience: null,
  trip: null,
  script: null,
  iface: null,
  player: null
};
