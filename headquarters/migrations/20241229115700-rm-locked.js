'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeColumn('Scripts', 'is_locked');
  },
  down: async () => {}
};
