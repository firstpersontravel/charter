import _ from 'lodash';
import { connect } from 'react-redux';

import { updateRelays } from '../../actions';
import { instancesIncluder, instanceFromDatastore } from '../../datastore-utils';
import { lookupScripts } from './utils';
import MonthIndex from '../components/MonthIndex';

const mapStateToProps = (state, ownProps) => ({
  systemActionRequestState: state.requests['system.action'],
  org: _.find(state.datastore.orgs, { name: ownProps.match.params.orgName }),
  experience: instanceFromDatastore(state, {
    col: 'experiences',
    filter: { name: ownProps.match.params.experienceName },
    include: { relays: instancesIncluder('relays', 'experienceId', 'id') }
  }),
  scripts: lookupScripts(state, ownProps)
});

const mapDispatchToProps = dispatch => ({
  updateRelays: (...args) => dispatch(updateRelays(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(MonthIndex);
