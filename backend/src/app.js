const express = require("express");

const authRouter = require("./routes/auth");
const healthRouter = require("./routes/health");
const questionnaireRouter = require("./routes/questionnaire");
const plansRouter = require("./routes/plans");

function createApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    return next();
  });

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/questionnaire", questionnaireRouter);
  app.use("/api/plans", plansRouter);

  app.use((req, res) => {
    res.status(404).json({
      error: "Not found",
      path: req.path,
    });
  });

  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
      error: err.message || "Unexpected server error",
      details: err.details || null,
    });
  });

  return app;
}

module.exports = {
  createApp,
};
