require("../src/loadEnv");

const { createUserRepository } = require("../db/repositories/userRepository");

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: npm run admin:promote -- user@example.com");
    process.exit(1);
  }

  const repository = createUserRepository();
  const user = await repository.getUserByEmail(email);

  if (!user) {
    console.error(`No synced user was found for ${email}. Ask that user to sign in once before promotion.`);
    process.exit(1);
  }

  const updatedUser = await repository.updateUserRole(user.id, "admin");

  console.log(`Promoted ${updatedUser.email || updatedUser.auth0Sub} to admin.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
