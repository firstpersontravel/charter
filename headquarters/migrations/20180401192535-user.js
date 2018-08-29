'use strict';
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.createTable('user', {
      id: {
        type: 'INTEGER',
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      first_name: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: '',
        validate: {
          notEmpty: true
        }
      },
      last_name: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      gender: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: '',
        validate: {
          isIn: [['', 'male', 'female']]
        }
      },
      phone_number: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      photo: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      roles: {
        type: 'TEXT',
        allowNull: false,
        defaultValue: '{}'
      },
      is_active: {
        type: 'TINYINT(1)',
        defaultValue: true,
        validate: {
          isIn: [
            [
              true,
              false
            ]
          ]
        }
      },
      device_id: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      device_push_token: {
        type: 'VARCHAR(255)',
        allowNull: false,
        defaultValue: ''
      },
      location_latitude: {
        type: 'DOUBLE PRECISION'
      },
      location_longitude: {
        type: 'DOUBLE PRECISION'
      },
      location_accuracy: {
        type: 'FLOAT'
      },
      location_timestamp: {
        type: 'DATETIME',
        validate: {
          isDate: true
        }
      },
      device_battery: {
        type: 'FLOAT'
      },
      device_last_active: {
        type: 'DATETIME',
        validate: {
          isDate: true
        }
      },
      device_timestamp: {
        type: 'DATETIME',
        validate: {
          isDate: true
        }
      },
      is_archived: {
        type: 'TINYINT(1)',
        defaultValue: false,
        validate: {
          isIn: [
            [
              true,
              false
            ]
          ]
        }
      }
    });
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  },
  down: async (queryInterface) => {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.dropTable('user');
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }
};
