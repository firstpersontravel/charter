import _ from 'lodash';
import { connect } from 'react-redux';

import { instancesIncluder, instanceFromDatastore } from '../../datastore-utils';
import MonthIndex from '../components/MonthIndex';

const mapStateToProps = (state, ownProps) => ({
  org: _.find(state.datastore.orgs, { name: ownProps.match.params.orgName }),
  experience: instanceFromDatastore(state, {
    col: 'experiences',
    filter: { name: ownProps.match.params.experienceName },
    include: { relays: instancesIncluder('relays', 'experienceId', 'id') }
  })
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(MonthIndex);
