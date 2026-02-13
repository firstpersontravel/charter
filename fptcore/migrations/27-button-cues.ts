let cuesUsed;
let num = 0;

const getPanelActivationEvent = {
  button: panel => ({ type: 'button_pressed', button: panel.id }),
  numberpad: panel => ({ type: 'numberpad_submitted', numberpad: panel.id }),
  directions: panel => ({ type: 'directions_arrived', directions: panel.id }),
};

export default {
  migrations: [
    ['scriptContent', () => {
      cuesUsed = new Set();
    }],
    ['actions', (action) => {
      if (action.name === 'signal_cue') {
        cuesUsed.add(action.cue_name);
      }
    }],
    ['qr_codes', (qrCode) => {
      if (qrCode.cue) {
        cuesUsed.add(qrCode.cue);
      }
    }],
    ['panels', (panel, scriptContent, parentResource) => {
      // replace button cue with button_pressed trigger
      if (!getPanelActivationEvent[panel.type]) {
        return;
      }
      const cueName = panel.cue;
      // Delete old panel vals
      delete panel.cue;
      if (panel.type === 'numberpad') {
        delete panel.correct_ref;
        delete panel.unknown;        
      }
      // Update triggers
      const isCueUsedByAction = cuesUsed.has(cueName);
      if (isCueUsedByAction) {
        // If the cue is used by another action, we need to keep all triggers
        // for that cue in place. So instead of changing thse triggers, add a
        // new trigger for on panel activated that fires the cue.
        if (parentResource.scene) {
          scriptContent.triggers.push({
            name: `panel-${panel.id}`,
            scene: parentResource.scene,
            event: getPanelActivationEvent[panel.type](panel),
            actions: [{
              id: num++,
              name: 'signal_cue',
              cue_name: cueName
            }]
          });
        } else {
          console.log('Could not add trigger for panel w/o no scene');
        }
        return;
      }
      // Otherwise, cue is not used by an action. So we can delete the cue
      // and replace all 'on cue signaled' triggers of that cue with the
      // panel activation event.
      if (scriptContent.cues) {
        scriptContent.cues = scriptContent.cues
          .filter(c => c.name !== cueName);
      }
      if (scriptContent.triggers) {
        scriptContent.triggers
          .filter(t => (
            t.event && t.event.type === 'cue_signaled' &&
            t.event.cue === cueName
          ))
          .forEach(t => {
            t.event = getPanelActivationEvent[panel.type](panel);
          });
      }
    }],
  ],
  tests: [{
    before: {
      pages: [{
        panels: [{
          type: 'button',
          id: 123,
          cue: 'cue'
        }]
      }],
      triggers: [{
        event: { type: 'cue_signaled', cue: 'cue' },
        actions: [{}]
      }]
    },
    after: {
      pages: [{
        panels: [{
          type: 'button',
          id: 123
        }]
      }],
      triggers: [{
        event: { type: 'button_pressed', button: 123 },
        actions: [{}]
      }]
    }
  }]
};
