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

function normalizeOptionalText(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue ? normalizedValue : null;
}

function createUserRepository() {
  return {
    async upsertFromClaims(claims) {
      const db = getDb();

      if (!db) {
        return null;
      }

      const email = normalizeOptionalText(claims.email);
      const displayName =
        normalizeOptionalText(claims.name) ||
        normalizeOptionalText(claims.nickname) ||
        email;

      const existingUser = await this.getUserByAuth0Sub(claims.sub);

      if (!existingUser) {
        const [row] = await db
          .insert(users)
          .values({
            auth0Sub: claims.sub,
            email,
            displayName,
          })
          .returning({
            ...userSelection(),
          });

        return row;
      }

      const nextEmail = email || existingUser.email || null;
      const nextDisplayName = displayName || existingUser.displayName || nextEmail;

      if (nextEmail === existingUser.email && nextDisplayName === existingUser.displayName) {
        return existingUser;
      }

      const [row] = await db
        .update(users)
        .set({
          email: nextEmail,
          displayName: nextDisplayName,
        })
        .where(eq(users.auth0Sub, claims.sub))
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

    async getUserByAuth0Sub(auth0Sub) {
      const db = getDb();

      if (!db || !auth0Sub) {
        return null;
      }

      const [row] = await db
        .select({
          ...userSelection(),
        })
        .from(users)
        .where(eq(users.auth0Sub, auth0Sub))
        .limit(1);

      return row || null;
    },

    async syncProfile(auth0Sub, profile = {}) {
      const db = getDb();

      if (!db || !auth0Sub) {
        return null;
      }

      const existingUser = await this.getUserByAuth0Sub(auth0Sub);
      const email = normalizeOptionalText(profile.email) || existingUser?.email || null;
      const displayName =
        normalizeOptionalText(profile.displayName) ||
        normalizeOptionalText(profile.nickname) ||
        normalizeOptionalText(profile.name) ||
        existingUser?.displayName ||
        email;

      if (!existingUser) {
        const [row] = await db
          .insert(users)
          .values({
            auth0Sub,
            email,
            displayName,
          })
          .returning({
            ...userSelection(),
          });

        return row;
      }

      if (email === existingUser.email && displayName === existingUser.displayName) {
        return existingUser;
      }

      const [row] = await db
        .update(users)
        .set({
          email,
          displayName,
        })
        .where(eq(users.auth0Sub, auth0Sub))
        .returning({
          ...userSelection(),
        });

      return row;
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
