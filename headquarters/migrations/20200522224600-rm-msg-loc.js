'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeColumn('Messages', 'sent_from_latitude');
    await queryInterface.removeColumn('Messages', 'sent_from_longitude');
    await queryInterface.removeColumn('Messages', 'sent_from_accuracy');
  },
  down: async () => {}
};
