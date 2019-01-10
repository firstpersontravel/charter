import { connect } from 'react-redux';

import OrgExperience from '../components/OrgExperience';
import { listCollection, updateRelays, updateInstance, createInstance } from '../../actions';
import {
  instanceIncluder,
  instancesIncluder,
  instanceFromDatastore
} from '../../datastore-utils';
import { lookupExperiences } from './utils';

const mapStateToProps = (state, ownProps) => ({
  systemActionRequestState: state.requests['system.action'],
  experiences: lookupExperiences(state, ownProps),
  experience: instanceFromDatastore(state, {
    col: 'experiences',
    filter: { name: ownProps.params.experienceName },
    include: {
      org: instanceIncluder('orgs', 'id', 'orgId'),
      scripts: instancesIncluder('scripts', 'experienceId', 'id', {
        isArchived: false
      }),
      groups: instancesIncluder('groups', 'experienceId', 'id', {
        isArchived: false
      }),
      relays: instancesIncluder('relays', 'experienceId', 'id', {
        userPhoneNumber: ''
      })
    }
  })
});

const mapDispatchToProps = dispatch => ({
  createInstance: (...args) => dispatch(createInstance(...args)),
  listCollection: (...args) => dispatch(listCollection(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args)),
  updateRelays: (...args) => dispatch(updateRelays(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(OrgExperience);
