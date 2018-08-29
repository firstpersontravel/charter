'use strict';
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeColumn('message', 'sent_at');
  },
  down: async (queryInterface) => {
    await queryInterface.addColumn('message', 'sent_at', { type: 'DATETIME' });
  }
};
