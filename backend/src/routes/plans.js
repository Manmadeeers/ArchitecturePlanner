const { Router } = require("express");

const { createEngineSettingsRepository } = require("../../db/repositories/engineSettingsRepository");
const { generatePlan } = require("../../engine/planEngine");
const { createPlanRepository } = require("../../db/planRepository");
const { attachCurrentUser, requireAuth } = require("../auth");

const router = Router();
const engineSettingsRepository = createEngineSettingsRepository();
const repository = createPlanRepository();

router.use(requireAuth, attachCurrentUser);

function parseNonNegativeInteger(value) {
  if (value === undefined) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

router.post("/generate", async (req, res, next) => {
  try {
    const engineSettings = await engineSettingsRepository.getEngineSettings();
    const plan = generatePlan(req.body, engineSettings);
    const savedPlan = await repository.saveGeneratedPlan(req.currentUser?.id, plan);

    if (!savedPlan?.persisted) {
      const error = new Error(savedPlan?.reason || "Plan generation succeeded but saving failed.");
      error.statusCode = 503;
      throw error;
    }

    const planWithTechnologies = {
      ...plan,
      technologies: savedPlan?.technologies || [],
    };

    res.status(200).json({
      plan: planWithTechnologies,
      savedPlan,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/recent", async (req, res, next) => {
  try {
    const plans = await repository.listRecentPlans(req.currentUser?.id);

    res.status(200).json({
      plans,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const limit = parseNonNegativeInteger(req.query.limit);
    const offset = parseNonNegativeInteger(req.query.offset);
    const plans = await repository.listUserPlans(req.currentUser?.id, {
      limit,
      offset,
    });

    res.status(200).json({
      plans,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:planId", async (req, res, next) => {
  try {
    const deletedPlan = await repository.deleteUserPlanByPlanId(req.currentUser?.id, req.params.planId);

    if (!deletedPlan) {
      return res.status(404).json({
        error: "Project not found for the current user.",
      });
    }

    return res.status(200).json({
      deletedPlan,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:planId", async (req, res, next) => {
  try {
    const savedPlan = await repository.getUserPlanByPlanId(req.currentUser?.id, req.params.planId);

    if (!savedPlan) {
      return res.status(404).json({
        error: "Project not found for the current user.",
      });
    }

    return res.status(200).json({
      plan: savedPlan.plan,
      savedPlan: {
        id: savedPlan.id,
        createdAt: savedPlan.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
