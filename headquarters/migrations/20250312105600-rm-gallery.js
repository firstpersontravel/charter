'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeColumn('Messages', 'is_in_gallery');
  },
  down: async () => {
  }
};
