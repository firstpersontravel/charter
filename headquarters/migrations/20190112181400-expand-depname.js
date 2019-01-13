'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.changeColumn('Relays', 'departure_name', {
      type: 'VARCHAR(32)',
      allowNull: false,
      after: 'stage'
    });
    await queryInterface.changeColumn('Trips', 'departure_name', {
      type: 'VARCHAR(32)',
      allowNull: false,
      after: 'date'
    });
    await queryInterface.changeColumn('Profiles', 'departure_name', {
      type: 'VARCHAR(32)',
      allowNull: false,
      after: 'role_name'
    });
  },
  down: async () => {}
};
