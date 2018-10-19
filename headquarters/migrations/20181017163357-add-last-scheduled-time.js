'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('Playthroughs', 'last_scheduled_time', {
      type: 'DATETIME',
      allowNull: true,
      after: 'gallery_name'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Playthroughs', 'last_scheduled_time');
  }
};
