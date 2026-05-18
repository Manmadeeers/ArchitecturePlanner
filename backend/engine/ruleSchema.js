const rules = {
  baseSelectionRules: [
    {
      id: "S1",
      when: {
        monthlyUsers: { lt: 1000 },
        expectedGrowth: { eq: "slow" },
      },
      then: {
        architectureStyle: "monolith",
      },
    },
    {
      id: "S2",
      when: {
        monthlyUsers: { gte: 1000, lt: 20000 },
      },
      then: {
        architectureStyle: "modular-monolith",
      },
    },
    {
      id: "S3",
      when: {
        any: [
          { monthlyUsers: { gte: 20000 } },
          { expectedGrowth: { in: ["fast", "unpredictable"] } },
        ],
      },
      then: {
        architectureStyle: "scalable-services",
      },
    },
    {
      id: "D1",
      when: {
        deploymentPreference: { eq: "managed-cloud" },
      },
      then: {
        deploymentModel: "managed-cloud",
      },
    },
    {
      id: "D2",
      when: {
        deploymentPreference: { eq: "on-premise" },
      },
      then: {
        deploymentModel: "on-premise",
        constraints: ["avoid managed cloud-only services"],
      },
    },
    {
      id: "D3",
      when: {
        deploymentPreference: { eq: "hybrid" },
      },
      then: {
        deploymentModel: "hybrid",
      },
    },
    {
      id: "D4",
      when: {
        deploymentPreference: { eq: "self-managed-cloud" },
      },
      then: {
        deploymentModel: "cloud",
        preferences: ["greater infrastructure control", "provider portability"],
      },
    },
    {
      id: "B1",
      when: {
        monthlyBudget: { lt: 200 },
      },
      then: {
        costProfile: "minimal",
        preferences: ["lowest practical hosting cost", "few moving parts"],
      },
    },
    {
      id: "B2",
      when: {
        monthlyBudget: { gte: 200, lte: 1000 },
      },
      then: {
        costProfile: "balanced",
        allowedComponents: ["managed-postgres", "object-storage"],
      },
    },
    {
      id: "B3",
      when: {
        monthlyBudget: { gt: 1000 },
      },
      then: {
        costProfile: "expanded",
        allowedComponents: ["managed-postgres", "object-storage", "cache", "monitoring", "redundancy"],
      },
    },
  ],
  componentEnrichmentRules: [
    {
      id: "F1",
      when: {
        coreFeatures: { includes: "authentication" },
      },
      then: {
        addComponents: ["auth-module"],
      },
    },
    {
      id: "F2",
      when: {
        coreFeatures: { includes: "payments" },
      },
      then: {
        addComponents: ["payment-gateway", "audit-log"],
      },
    },
    {
      id: "F3",
      when: {
        coreFeatures: { includes: "file-upload" },
      },
      then: {
        addComponents: ["object-storage", "cdn"],
      },
    },
    {
      id: "F4",
      when: {
        coreFeatures: { includes: "search" },
      },
      then: {
        addComponents: ["search-layer"],
      },
    },
    {
      id: "F5",
      when: {
        coreFeatures: { includes: "notifications" },
      },
      then: {
        addComponents: ["notification-service", "job-queue"],
      },
    },
    {
      id: "F6",
      when: {
        coreFeatures: { includes: "admin-panel" },
      },
      then: {
        addComponents: ["rbac", "admin-ui"],
      },
    },
    {
      id: "R1",
      when: {
        realtimeFeatures: { eq: true },
      },
      then: {
        addComponents: ["websocket-gateway"],
      },
    },
    {
      id: "R2",
      when: {
        realtimeFeatures: { eq: true },
        monthlyUsers: { gte: 20000 },
      },
      then: {
        addComponents: ["redis-pubsub"],
      },
    },
    {
      id: "SEC1",
      when: {
        dataSensitivity: { eq: "low" },
      },
      then: {
        addComponents: ["https", "basic-backups"],
      },
    },
    {
      id: "SEC2",
      when: {
        dataSensitivity: { eq: "medium" },
      },
      then: {
        addComponents: ["protected-fields", "audit-log", "strong-access-control"],
      },
    },
    {
      id: "SEC3",
      when: {
        dataSensitivity: { eq: "high" },
      },
      then: {
        addComponents: ["encryption-at-rest", "detailed-audit-log", "strict-access-control"],
      },
    },
    {
      id: "A1",
      when: {
        availabilityRequirement: { eq: "important" },
      },
      then: {
        addComponents: ["health-checks", "monitoring", "automated-backups"],
      },
    },
    {
      id: "A2",
      when: {
        availabilityRequirement: { eq: "critical" },
      },
      then: {
        addComponents: ["redundancy", "failover", "production-db-setup"],
      },
    },
  ],
  roadmapRules: [
    {
      id: "G1",
      when: {
        expectedGrowth: { eq: "slow" },
      },
      then: {
        addRoadmap: ["Start with a simple deployable monolith and scale only after real usage appears."],
      },
    },
    {
      id: "G2",
      when: {
        expectedGrowth: { eq: "moderate" },
      },
      then: {
        addRoadmap: ["Organize the backend as modules so it can later be split with minimal rework."],
      },
    },
    {
      id: "G3",
      when: {
        expectedGrowth: { in: ["fast", "unpredictable"] },
      },
      then: {
        addRoadmap: [
          "Introduce caching when repeat reads become significant.",
          "Move background work to queues as asynchronous workloads grow.",
          "Prepare horizontal scaling and stateless API deployment.",
        ],
      },
    },
    {
      id: "SPD1",
      when: {
        needFastDelivery: { eq: true },
      },
      then: {
        preferences: ["managed services", "simple deployment", "reduced setup time"],
        addRoadmap: ["Prioritize launch speed over early architectural sophistication."],
      },
    },
  ],
  conflictRules: [
    {
      id: "C1",
      when: {
        monthlyUsers: { gte: 20000 },
        monthlyBudget: { lt: 200 },
      },
      then: {
        addRisks: ["Budget is likely too low for the expected traffic level."],
      },
    },
    {
      id: "C2",
      when: {
        availabilityRequirement: { eq: "critical" },
        teamTechnicalLevel: { eq: "low" },
        needFastDelivery: { eq: true },
      },
      then: {
        addRisks: ["Critical availability with low team experience and fast delivery creates operational risk."],
      },
    },
    {
      id: "C3",
      when: {
        deploymentPreference: { eq: "on-premise" },
        needFastDelivery: { eq: true },
      },
      then: {
        addRisks: ["On-premise hosting will usually slow down MVP delivery."],
      },
    },
    {
      id: "C4",
      when: {
        dataSensitivity: { eq: "high" },
        monthlyBudget: { lt: 300 },
      },
      then: {
        addRisks: ["High-sensitivity workloads usually need a larger budget for secure operations."],
      },
    },
  ],
  regionRules: [
    {
      id: "REG1",
      when: {
        targetRegion: { eq: "europe" },
      },
      then: {
        regionAdjustments: {
          costMultiplier: 1.15,
        },
      },
    },
    {
      id: "REG2",
      when: {
        targetRegion: { eq: "global" },
      },
      then: {
        addComponents: ["cdn"],
        regionAdjustments: {
          costMultiplier: 1.25,
        },
      },
    },
    {
      id: "REG3",
      when: {
        targetRegion: { eq: "asia" },
      },
      then: {
        regionAdjustments: {
          costMultiplier: 1.1,
        },
      },
    },
  ],
};

module.exports = {
  rules,
};
