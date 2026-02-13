import type { ScriptContent, ScriptRole } from '../types';

class RoleCore {
  static canRoleHaveParticipant(scriptContent: ScriptContent, role: ScriptRole): boolean {
    // Role can have a user if it has an interface
    if (role.interface) {
      return true;
    }
    // Or role can have a user if it has a relay
    if ((scriptContent.relays || []).find(r => r.for === role.name)) {
      return true;
    }
    return false;
  }
}

export default RoleCore;

