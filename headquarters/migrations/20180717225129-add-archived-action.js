'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('action', 'is_archived', {
      type: 'TINYINT(1)',
      defaultValue: 0
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('action', 'is_archived');
  }
};
