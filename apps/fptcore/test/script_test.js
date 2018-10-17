const assert = require('assert');
const sinon = require('sinon');

const ScriptCore = require('../src/script');

const sandbox = sinon.sandbox.create();

describe('ScriptCore', () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe('#geofencesInArea', () => {

    const scriptContent = {
      geofences: [
        { name: 'cottage', center: 'cottage', distance: 25 },
        { name: 'atlas', center: 'atlas', distance: 25 },
        { name: 'dinner', center: 'dinner', distance: 25 }
      ],
      waypoints: [
        { name: 'cottage', coords: [37.758273, -122.411681] },
        { name: 'atlas', coords: [37.759010, -122.411497] },
        {
          name: 'dinner',
          options: [
            { name: 'eiji', coords: [37.764151, -122.430658] },
            { name: 'schmidts', coords: [37.758769, -122.414902] }
          ]
        }
      ]
    };

    it('returns geofences in area', () => {
      const atCottageResult = ScriptCore.geofencesInArea(scriptContent,
        37.7582, -122.4116, 5, null);
      assert.strictEqual(atCottageResult.length, 1);
      assert.strictEqual(atCottageResult[0].name, 'cottage');

      const atAtlasResult = ScriptCore.geofencesInArea(scriptContent,
        37.759010, -122.411497, 5, null);
      assert.strictEqual(atAtlasResult.length, 1);
      assert.strictEqual(atAtlasResult[0].name, 'atlas');
    });

    it('is generous for low accuracy', () => {
      const atCottageResult = ScriptCore.geofencesInArea(scriptContent,
        37.759010, -122.411497, 100, null);
      assert.strictEqual(atCottageResult.length, 2);
    });

    it('returns option based on waypoint options', () => {
      const atActiveResult = ScriptCore.geofencesInArea(scriptContent,
        37.758769, -122.414902, 5, { dinner: 'schmidts' });
      assert.strictEqual(atActiveResult.length, 1);
      assert.strictEqual(atActiveResult[0].name, 'dinner');

      const atInactiveResult = ScriptCore.geofencesInArea(scriptContent,
        37.758769, -122.414902, 5, { dinner: 'eiji' });
      assert.strictEqual(atInactiveResult.length, 0);
    });
  });

  describe('#gatherScriptWarnings', () => {

    it('gathers warning for missing params', () => {
      const script = {
        content: {
          triggers: [{
            name: 'TRIGGER-MESSAGE-GABE-TOM',
            actions: 'auto_message'
          }]
        }
      };
      const warnings = ScriptCore.gatherScriptWarnings(script);
      assert.deepStrictEqual(warnings, [
        'triggers[name=TRIGGER-MESSAGE-GABE-TOM].actions (auto_message): ' +
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
      const warnings = ScriptCore.gatherScriptWarnings(script);
      assert.deepStrictEqual(warnings, [
        'triggers[name=TRIGGER-CALL-FROM-TOM].actions (add_to_call): ' +
        'Required context "call_received" or "call_answered" not present.'
      ]);
    });

  });

});
