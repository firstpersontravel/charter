'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('RelayServices', {
      id: {
        type: 'INTEGER',
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      stage: { type: 'VARCHAR(32)', allowNull: false, defaultValue: '' },
      title: { type: 'VARCHAR(64)', allowNull: false, defaultValue: '' },
      phone_number: { type: 'VARCHAR(15)', allowNull: false, defaultValue: '' },
      sid: { type: 'VARCHAR(34)', allowNull: false, defaultValue: '' },
      is_shared: { type: 'TINYINT(1)', allowNull: false, defaultValue: 0 },
      is_active: { type: 'TINYINT(1)', allowNull: false, defaultValue: 1 },
    }, {
      charset: 'utf8mb4',
      collage: 'utf8mb4_unicode_ci'
    });
    await queryInterface.createTable('RelayEntryways', {
      id: {
        type: 'INTEGER',
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      org_id: { type: 'INTEGER', allowNull: false },
      experience_id: { type: 'INTEGER', allowNull: false },
      relay_service_id: { type: 'INTEGER', allowNull: false },
      welcome: { type: 'VARCHAR(255)', allowNull: false, defaultValue: '' },
      keyword: { type: 'VARCHAR(32)', allowNull: false, defaultValue: '' },
    }, {
      charset: 'utf8mb4',
      collage: 'utf8mb4_unicode_ci'
    });
  },

  down: async () => {
    // No down
  }
};
