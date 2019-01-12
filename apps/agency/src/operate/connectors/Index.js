import { connect } from 'react-redux';

import Index from '../components/Index';
import {
  instanceIncluder,
  instancesFromDatastore
} from '../../datastore-utils';

const mapStateToProps = (state, ownProps) => ({
  groups: instancesFromDatastore(state, {
    col: 'groups',
    sort: 'id',
    filter: {
      isArchived: false,
      org: { name: ownProps.params.orgName },
      experience: { name: ownProps.params.experienceName }
    },
    include: {
      org: instanceIncluder('orgs', 'id', 'orgId'),
      experience: instanceIncluder('experiences', 'id', 'experienceId')
    }
  })
});

export default connect(mapStateToProps)(Index);
