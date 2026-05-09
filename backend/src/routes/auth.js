const { Router } = require("express");

const { createUserRepository } = require("../../db/repositories/userRepository");
const { attachCurrentUser, requireAuth } = require("../auth");

const router = Router();
const userRepository = createUserRepository();

router.patch("/profile", requireAuth, async (req, res, next) => {
  try {
    const auth0Sub = req.auth?.payload?.sub;

    if (!auth0Sub) {
      return res.status(401).json({
        error: "Authenticated token is missing the subject claim.",
      });
    }

    const user = await userRepository.syncProfile(auth0Sub, {
      email: req.body?.email,
      displayName: req.body?.displayName,
      name: req.body?.name,
      nickname: req.body?.nickname,
    });

    return res.status(200).json({
      user,
    });
  } catch (error) {
    return next(error);
  }
});

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
