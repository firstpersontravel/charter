import Ember from 'ember';
import TextUtils from '../utils/text';

export default Ember.Helper.helper(function(params) {
  return TextUtils.formatPhone(params[0]);
});
