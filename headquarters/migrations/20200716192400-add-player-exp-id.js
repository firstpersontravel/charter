'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('Players', 'experience_id', {
      type: 'INTEGER',
      allowNull: true,
      after: 'org_id'
    });
    // Fill data
    await queryInterface.sequelize.query(`
      UPDATE Players
      INNER JOIN Trips
        ON Players.trip_id = Trips.id
      SET
        Players.experience_id = Trips.experience_id;
    `);
    await queryInterface.changeColumn('Players', 'experience_id', {
      type: 'INTEGER',
      allowNull: false,
      after: 'org_id'
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Players', 'experience_id');
  }
};
