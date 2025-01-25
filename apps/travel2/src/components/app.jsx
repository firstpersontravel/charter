import React, { Component } from 'react';
import PropTypes from 'prop-types';

import fptCore from 'fptcore';

import CustomCss from '../partials/custom-css';

const DEFAULT_TABS = [{
  title: 'Main',
  panels: [{ type: 'current_page' }]
}];

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTab: null
    };
  }

  componentDidMount() {
    this.props.refreshData(this.props.match.params.playerId);
  }

  getTabs() {
    const iface = this.props.iface;
    return iface && iface.tabs && iface.tabs.length ? iface.tabs : DEFAULT_TABS;
  }

  getVisibleTabs() {
    return this.getTabs().filter(t => this.props.evaluator.evaluateIf(t.visible_if));
  }

  getCurrentPageName() {
    return this.state.trip.tripState.currentPageNamesByRole[this.props.player.roleName];
  }

  getCurrentPage() {
    const pageName = this.getCurrentPageName();
    const page = (this.state.script.content.pages || []).find(p => p.name === pageName);
    return page;
  }

  getPagePanels() {
    return this.getCurrentPage().panels;
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
    basePanels.forEach(function (panel) {
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
      <div key={i}>
        {panel.type}
      </div>
    );
  }

  renderHeaderPanels() {
    const headerPanels = this.getHeaderPanels();
    return headerPanels.map((h, i) => this.renderHeaderPanels(h, i));
  }

  render() {
    if (!this.props.trip) {
      return <div>Loading</div>;
    }
    const tripId = this.props.match.params.tripId;
    const playerId = this.props.match.params.playerId;
    console.log(`trip ${tripId} player ${playerId}`);
    return (
      <div className="trip-container">
        <CustomCss iface={this.props.iface} />
        {this.renderHeaderPanels()}
        App test test
      </div>
    );
  }
}

App.propTypes = {
  evaluator: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  experience: PropTypes.object,
  trip: PropTypes.object,
  player: PropTypes.object,
  iface: PropTypes.object,
  refreshData: PropTypes.func.isRequired
};

App.defaultProps = {
  experience: null,
  trip: null,
  iface: null,
  player: null
};
