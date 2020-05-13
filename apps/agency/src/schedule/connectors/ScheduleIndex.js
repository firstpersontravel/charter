import { connect } from 'react-redux';

import ScheduleIndex from '../components/ScheduleIndex';
import { lookupGroupsByDate } from './utils';

const curYear = new Date().getFullYear().toString();
const curMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

const mapStateToProps = (state, ownProps) => ({
  groups: lookupGroupsByDate(state, ownProps, curYear, curMonth)
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(ScheduleIndex);
