class RoleCore {
  static canRoleHaveUser(scriptContent, role) {
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

module.exports = RoleCore;
