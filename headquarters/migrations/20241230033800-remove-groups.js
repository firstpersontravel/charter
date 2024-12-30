'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeConstraint('Trips', 'Trips_ibfk_2');
    await queryInterface.removeIndex('Trips', 'playthrough_group_id');
    await queryInterface.dropTable('Groups');
    await queryInterface.removeColumn('Trips', 'group_id');
  },
  down: async () => {
  }
};
