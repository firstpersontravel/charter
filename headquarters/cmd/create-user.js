const bcrypt = require('bcrypt');
const program = require('commander');

const models = require('../src/models');

program
  .arguments('<org-name> <email> <password>')
  .parse(process.argv);

async function createUser(orgName, email, password) {
  const org = await models.Org.find({
    where: { name: orgName }
  });
  if (!org) {
    const orgs = await models.Org.findAll();
    throw new Error(`Org "${orgName}" not found. Available orgs are: ${orgs.map(o => `"${o.name}"`).join(', ')}.`);
  }

  const [user, ] = await models.User.findOrCreate({
    where: {
      email: email,
      orgId: org.id,
      experienceId: null
    },
    defaults: {
      isActive: true,
      isArchived: false
    }
  });

  const pwHash = await bcrypt.hash(password, 10);
  await user.update({ passwordHash: pwHash });

  await models.OrgRole.findOrCreate({
    where: { orgId: org.id, userId: user.id },
    defaults: { isAdmin: true }
  });
}

if (program.args.length < 3) {
  program.help();
}


createUser(...program.args)
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
