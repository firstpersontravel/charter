module.exports = {
  specParams: {
    query: { required: true, type: 'string' },
    partial: { required: false, type: 'boolean' },
    final: { required: false, type: 'boolean' }
  },
  matchEvent: function(script, context, spec, event) {
    if (spec.partial === true && event.partial === false) {
      return false;
    }
    if (spec.final === true && event.partial === true) {
      return false;
    }
    return spec.query === event.query;
  }
};
