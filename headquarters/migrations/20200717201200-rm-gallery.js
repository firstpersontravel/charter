'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeColumn('Trips', 'gallery_name');
    await queryInterface.removeColumn('Messages', 'name');
    await queryInterface.removeColumn('Messages', 'read_at');
  },
  down: async () => {}
};
