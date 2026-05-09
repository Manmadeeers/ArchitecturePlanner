const { eq } = require("drizzle-orm");

const { DEFAULT_ENGINE_SETTINGS, normalizeEngineSettings } = require("../../engine/engineSettings");
const { getDb } = require("../client");
const { engineSettings } = require("../schema");
const { createAdminAuditRepository } = require("./adminAuditRepository");

const ENGINE_SETTINGS_KEY = "planner_engine";
const auditRepository = createAdminAuditRepository();

function createDatabaseRequiredError() {
  const error = new Error("Database access is required for engine settings.");
  error.statusCode = 503;
  return error;
}

function createEngineSettingsRepository() {
  return {
    async getEngineSettingsRecord() {
      const db = getDb();

      if (!db) {
        return {
          key: ENGINE_SETTINGS_KEY,
          settings: DEFAULT_ENGINE_SETTINGS,
          updatedAt: null,
          updatedBy: null,
        };
      }

      const [row] = await db
        .select({
          key: engineSettings.key,
          valueJson: engineSettings.valueJson,
          updatedAt: engineSettings.updatedAt,
          updatedBy: engineSettings.updatedBy,
        })
        .from(engineSettings)
        .where(eq(engineSettings.key, ENGINE_SETTINGS_KEY))
        .limit(1);

      if (!row) {
        return {
          key: ENGINE_SETTINGS_KEY,
          settings: DEFAULT_ENGINE_SETTINGS,
          updatedAt: null,
          updatedBy: null,
        };
      }

      return {
        key: row.key,
        settings: normalizeEngineSettings(row.valueJson),
        updatedAt: row.updatedAt,
        updatedBy: row.updatedBy,
      };
    },

    async getEngineSettings() {
      const record = await this.getEngineSettingsRecord();
      return record.settings;
    },

    async saveEngineSettings(actorUserId, nextSettings) {
      const db = getDb();

      if (!db) {
        throw createDatabaseRequiredError();
      }

      const normalizedSettings = normalizeEngineSettings(nextSettings);
      const [row] = await db
        .insert(engineSettings)
        .values({
          key: ENGINE_SETTINGS_KEY,
          valueJson: normalizedSettings,
          updatedBy: actorUserId || null,
        })
        .onConflictDoUpdate({
          target: engineSettings.key,
          set: {
            valueJson: normalizedSettings,
            updatedBy: actorUserId || null,
            updatedAt: new Date(),
          },
        })
        .returning({
          key: engineSettings.key,
          updatedAt: engineSettings.updatedAt,
          updatedBy: engineSettings.updatedBy,
        });

      await auditRepository.logAction({
        actorUserId,
        action: "engine_settings.updated",
        targetType: "engine_settings",
        targetId: ENGINE_SETTINGS_KEY,
        details: normalizedSettings,
      });

      return {
        key: row.key,
        settings: normalizedSettings,
        updatedAt: row.updatedAt,
        updatedBy: row.updatedBy,
      };
    },
  };
}

module.exports = {
  ENGINE_SETTINGS_KEY,
  createEngineSettingsRepository,
};
