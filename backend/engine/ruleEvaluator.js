const DEFAULT_RESULT = {
  architectureStyle: "monolith",
  deploymentModel: "cloud",
  costProfile: "minimal",
  constraints: [],
  preferences: [],
  allowedComponents: [],
  components: [],
  roadmap: [],
  risks: [],
  regionAdjustments: {
    costMultiplier: 1,
    restrictedServices: [],
    fallbackServices: [],
  },
  appliedRuleIds: [],
};

function matchesOperators(value, operators) {
  if (Object.prototype.hasOwnProperty.call(operators, "eq") && value !== operators.eq) {
    return false;
  }

  if (Object.prototype.hasOwnProperty.call(operators, "in") && !operators.in.includes(value)) {
    return false;
  }

  if (Object.prototype.hasOwnProperty.call(operators, "lt") && !(value < operators.lt)) {
    return false;
  }

  if (Object.prototype.hasOwnProperty.call(operators, "lte") && !(value <= operators.lte)) {
    return false;
  }

  if (Object.prototype.hasOwnProperty.call(operators, "gt") && !(value > operators.gt)) {
    return false;
  }

  if (Object.prototype.hasOwnProperty.call(operators, "gte") && !(value >= operators.gte)) {
    return false;
  }

  if (Object.prototype.hasOwnProperty.call(operators, "includes")) {
    if (!Array.isArray(value) || !value.includes(operators.includes)) {
      return false;
    }
  }

  return true;
}

function matchesCondition(input, condition) {
  if (condition.any) {
    return condition.any.some((nestedCondition) => matchesCondition(input, nestedCondition));
  }

  return Object.entries(condition).every(([field, operators]) => {
    return matchesOperators(input[field], operators);
  });
}

function uniquePush(target, items) {
  for (const item of items || []) {
    if (!target.includes(item)) {
      target.push(item);
    }
  }
}

function applyThen(result, then) {
  if (then.architectureStyle) {
    result.architectureStyle = then.architectureStyle;
  }

  if (then.deploymentModel) {
    result.deploymentModel = then.deploymentModel;
  }

  if (then.costProfile) {
    result.costProfile = then.costProfile;
  }

  uniquePush(result.constraints, then.constraints);
  uniquePush(result.preferences, then.preferences);
  uniquePush(result.allowedComponents, then.allowedComponents);
  uniquePush(result.components, then.addComponents);
  uniquePush(result.roadmap, then.addRoadmap);
  uniquePush(result.risks, then.addRisks);

  if (then.regionAdjustments) {
    result.regionAdjustments = {
      ...result.regionAdjustments,
      ...then.regionAdjustments,
    };
  }
}

function evaluateRuleGroup(input, rules, result) {
  for (const rule of rules) {
    if (matchesCondition(input, rule.when)) {
      applyThen(result, rule.then);
      result.appliedRuleIds.push(rule.id);
    }
  }
}

function evaluateRules(input, ruleGroups) {
  const result = structuredClone(DEFAULT_RESULT);

  evaluateRuleGroup(input, ruleGroups.baseSelectionRules, result);
  evaluateRuleGroup(input, ruleGroups.componentEnrichmentRules, result);
  evaluateRuleGroup(input, ruleGroups.roadmapRules, result);
  evaluateRuleGroup(input, ruleGroups.conflictRules, result);
  evaluateRuleGroup(input, ruleGroups.regionRules, result);

  return result;
}

module.exports = {
  evaluateRules,
};
