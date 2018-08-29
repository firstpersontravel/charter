
var ARRAY_SEARCH_REGEX = /(\w+)\[(\w+)~=(\w+)]/;

function cleanValue(value) {
  if (moment.isMoment(value)) { return value.toISOString(); }
  return value;
}

function updateValues(values, valueRef, newValue) {
    var key = valueRef.split('.')[0];
    var remainder = valueRef.split('.', 2)[1];
    if (ARRAY_SEARCH_REGEX.test(key)) {
      var match = ARRAY_SEARCH_REGEX.exec(key);
      var arrayKey = match[1];
      var searchKey = match[2];
      var searchValue = match[3];
      if (!values[arrayKey]) { return; }
      if (!Array.isArray(values[arrayKey])) { return; }
      var array = values[arrayKey];
      var matches = array.filter(function(i) {
        if (!i[searchKey]) { return false; }
        return (i[searchKey].indexOf(searchValue) > -1);
      });
      matches.forEach(function(match) {
        updateValues(match, remainder, newValue);
      });
      return;
    }
    if (remainder) {
      if (!values[key]) { values[key] = {}; }
      updateValues(values[key], remainder, newValue);
      return;
    }
    values[key] = cleanValue(newValue);
  }

export default {
  updateValues: updateValues
};
