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
    const savedPlan = await repository.saveGeneratedPlan(plan);

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
    const plans = await repository.listRecentPlans();

    res.status(200).json({
      plans,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
