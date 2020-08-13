'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      DELETE FROM Assets
      WHERE type = "media"
    `, { type: queryInterface.sequelize.QueryTypes.UPDATE });
  },
  down: async () => {}
};
