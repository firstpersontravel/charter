'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('Actions', 'triggering_player_id', {
      type: 'INTEGER',
      allowNull: true,
      after: 'trip_id'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Actions', 'triggering_player_id');
  }
};
