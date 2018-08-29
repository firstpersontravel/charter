'use strict';
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('playthrough', 'current_scene_name', {
      type: 'VARCHAR(255)',
      allowNull: false,
      defaultValue: '',
      after: 'title'
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('playthrough', 'current_scene_name');
  }
};
