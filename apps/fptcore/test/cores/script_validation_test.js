const assert = require('assert');

const ScriptValidationCore = require('../../src/cores/script_validation');

describe('ScriptValidationCore', () => {
  describe('#gatherScriptWarnings', () => {
    it('gathers warning for missing params', () => {
      const script = {
        content: {
          triggers: [{
            name: 'TRIGGER-MESSAGE-GABE-TOM',
            actions: 'send_message'
          }]
        }
      };
      const warnings = ScriptValidationCore.gatherScriptWarnings(script);
      assert.deepStrictEqual(warnings, [
        'triggers[name=TRIGGER-MESSAGE-GABE-TOM].actions (send_message): ' +
        'Required param "message_name" not present.'
      ]);
    });

    it('gathers warning for required context', () => {
      const script = {
        content: {
          roles: [{
            name: 'Gabe'
          }, {
            name: 'Tom'
          }],
          triggers: [{
            // Has required context
            name: 'TRIGGER-CALL-FROM-GABE',
            event: { 'call_received': { from: 'Gabe', to: 'Tom' } },
            actions: 'add_to_call Tom'
          }, {
            // Does not
            name: 'TRIGGER-CALL-FROM-TOM',
            actions: 'add_to_call Gabe'
          }]
        }
      };
      const warnings = ScriptValidationCore.gatherScriptWarnings(script);
      assert.deepStrictEqual(warnings, [
        'triggers[name=TRIGGER-CALL-FROM-TOM].actions (add_to_call): ' +
        'Required context "call_received" or "call_answered" not present.'
      ]);
    });
  });
});
