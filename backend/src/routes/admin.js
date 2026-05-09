const { Router } = require("express");

const { createAnalyticsRepository } = require("../../db/repositories/analyticsRepository");
const { createEngineSettingsRepository } = require("../../db/repositories/engineSettingsRepository");
const { createUserRepository } = require("../../db/repositories/userRepository");
const { attachCurrentUser, requireAdmin, requireAuth } = require("../auth");

const router = Router();
const analyticsRepository = createAnalyticsRepository();
const engineSettingsRepository = createEngineSettingsRepository();
const userRepository = createUserRepository();

router.use(requireAuth, attachCurrentUser, requireAdmin);

function parseUserId(userIdParam) {
  const userId = Number(userIdParam);
  return Number.isInteger(userId) ? userId : null;
}

router.get("/users", async (req, res, next) => {
  try {
    const users = await userRepository.listUsers();

    res.status(200).json({
      users,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/users/:userId/role", async (req, res, next) => {
  try {
    const targetUserId = parseUserId(req.params.userId);

    if (targetUserId === null) {
      return res.status(400).json({
        error: "User id must be a valid integer.",
      });
    }

    const user = await userRepository.updateUserRole(targetUserId, String(req.body?.role || ""), req.currentUser?.id);

    return res.status(200).json({
      user,
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/users/:userId", async (req, res, next) => {
  try {
    const targetUserId = parseUserId(req.params.userId);

    if (targetUserId === null) {
      return res.status(400).json({
        error: "User id must be a valid integer.",
      });
    }

    const user = await userRepository.updateUserDetails(
      targetUserId,
      {
        email: req.body?.email,
        displayName: req.body?.displayName,
      },
      req.currentUser?.id
    );

    return res.status(200).json({
      user,
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/users/:userId", async (req, res, next) => {
  try {
    const targetUserId = parseUserId(req.params.userId);

    if (targetUserId === null) {
      return res.status(400).json({
        error: "User id must be a valid integer.",
      });
    }

    const user = await userRepository.deleteUser(targetUserId, req.currentUser?.id);

    return res.status(200).json({
      deletedUserId: user.id,
      user,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/analytics/overview", async (req, res, next) => {
  try {
    const overview = await analyticsRepository.getOverview();

    res.status(200).json(overview);
  } catch (error) {
    next(error);
  }
});

router.get("/settings/engine", async (req, res, next) => {
  try {
    const settingsRecord = await engineSettingsRepository.getEngineSettingsRecord();

    res.status(200).json(settingsRecord);
  } catch (error) {
    next(error);
  }
});

router.patch("/settings/engine", async (req, res, next) => {
  try {
    const settingsRecord = await engineSettingsRepository.saveEngineSettings(req.currentUser?.id, req.body?.settings || {});

    res.status(200).json(settingsRecord);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
