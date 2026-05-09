const { auth } = require("express-oauth2-jwt-bearer");

const { createUserRepository } = require("../db/repositories/userRepository");

const userRepository = createUserRepository();
let checkJwt = null;

function isAuthConfigured() {
  return Boolean(process.env.AUTH0_DOMAIN && process.env.AUTH0_AUDIENCE);
}

function getIssuerBaseURL() {
  if (!process.env.AUTH0_DOMAIN) {
    return null;
  }

  const normalizedDomain = process.env.AUTH0_DOMAIN.startsWith("http")
    ? process.env.AUTH0_DOMAIN
    : `https://${process.env.AUTH0_DOMAIN}`;

  return normalizedDomain.endsWith("/") ? normalizedDomain : `${normalizedDomain}/`;
}

function getCheckJwt() {
  if (!isAuthConfigured()) {
    return null;
  }

  if (!checkJwt) {
    checkJwt = auth({
      audience: process.env.AUTH0_AUDIENCE,
      issuerBaseURL: getIssuerBaseURL(),
    });
  }

  return checkJwt;
}

function requireAuth(req, res, next) {
  const activeCheckJwt = getCheckJwt();

  if (!activeCheckJwt) {
    return res.status(503).json({
      error: "Authentication is not configured on the server.",
      details: ["Set AUTH0_DOMAIN and AUTH0_AUDIENCE to enable protected API routes."],
    });
  }

  return activeCheckJwt(req, res, next);
}

async function attachCurrentUser(req, res, next) {
  try {
    const claims = req.auth?.payload;

    if (!claims?.sub) {
      return res.status(401).json({
        error: "Authenticated token is missing the subject claim.",
      });
    }

    req.currentUser = await userRepository.upsertFromClaims(claims);
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  attachCurrentUser,
  isAuthConfigured,
  requireAuth,
};
