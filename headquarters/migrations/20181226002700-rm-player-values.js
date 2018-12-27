'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeColumn('Players', 'values');
    await queryInterface.addColumn('Trips', 'customizations', {
      type: 'TEXT',
      after: 'current_scene_name',
      allowNull: false,
      defaultValue: '{}'
    });
    await queryInterface.addColumn('Trips', 'waypoint_options', {
      type: 'TEXT',
      after: 'values',
      allowNull: false,
      defaultValue: '{}'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.addColumn('Players', 'values', {
      type: 'TEXT',
      allowNull: false,
      defaultValue: '{}'
    });
    await queryInterface.removeColumn('Trips', 'customizations');
    await queryInterface.removeColumn('Trips', 'waypoint_options');
  }
};
