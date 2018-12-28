const assert = require('assert');

const ScriptValidationCore = require('../../src/cores/script_validation');

describe('ScriptValidationCore', () => {
  describe('#gatherScriptWarnings', () => {
    it('gathers warning for missing params', () => {
      const script = {
        content: {
          scenes: [{ name: 'SCENE-1', title: 'scene' }],
          triggers: [{
            name: 'TRIGGER-MESSAGE-GABE-TOM',
            scene: 'SCENE-1',
            event: [],
            actions: ['send_message']
          }]
        }
      };
      const warnings = ScriptValidationCore.gatherScriptWarnings(script);
      assert.deepStrictEqual(warnings, [
        'trigger[name=TRIGGER-MESSAGE-GABE-TOM]: ' +
        'Required param "message_name" not present.'
      ]);
    });

    // this functionality isn't present for now
    it.skip('gathers warning for required context', () => {
      const script = {
        content: {
          scenes: [{ name: 'SCENE-1', title: 'scene' }],
          roles: [{
            name: 'Gabe'
          }, {
            name: 'Tom'
          }],
          triggers: [{
            // Has required context
            name: 'TRIGGER-CALL-FROM-GABE',
            scene: 'SCENE-1',
            event: [{ 'call_received': { from: 'Gabe', to: 'Tom' } }],
            actions: ['add_to_call Tom']
          }, {
            // Does not
            name: 'TRIGGER-CALL-FROM-TOM',
            scene: 'SCENE-1',
            event: [],
            actions: ['add_to_call Gabe']
          }]
        }
      };
      const warnings = ScriptValidationCore.gatherScriptWarnings(script);
      assert.deepStrictEqual(warnings, [
        'trigger[name=TRIGGER-CALL-FROM-TOM].actions[0] (add_to_call): ' +
        'Required context "call_received" or "call_answered" not present.'
      ]);
    });
  });
});
