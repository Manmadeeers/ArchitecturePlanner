const { Router } = require("express");

const { attachCurrentUser, requireAuth } = require("../auth");

const router = Router();

router.get("/me", requireAuth, attachCurrentUser, (req, res) => {
  const claims = req.auth?.payload || {};

  res.status(200).json({
    user: req.currentUser,
    auth: {
      sub: claims.sub,
      email: claims.email || null,
      name: claims.name || claims.nickname || null,
    },
  });
});

module.exports = router;
