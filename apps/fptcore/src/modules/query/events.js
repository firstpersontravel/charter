module.exports = {
  query_responded: {
    help: { summary: 'Occurs when a player responds to a query over the phone.' },
    specParams: {
      query: { required: true, type: 'string' },
      partial: { required: false, type: 'boolean', display: { hidden: true } },
      final: { required: false, type: 'boolean', display: { hidden: true } }
    },
    matchEvent: function(spec, event, actionContext) {
      if (spec.partial === true && event.partial === false) {
        return false;
      }
      if (spec.final === true && event.partial === true) {
        return false;
      }
      return spec.query === event.query;
    }
  }
};
