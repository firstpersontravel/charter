import { connect } from 'react-redux';

import ExperienceIndex from '../components/ExperienceIndex';
import { listCollection, updateRelays } from '../../actions';
import {
  instanceIncluder,
  instancesIncluder,
  instanceFromDatastore
} from '../../datastore-utils';

const mapStateToProps = (state, ownProps) => ({
  systemActionRequestState: state.requests['system.action'],
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
  listCollection: (...args) => dispatch(listCollection(...args)),
  updateRelays: (...args) => dispatch(updateRelays(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(ExperienceIndex);
