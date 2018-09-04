'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.renameTable('action', 'Actions');
    await queryInterface.renameTable('group', 'Groups');
    await queryInterface.renameTable('message', 'Messages');
    await queryInterface.renameTable('participant', 'Participants');
    await queryInterface.renameTable('playthrough', 'Playthroughs');
    await queryInterface.renameTable('profile', 'Profiles');
    await queryInterface.renameTable('relay', 'Relays');
    await queryInterface.renameTable('script', 'Scripts');
    await queryInterface.renameTable('user', 'Users');
  },

  down: async (queryInterface) => {
    await queryInterface.renameTable('Actions', 'action');
    await queryInterface.renameTable('Groups', 'group');
    await queryInterface.renameTable('Messages', 'message');
    await queryInterface.renameTable('Participants', 'participant');
    await queryInterface.renameTable('Playthroughs', 'playthrough');
    await queryInterface.renameTable('Profiles', 'profile');
    await queryInterface.renameTable('Relays', 'relay');
    await queryInterface.renameTable('Scripts', 'script');
    await queryInterface.renameTable('Users', 'user');
  }
};
