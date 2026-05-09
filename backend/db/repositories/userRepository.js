const { users } = require("../schema");
const { getDb } = require("../client");

function createUserRepository() {
  return {
    async upsertFromClaims(claims) {
      const db = getDb();

      if (!db) {
        return null;
      }

      const email = typeof claims.email === "string" ? claims.email : null;
      const displayName =
        typeof claims.name === "string"
          ? claims.name
          : typeof claims.nickname === "string"
            ? claims.nickname
            : email;

      const [row] = await db
        .insert(users)
        .values({
          auth0Sub: claims.sub,
          email,
          displayName,
        })
        .onConflictDoUpdate({
          target: users.auth0Sub,
          set: {
            email,
            displayName,
          },
        })
        .returning({
          id: users.id,
          auth0Sub: users.auth0Sub,
          email: users.email,
          displayName: users.displayName,
          role: users.role,
          createdAt: users.createdAt,
        });

      return row;
    },
  };
}

module.exports = {
  createUserRepository,
};
