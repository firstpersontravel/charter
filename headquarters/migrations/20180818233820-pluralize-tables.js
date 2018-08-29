'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.renameTable('action', 'actions');
    await queryInterface.renameTable('group', 'groups');
    await queryInterface.renameTable('message', 'messages');
    await queryInterface.renameTable('participant', 'participants');
    await queryInterface.renameTable('playthrough', 'playthroughs');
    await queryInterface.renameTable('profile', 'profiles');
    await queryInterface.renameTable('relay', 'relays');
    await queryInterface.renameTable('script', 'scripts');
    await queryInterface.renameTable('user', 'users');
  },

  down: async (queryInterface) => {
    await queryInterface.renameTable('actions', 'action');
    await queryInterface.renameTable('groups', 'group');
    await queryInterface.renameTable('messages', 'message');
    await queryInterface.renameTable('participants', 'participant');
    await queryInterface.renameTable('playthroughs', 'playthrough');
    await queryInterface.renameTable('profiles', 'profile');
    await queryInterface.renameTable('relays', 'relay');
    await queryInterface.renameTable('scripts', 'script');
    await queryInterface.renameTable('users', 'user');
  }
};
