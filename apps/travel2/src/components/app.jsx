import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendar,
  faUser,
  faLocationArrow
} from '@fortawesome/free-solid-svg-icons';

import CustomCss from '../partials/custom-css';
import Panel from '../partials/panel';
import EventSub from '../util/event-sub';
import LocationTracker from '../partials/location';
import Soundtrack from '../partials/soundtrack';

function hasLoggedIntoCreationTool() {
  return !!localStorage.getItem('auth_latest');
}

const DEFAULT_TABS = [{
  title: 'Main',
  panels: [{ type: 'current_page' }]
}];

export default class App extends Component {
  constructor(props) {
    super(props);
    this.onFireEvent = this.onFireEvent.bind(this);
    this.onPostAction = this.onPostAction.bind(this);
    this.onSelectTab = this.onSelectTab.bind(this);
    this.onSetDebugLocation = this.onSetDebugLocation.bind(this);
    this.onUpdateLocation = this.onUpdateLocation.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
    this.layoutRef = React.createRef();
    this.state = {
      selectedTabName: null,
      layoutHeight: 0
    };
  }

  componentDidMount() {
    this.props.loadData(this.props.match.params.tripId, this.props.match.params.playerId);
    window.addEventListener('resize', this.onWindowResize);
    this.onWindowResize();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.trip !== this.props.trip || prevProps.player !== this.props.player) {
      this.onWindowResize();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onWindowResize);
  }

  onWindowResize() {
    const layoutTop = this.layoutRef.current?.getBoundingClientRect().top || 0;
    const tabHeight = this.shouldShowTabs() ? 30 : 0;
    const layoutHeight = window.innerHeight - layoutTop - tabHeight;
    this.setState({ layoutHeight: layoutHeight });
  }

  onFireEvent(event) {
    this.props.fireEvent(this.props.trip.id, this.props.player.id, event);
  }

  onPostAction(actionName, actionParams) {
    this.props.postAction(this.props.trip.id, this.props.player.id, actionName, actionParams);
  }

  onUpdateLocation(lat, lng, accuracy, timestamp) {
    if (!this.props.player.participantId) {
      return;
    }
    this.props.updateLocation(this.props.trip.id, this.props.player.participantId,
      lat, lng, accuracy, timestamp);
  }

  onSelectTab(e, tabTitle) {
    e.preventDefault();
    this.setState({ selectedTabName: tabTitle });
  }

  onSetDebugLocation(e) {
    const waypointOptionName = e.target.value;
    if (!waypointOptionName) {
      return;
    }
    const waypoint = (this.props.script.content.waypoints || [])
      .find(w => !!w.options.find(o => o.name === waypointOptionName));
    if (!waypoint) {
      return;
    }
    const waypointOption = waypoint.options.find(o => o.name === waypointOptionName);
    const { coords } = waypointOption.location;
    if (!coords) {
      return;
    }
    const timestamp = Math.floor(moment.utc().valueOf() / 1000);
    this.onUpdateLocation(coords[0], coords[1], 30, timestamp);
  }

  getTabs() {
    const { iface } = this.props;
    return iface && iface.tabs && iface.tabs.length ? iface.tabs : DEFAULT_TABS;
  }

  getVisibleTabs() {
    if (!this.props.trip || !this.props.player) {
      return [];
    }
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

  getAudioState() {
    const audioStates = this.props.trip.tripState.audioStateByRole || {};
    return audioStates[this.props.player.roleName] || null;
  }

  getWaypointOptions() {
    return (this.props.script.content.waypoints || [])
      .map(w => w.options.map(o => Object.assign({ waypoint: w }, o)))
      .flat();
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
    return this.getVisibleTabs().length > 1;
  }

  renderPanel(panel, i) {
    return (
      <Panel
        key={i}
        panel={panel}
        evaluator={this.props.evaluator}
        fireEvent={this.onFireEvent}
        postAction={this.onPostAction}
        layoutHeight={this.state.layoutHeight} />
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
        <a href="#" className="pure-menu-link" onClick={e => this.onSelectTab(e, t.title)}>
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

  renderDebugLocationField() {
    const renderedWaypointOptions = this.getWaypointOptions().map(o => (
      <option key={`${o.waypoint.name}-${o.name}`} value={o.name}>{o.waypoint.title}</option>
    ));
    return (
      <form className="pure-form pure-g">
        <select
          disabled={!this.props.player.participantId}
          className="pure-input-1"
          onChange={this.onSetDebugLocation}>
          <option value="">Go to:</option>
          {renderedWaypointOptions}
        </select>
      </form>
    );
  }

  renderDebug() {
    if (!hasLoggedIntoCreationTool()) {
      return null;
    }

    // Generate URLs similar to the Ember implementation
    const { trip, player = {} } = this.props;

    const tripUrl = trip && trip.org && trip.experience
      ? `/${trip.org.name}/${trip.experience.name}/operate/trip/${trip.id}`
      : '#';

    const playerUrl = trip && trip.org && trip.experience && player && player.roleName
      ? `/${trip.org.name}/${trip.experience.name}/operate/role/${player.roleName}/${player.participantId || 0}`
      : '#';

    const playerRole = this.props.script.content.roles.find(r => r.name === player.roleName);

    // Format last location fix timestamp if available
    const lastFixTimestamp = this.props.participant && this.props.participant.locationTimestamp;
    const lastFixTimestampLocal = lastFixTimestamp
      ? moment.utc(lastFixTimestamp).local().format('h:mm:ssa')
      : 'none';

    return (
      <div className="application-debug-console pure-g">
        <div className="pure-u-4-5" style={{ paddingTop: '0.5em', paddingBottom: '0.5em' }}>
          <span className="text-padded">
            <FontAwesomeIcon icon={faCalendar} />
            &nbsp;
            <a href={tripUrl} target="_blank" rel="noopener noreferrer">
              {trip && trip.title}
            </a>
            &nbsp;
            <FontAwesomeIcon icon={faUser} />
            &nbsp;
            <a href={playerUrl} target="_blank" rel="noopener noreferrer">
              {playerRole && playerRole.title}
            </a>
            &nbsp;
            <FontAwesomeIcon icon={faLocationArrow} />
            &nbsp;
            {lastFixTimestampLocal}
          </span>
          &nbsp;
          (Logged into Charter; not tracking location)
        </div>
        <div className="pure-u-1-5">
          {this.renderDebugLocationField()}
        </div>
      </div>
    );
  }

  renderLocationTracking() {
    if (hasLoggedIntoCreationTool()) {
      return null;
    }
    return (
      <LocationTracker updateLocation={this.onUpdateLocation} />
    );
  }

  render() {
    if (!this.props.trip || !this.props.player) {
      return <div>Loading</div>;
    }
    return (
      <>
        {this.renderDebug()}
        {this.renderLocationTracking()}
        <div className="trip-container">
          <EventSub tripId={this.props.trip.id} receiveMessage={this.props.receiveMessage} />
          <CustomCss iface={this.props.iface} />
          <Soundtrack audioState={this.getAudioState()} />
          <div className="page-layout page-layout-tabs">
            {this.renderHeaderPanels()}
            <div className="page-layout-tabs-content pure-g" ref={this.layoutRef}>
              <div className="page-layout-tabs-content-inner pure-u-1">
                {this.renderTabPanels()}
              </div>
            </div>
            {this.renderTabs()}
          </div>
        </div>
      </>
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
  participant: PropTypes.object,
  iface: PropTypes.object,
  loadData: PropTypes.func.isRequired,
  fireEvent: PropTypes.func.isRequired,
  postAction: PropTypes.func.isRequired,
  receiveMessage: PropTypes.func.isRequired,
  updateLocation: PropTypes.func.isRequired
};

App.defaultProps = {
  experience: null,
  trip: null,
  script: null,
  iface: null,
  player: null,
  participant: null
};
