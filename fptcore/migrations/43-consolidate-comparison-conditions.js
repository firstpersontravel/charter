module.exports = {
  migrations: {
    item: function(item) {
      if (item.op === 'value_equals') {
        item.op = 'value_compare';
        item.comparison_method = 'equals';
      }
      if (item.op === 'value_contains') {
        item.op = 'value_compare';
        item.comparison_method = 'contains';
        item.ref1 = item.string_ref;
        item.ref2 = item.part_ref;
        delete item.string_ref;
        delete item.part_ref;
      }
    },
    items: function(items) {
      for (const item of items) {
        if (item.op === 'value_equals') {
          item.op = 'value_compare';
          item.comparison_method = 'equals';
        }
        if (item.op === 'value_contains') {
          item.op = 'value_compare';
          item.comparison_method = 'contains';
          item.ref1 = item.string_ref;
          item.ref2 = item.part_ref;
          delete item.string_ref;
          delete item.part_ref;
        }
      }
    }
  },
  tests: [{
    before: {
      'item': {
        'op': 'value_equals',
        'ref1': 'decision_01_choice',
        'ref2': '"monkey"'
      }
    },
    after: {
      'item': {
        'op': 'value_compare',
        'comparison_method': 'equals',
        'ref1': 'decision_01_choice',
        'ref2': '"monkey"'
      }
    }
  },
  {
    before: {
      'item': {
        'op': 'value_contains',
        'part_ref': '"salamander"',
        'string_ref': 'decision_01_choice'
      }
    },
    after: {
      'item': {
        'op': 'value_compare',
        'comparison_method': 'contains',
        'ref2': '"salamander"',
        'ref1': 'decision_01_choice'
      }
    }
  },
  {
    before: {
      'items': [
        {
          'op': 'value_equals',
          'ref1': 'decision_01_choice',
          'ref2': '"monkeys"'
        },
        {
          'op': 'value_contains',
          'part_ref': '"salamanders"',
          'string_ref': 'decision_01_choice'
        }
      ]
    },
    after: {
      'items': [
        {
          'op': 'value_compare',
          'comparison_method': 'equals',
          'ref1': 'decision_01_choice',
          'ref2': '"monkeys"'
        },
        {
          'op': 'value_compare',
          'comparison_method': 'contains',
          'ref2': '"salamanders"',
          'ref1': 'decision_01_choice'
        }
      ]
    }
  }]
};
