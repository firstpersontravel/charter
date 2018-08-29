'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('playthrough', 'gallery_name', {
      type: 'VARCHAR(64)',
      allowNull: false,
      after: 'history',
      defaultValue: ''
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('playthrough', 'gallery_name');
  }
};
