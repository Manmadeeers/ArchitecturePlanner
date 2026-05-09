const { desc, eq } = require("drizzle-orm");

const { getDb } = require("../client");
const { adminAuditLog, users } = require("../schema");

function createAdminAuditRepository() {
  return {
    async logAction({ actorUserId, action, targetType, targetId = null, details = null }) {
      const db = getDb();

      if (!db) {
        return null;
      }

      const [row] = await db
        .insert(adminAuditLog)
        .values({
          actorUserId: actorUserId || null,
          action,
          targetType,
          targetId,
          detailsJson: details,
        })
        .returning({
          id: adminAuditLog.id,
          createdAt: adminAuditLog.createdAt,
        });

      return row;
    },

    async listRecentActions(limit = 8) {
      const db = getDb();

      if (!db) {
        return [];
      }

      return db
        .select({
          id: adminAuditLog.id,
          action: adminAuditLog.action,
          targetType: adminAuditLog.targetType,
          targetId: adminAuditLog.targetId,
          details: adminAuditLog.detailsJson,
          createdAt: adminAuditLog.createdAt,
          actorUserId: adminAuditLog.actorUserId,
          actorEmail: users.email,
          actorDisplayName: users.displayName,
        })
        .from(adminAuditLog)
        .leftJoin(users, eq(adminAuditLog.actorUserId, users.id))
        .orderBy(desc(adminAuditLog.createdAt))
        .limit(limit);
    },
  };
}

module.exports = {
  createAdminAuditRepository,
};
