'use strict';

module.exports = {
  up: async (queryInterface) => {
    // Gather users
    const usersSql = 'select id, profiles from user';
    const usersResult = (await queryInterface.sequelize.query(usersSql))[0];

    // Create list of profiles
    const profilesToCreate = [];
    for (const line of usersResult) {
      const profiles = JSON.parse(line.profiles);
      for (const profileName of Object.keys(profiles)) {
        const profile = profiles[profileName];
        const [scriptName, roleName] = profileName.split('.');
        profilesToCreate.push({
          user_id: line.id,
          script_name: scriptName,
          role_name: roleName,
          departure_name: profile.departure || '',
          is_active: true,
          photo: profile.photo || '',
          phone_number: '',
          skype_username: '',
          facetime_username: profile.facetime || '',
          values: JSON.stringify(profile.values || {}),
          is_archived: false
        });
      }
    }

    // Insert profiles
    await queryInterface.bulkInsert('profile', profilesToCreate);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('profile', null, {});
  }
};
