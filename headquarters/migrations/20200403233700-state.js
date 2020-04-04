'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('Trips', 'trip_state', {
      type: 'LONGTEXT',
      allowNull: false,
      after: 'date'
    });
    await queryInterface.sequelize.query(`
      update Trips set trip_state = concat('{"currentSceneName": "', current_scene_name, '"}');
    `);
    await queryInterface.removeColumn('Trips', 'current_scene_name');
  },
  down: async (queryInterface) => {
    await queryInterface.addColumn('Trips', 'current_scene_name', {
      type: 'VARCHAR(32)',
      allowNull: false
    });
    await queryInterface.removeColumn('Trips', 'trip_state');
  }
};
