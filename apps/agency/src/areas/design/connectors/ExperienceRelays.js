import _ from 'lodash';
import { connect } from 'react-redux';

import ExperienceRelays from '../components/ExperienceRelays';
import { listCollection, updateInstance, updateRelays } from '../../../actions';
import { getStage } from '../../../utils';

const mapStateToProps = (state, ownProps) => {
  const experience = _.find(state.datastore.experiences, {
    name: ownProps.params.experienceName
  });
  return {
    areAnyRequestsPending: _.includes(_.values(state.requests), 'pending'),
    experienceName: ownProps.params.experienceName,
    experience: experience,
    script: _.find(state.datastore.scripts, {
      experienceId: experience && experience.id
    }),
    relays: _.filter(state.datastore.relays, {
      scriptName: ownProps.params.experienceName,
      stage: getStage()
    })
  };
};

const mapDispatchToProps = dispatch => ({
  listCollection: (...args) => dispatch(listCollection(...args)),
  updateInstance: (...args) => dispatch(updateInstance(...args)),
  updateRelays: (...args) => dispatch(updateRelays(...args))
});

export default connect(mapStateToProps, mapDispatchToProps)(ExperienceRelays);
