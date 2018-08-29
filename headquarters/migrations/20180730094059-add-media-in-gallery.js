'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('message', 'is_in_gallery', {
      type: 'TINYINT(1)',
      defaultValue: 0,
      after: 'reply_received_at'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('message', 'is_in_gallery');
  }
};
