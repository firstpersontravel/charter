import type { ActionContext, Event } from '../../types';
export default {
  help: 'Occurs when a scene has been started.',
  specParams: {},
  matchEvent: function(spec: Record<string, any>, event: Event, actionContext: ActionContext) {
    // The scene_started event matches always, since it's filtered by
    // the `scene` parameter of the trigger.
    return true;
  }
};

