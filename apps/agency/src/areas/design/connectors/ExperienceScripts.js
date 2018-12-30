import _ from 'lodash';
import { connect } from 'react-redux';

import ExperienceScripts from '../components/ExperienceScripts';

const mapStateToProps = (state, ownProps) => {
  const experience = _.find(state.datastore.experiences, {
    name: ownProps.params.experienceName
  });
  return {
    experienceName: ownProps.params.experienceName,
    experience: experience,
    scripts: _.filter(state.datastore.scripts, {
      experienceId: experience && experience.id
    })
  };
};

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(ExperienceScripts);
