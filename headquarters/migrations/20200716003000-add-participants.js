'use strict';

module.exports = {
  up: async (queryInterface) => {
    // Clear if exists
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS Participants');
    // Add table
    await queryInterface.createTable('Participants', {
      id: {
        type: 'INTEGER',
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      org_id: { type: 'INTEGER', allowNull: false },
      experience_id: { type: 'INTEGER', allowNull: false },
      name: { type: 'VARCHAR(255)', allowNull: false, defaultValue: '' },
      email: { type: 'VARCHAR(255)', allowNull: false, defaultValue: '' },
      phone_number: { type: 'VARCHAR(10)', allowNull: false },
      is_active: { type: 'TINYINT(1)', allowNull: false, defaultValue: 1 },
      device_id: { type: 'VARCHAR(255)', allowNull: false, defaultValue: '' },
      device_push_token: { type: 'VARCHAR(255)', allowNull: false, defaultValue: '' },
      location_latitude: { type: 'DOUBLE', allowNull: true },
      location_longitude: { type: 'DOUBLE', allowNull: true },
      location_accuracy: { type: 'FLOAT', allowNull: true },
      location_timestamp: { type: 'DATETIME', allowNull: true },
      device_battery: { type: 'FLOAT', allowNull: true },
      device_last_active: { type: 'DATETIME', allowNull: true },
      device_timestamp: { type: 'DATETIME', allowNull: true },
      is_archived: { type: 'TINYINT(1)', allowNull: false, defaultValue: 0 }
    }, {
      charset: 'utf8mb4',
      collage: 'utf8mb4_unicode_ci'
    });
    // Copy users
    await queryInterface.sequelize.query(`
      INSERT INTO Participants (
        id, org_id, experience_id, name, email, phone_number, is_active,
        is_archived
      )
      SELECT
        id, org_id, experience_id, LTRIM(CONCAT(first_name, " ", last_name)),
        email, phone_number, is_active, is_archived
      FROM Users
      WHERE experience_id IS NOT NULL;
    `);

    // Remove foreign key 
    await queryInterface.removeConstraint('Players', 'Players_ibfk_2');
    await queryInterface.removeIndex('Players', 'participant_user_id');

    // Delete from users table
    await queryInterface.sequelize.query(`
      DELETE FROM Users
      WHERE experience_id IS NOT NULL;
    `);

    // Re-add foreign key
    await queryInterface.renameColumn('Players', 'user_id', 'participant_id');
    await queryInterface.addIndex('Players', {
      fields: ['participant_id']
    });
    await queryInterface.addConstraint('Players', ['participant_id'], {
      type: 'foreign key',
      references: { table: 'Participants', field: 'id' }
    });

    await queryInterface.renameColumn('Profiles', 'user_id', 'participant_id');

    // Delete fields from users table
    const deleteColumns = [
      'phone_number',
      'is_active',
      'device_id',
      'device_push_token',
      'location_latitude',
      'location_longitude',
      'location_accuracy',
      'location_timestamp',
      'device_battery',
      'device_last_active',
      'device_timestamp',
      'org_id',
      'experience_id'
    ];
    for (const deleteColumn of deleteColumns) {
      await queryInterface.removeColumn('Users', deleteColumn);
    }

    // Rename relay
    await queryInterface.renameColumn('Relays', 'user_phone_number', 'participant_phone_number');
  },
  down: async () => {
    // No down
  }
};
