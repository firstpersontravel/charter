import _ from 'lodash';
import { connect } from 'react-redux';

import { instanceIncluder, instancesIncluder, instanceFromDatastore } from '../../datastore-utils';
import {
  createInstance,
  updateInstance,
  updateRelays,
  listCollection,
  trackEvent
} from '../../actions';
import { lookupGroups, lookupScripts } from './utils';
import Schedule from '../components/Schedule';

const mapStateToProps = (state, ownProps) => ({
  systemActionRequestState: state.requests['system.action'],
  org: _.find(state.datastore.orgs, { name: ownProps.match.params.orgName }),
  experience: instanceFromDatastore(state, {
    col: 'experiences',
    filter: { name: ownProps.match.params.experienceName },
    include: {
      relayEntryways: instancesIncluder('relayEntryways', 'experienceId', 'id', {}, {
        relayService: instanceIncluder('relayServices', 'id', 'relayServiceId')
      })
    }
  }),
  scripts: lookupScripts(state, ownProps),
  groups: lookupGroups(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  createInstance: (...args) => dispatch(createInstance(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args)),
  listCollection: (...args) => dispatch(listCollection(...args)),
  updateRelays: (...args) => dispatch(updateRelays(...args)),
  trackEvent: (...args) => dispatch(trackEvent(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(Schedule);
