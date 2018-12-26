'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.renameTable('Playthroughs', 'Trips');
    await queryInterface.renameColumn('Actions', 'playthrough_id', 'trip_id');
    await queryInterface.renameColumn('Messages', 'playthrough_id', 'trip_id');
    await queryInterface.renameColumn('Participants', 'playthrough_id', 'trip_id');
  },

  down: async (queryInterface) => {
    await queryInterface.renameTable('Playthroughs', 'Trips');
    await queryInterface.renameColumn('Actions', 'trip_id', 'playthrough_id');
    await queryInterface.renameColumn('Messages', 'trip_id', 'playthrough_id');
    await queryInterface.renameColumn('Participants', 'trip_id', 'playthrough_id');
  }
};
