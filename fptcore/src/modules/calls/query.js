var QUERY_TYPE_OPTIONS = ['normal'];

module.exports = {
  icon: 'question-circle',
  help: 'A voice prompt. When a player responds to that prompt over the phone, the `query_responded` event fires with the query name.',
  properties: {
    name: { type: 'name' },
    type: {
      type: 'enum',
      options: QUERY_TYPE_OPTIONS,
      default: 'normal',
      display: { hidden: true }
    },
    hints: {
      type: 'list',
      items: { type: 'string' },
      help: 'List of suggestions for voice recognition.'
    }
  }
};
