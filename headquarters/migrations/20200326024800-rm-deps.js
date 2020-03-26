'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeColumn('Profiles', 'departure_name');
    await queryInterface.removeColumn('Trips', 'departure_name');
    await queryInterface.removeColumn('Relays', 'departure_name');
    await queryInterface.addColumn('Relays', 'trip_id', {
      type: 'INTEGER',
      allowNull: true,
      after: 'experience_id'
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Relays', 'trip_id');
    await queryInterface.addColumn('Profiles', 'departure_name', {
      type: 'VARCHAR(32)',
      allowNull: false
    });
    await queryInterface.addColumn('Trips', 'departure_name', {
      type: 'VARCHAR(32)',
      allowNull: false
    });
    await queryInterface.addColumn('Relays', 'departure_name', {
      type: 'VARCHAR(32)',
      allowNull: false
    });
  }
};
