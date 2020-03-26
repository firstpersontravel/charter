import { connect } from 'react-redux';

import DesignIndex from '../components/DesignIndex';
import {
  instanceIncluder,
  instancesFromDatastore
} from '../../datastore-utils';

const mapStateToProps = (state, ownProps) => ({
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

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(DesignIndex);
