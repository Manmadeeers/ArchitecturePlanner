const regionCatalog = {
  "north-america": {
    code: "north-america",
    label: "North America",
    costMultiplier: 1,
    managedPostgresAvailable: true,
    objectStorageAvailable: true,
    notes: [
      "Strong managed cloud support.",
      "Baseline cost region for estimates.",
    ],
    source: "local-mvp-catalog",
  },
  europe: {
    code: "europe",
    label: "Europe",
    costMultiplier: 1.15,
    managedPostgresAvailable: true,
    objectStorageAvailable: true,
    notes: [
      "Slightly higher estimated hosting costs.",
      "Useful when planning for EU data residency.",
    ],
    source: "local-mvp-catalog",
  },
  asia: {
    code: "asia",
    label: "Asia",
    costMultiplier: 1.1,
    managedPostgresAvailable: true,
    objectStorageAvailable: true,
    notes: [
      "Costs vary by provider and target country.",
      "Latency planning may matter for multi-country deployment.",
    ],
    source: "local-mvp-catalog",
  },
  global: {
    code: "global",
    label: "Global",
    costMultiplier: 1.25,
    managedPostgresAvailable: true,
    objectStorageAvailable: true,
    notes: [
      "Global delivery usually benefits from CDN usage.",
      "Multi-region concerns increase operational complexity.",
    ],
    source: "local-mvp-catalog",
  },
};

function getRegionProfile(regionCode) {
  return regionCatalog[regionCode] || regionCatalog["north-america"];
}

module.exports = {
  getRegionProfile,
  regionCatalog,
};
