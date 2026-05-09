const { desc, eq, sql } = require("drizzle-orm");

const { generatedPlans, users } = require("../schema");
const { getDb } = require("../client");
const { createAdminAuditRepository } = require("./adminAuditRepository");

const VALID_ROLES = new Set(["user", "admin"]);
const auditRepository = createAdminAuditRepository();

function createDatabaseRequiredError() {
  const error = new Error("Database access is required for user administration.");
  error.statusCode = 503;
  return error;
}

function createNotFoundError() {
  const error = new Error("The requested user could not be found.");
  error.statusCode = 404;
  return error;
}

function createRoleValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function userSelection() {
  return {
    id: users.id,
    auth0Sub: users.auth0Sub,
    email: users.email,
    displayName: users.displayName,
    role: users.role,
    createdAt: users.createdAt,
  };
}

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
          ...userSelection(),
        });

      return row;
    },

    async listUsers() {
      const db = getDb();

      if (!db) {
        return [];
      }

      return db
        .select({
          ...userSelection(),
          projectCount: sql`count(${generatedPlans.id})`.mapWith(Number),
        })
        .from(users)
        .leftJoin(generatedPlans, eq(generatedPlans.userId, users.id))
        .groupBy(users.id)
        .orderBy(desc(users.createdAt));
    },

    async getUserById(userId) {
      const db = getDb();

      if (!db) {
        return null;
      }

      const [row] = await db
        .select({
          ...userSelection(),
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return row || null;
    },

    async getUserByEmail(email) {
      const db = getDb();

      if (!db || !email) {
        return null;
      }

      const [row] = await db
        .select({
          ...userSelection(),
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return row || null;
    },

    async countAdmins() {
      const db = getDb();

      if (!db) {
        return 0;
      }

      const [row] = await db
        .select({
          count: sql`count(*)`.mapWith(Number),
        })
        .from(users)
        .where(eq(users.role, "admin"));

      return row?.count || 0;
    },

    async updateUserRole(targetUserId, nextRole, actorUserId = null) {
      const db = getDb();

      if (!db) {
        throw createDatabaseRequiredError();
      }

      if (!VALID_ROLES.has(nextRole)) {
        throw createRoleValidationError("User role must be either 'user' or 'admin'.");
      }

      const currentUser = await this.getUserById(targetUserId);

      if (!currentUser) {
        throw createNotFoundError();
      }

      if (currentUser.role === nextRole) {
        return currentUser;
      }

      if (currentUser.role === "admin" && nextRole !== "admin") {
        const adminCount = await this.countAdmins();

        if (adminCount <= 1) {
          throw createRoleValidationError("At least one admin user must remain in the system.");
        }
      }

      const [row] = await db
        .update(users)
        .set({
          role: nextRole,
        })
        .where(eq(users.id, targetUserId))
        .returning({
          ...userSelection(),
        });

      await auditRepository.logAction({
        actorUserId,
        action: "user.role.updated",
        targetType: "user",
        targetId: String(targetUserId),
        details: {
          previousRole: currentUser.role,
          nextRole,
        },
      });

      return row;
    },
  };
}

module.exports = {
  createUserRepository,
};
