'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      update Trips set customizations = "{}" where customizations = "";
    `);
    await queryInterface.sequelize.query(`
      update Trips set waypoint_options = "{}" where waypoint_options = "";
    `);
  },
  down: async () => {
  }
};
