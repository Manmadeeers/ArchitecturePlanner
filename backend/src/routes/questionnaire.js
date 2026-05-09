const { Router } = require("express");

const { questionnaire } = require("../../engine/questionnaire");

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    questionnaire,
  });
});

module.exports = router;
