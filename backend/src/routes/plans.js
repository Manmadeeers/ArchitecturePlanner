const { Router } = require("express");

const { generatePlan } = require("../../engine/planEngine");
const { createPlanRepository } = require("../../db/planRepository");
const { attachCurrentUser, requireAuth } = require("../auth");

const router = Router();
const repository = createPlanRepository();

router.use(requireAuth, attachCurrentUser);

router.post("/generate", async (req, res, next) => {
  try {
    const plan = generatePlan(req.body);
    const savedPlan = await repository.saveGeneratedPlan(req.currentUser?.id, plan);

    res.status(200).json({
      plan,
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
    const plans = await repository.listUserPlans(req.currentUser?.id);

    res.status(200).json({
      plans,
    });
  } catch (error) {
    next(error);
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
