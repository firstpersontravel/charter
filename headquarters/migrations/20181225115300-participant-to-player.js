'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.renameTable('Participants', 'Players');
  },

  down: async (queryInterface) => {
    await queryInterface.renameTable('Players', 'Participants');
  }
};
