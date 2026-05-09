require("./loadEnv");

const { createApp } = require("./app");

const PORT = Number(process.env.PORT || 4000);
const app = createApp();

app.listen(PORT, () => {
  console.log(`ArchitecturePlanner API listening on http://localhost:${PORT}`);
});
