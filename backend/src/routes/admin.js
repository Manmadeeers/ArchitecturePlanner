const { Router } = require("express");

const { createAnalyticsRepository } = require("../../db/repositories/analyticsRepository");
const { createAdminAuditRepository } = require("../../db/repositories/adminAuditRepository");
const { createEngineSettingsRepository } = require("../../db/repositories/engineSettingsRepository");
const { createTechnologyRepository } = require("../../db/repositories/technologyRepository");
const { createUserRepository } = require("../../db/repositories/userRepository");
const { generateAdminAnalyticsPdf } = require("../services/adminAnalyticsPdf");
const { attachCurrentUser, requireAdmin, requireAuth } = require("../auth");

const router = Router();
const adminAuditRepository = createAdminAuditRepository();
const analyticsRepository = createAnalyticsRepository();
const engineSettingsRepository = createEngineSettingsRepository();
const technologyRepository = createTechnologyRepository();
const userRepository = createUserRepository();

router.use(requireAuth, attachCurrentUser, requireAdmin);

function parseUserId(userIdParam) {
  const userId = Number(userIdParam);
  return Number.isInteger(userId) ? userId : null;
}

function parseTechnologyId(technologyIdParam) {
  const technologyId = Number(technologyIdParam);
  return Number.isInteger(technologyId) ? technologyId : null;
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

router.get("/reports/analytics.pdf", async (req, res, next) => {
  try {
    const overview = await analyticsRepository.getOverview();
    const pdfBuffer = generateAdminAnalyticsPdf({
      overview,
      generatedAt: new Date(),
      generatedBy: req.currentUser || null,
    });
    const fileDate = new Date().toISOString().slice(0, 10);

    await adminAuditRepository.logAction({
      actorUserId: req.currentUser?.id || null,
      action: "Admin downloaded analytics PDF report",
      targetType: "analytics_report",
      targetId: fileDate,
      details: {
        totalPlans: overview?.totals?.totalPlans || 0,
      },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=\"analytics-report-${fileDate}.pdf\"`);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(pdfBuffer);
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

router.get("/technologies", async (req, res, next) => {
  try {
    const includeInactive = String(req.query.includeInactive || "").toLowerCase() === "true";
    const technologies = await technologyRepository.listTechnologies({ includeInactive });

    res.status(200).json({
      technologies,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/technology-categories", async (req, res, next) => {
  try {
    const includeInactive = String(req.query.includeInactive || "").toLowerCase() === "true";
    const categories = await technologyRepository.listTechnologyCategories({ includeInactive });

    res.status(200).json({
      categories,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/technologies", async (req, res, next) => {
  try {
    const technology = await technologyRepository.createTechnology(req.body || {}, req.currentUser?.id);

    res.status(201).json({
      technology,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/technologies/:technologyId", async (req, res, next) => {
  try {
    const technologyId = parseTechnologyId(req.params.technologyId);

    if (technologyId === null) {
      return res.status(400).json({
        error: "Technology id must be a valid integer.",
      });
    }

    const technology = await technologyRepository.updateTechnology(technologyId, req.body || {}, req.currentUser?.id);

    return res.status(200).json({
      technology,
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/technologies/:technologyId", async (req, res, next) => {
  try {
    const technologyId = parseTechnologyId(req.params.technologyId);

    if (technologyId === null) {
      return res.status(400).json({
        error: "Technology id must be a valid integer.",
      });
    }

    const technology = await technologyRepository.deleteTechnology(technologyId, req.currentUser?.id);

    return res.status(200).json({
      deletedTechnologyId: technology.id,
      technology,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
