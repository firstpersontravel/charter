import { connect } from 'react-redux';

import DesignIndex from '../components/DesignIndex';
import { updateInstance } from '../../actions';
import { lookupExperience } from './utils';
import {
  instanceIncluder,
  instancesFromDatastore
} from '../../datastore-utils';

const mapStateToProps = (state, ownProps) => ({
  isCreatingExperience: state.requests['experiences.create'] === 'pending',
  isCreatingScript: state.requests['scripts.create'] === 'pending',
  experience: lookupExperience(state, ownProps),
  scripts: instancesFromDatastore(state, {
    col: 'scripts',
    filter: {
      isArchived: false,
      org: { name: ownProps.match.params.orgName },
      experience: { name: ownProps.match.params.experienceName }
    },
    include: {
      org: instanceIncluder('orgs', 'id', 'orgId'),
      experience: instanceIncluder('experiences', 'id', 'experienceId')
    }
  })
});

const mapDispatchToProps = dispatch => ({
  updateInstance: (...args) => dispatch(updateInstance(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(DesignIndex);
