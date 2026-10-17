import {
  Opportunity,
  OpportunityRequirement,
  EligibilityResult,
  EligibilityItem,
  Profile,
  Education,
  Experience,
  Certification,
  UserSkill,
  Skill,
} from "../../database/models/index.js";
import ApiError from "../../utils/ApiError.js";
import {
  buildProfileSnapshot,
  evaluateRequirement,
  determineMatchLabel,
} from "./eligibility.rules.js";

/**
 * Run eligibility analysis for a user against an opportunity.
 * Creates or updates the eligibility result and items.
 */
export async function analyseEligibility(userId, opportunityId) {
  // 1. Verify the opportunity exists and has requirements
  const opportunity = await Opportunity.findByPk(opportunityId, {
    include: [
      {
        model: OpportunityRequirement,
        as: "requirements",
      },
    ],
  });

  if (!opportunity) {
    throw new ApiError(404, "NOT_FOUND", "Opportunity not found");
  }

  if (!opportunity.requirements || opportunity.requirements.length === 0) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "This opportunity has no published requirements to check against",
    );
  }

  // 2. Gather the user's profile data
  const [profile, education, experiences, certifications, userSkills] =
    await Promise.all([
      Profile.findOne({ where: { userId } }),
      Education.findAll({
        where: { userId },
        order: [["endDate", "DESC NULLS LAST"]],
      }),
      Experience.findAll({ where: { userId } }),
      Certification.findAll({ where: { userId } }),
      UserSkill.findAll({
        where: { userId },
        include: [
          { model: Skill, as: "skill", attributes: ["name", "category"] },
        ],
      }),
    ]);

  // 3. Build the profile snapshot
  const snapshot = buildProfileSnapshot(
    profile,
    education,
    userSkills,
    experiences,
    certifications,
  );

  // 4. Evaluate each requirement
  const evaluatedItems = opportunity.requirements.map((req) => {
    const evaluation = evaluateRequirement(req, snapshot);
    return {
      requirementId: req.id,
      result: evaluation.result,
      reason: evaluation.reason,
      userInfoUsed: evaluation.userInfoUsed,
    };
  });

  // 5. Determine the overall match label
  const { label, summary } = determineMatchLabel(
    evaluatedItems,
    opportunity.requirements,
  );

  // 6. Upsert the eligibility result (update if exists, create if new)
  const [eligibilityResult] = await EligibilityResult.upsert({
    userId,
    opportunityId,
    matchLabel: label,
    summary,
  });

  // 7. Delete old items and create new ones
  await EligibilityItem.destroy({
    where: { eligibilityResultId: eligibilityResult.id },
  });

  const itemRecords = evaluatedItems.map((item) => ({
    eligibilityResultId: eligibilityResult.id,
    requirementId: item.requirementId,
    result: item.result,
    reason: item.reason,
    userInfoUsed: item.userInfoUsed,
  }));

  await EligibilityItem.bulkCreate(itemRecords);

  // 8. Return the full result
  return getEligibilityResult(eligibilityResult.id, userId);
}

/**
 * Get a previously computed eligibility result with all items.
 */
export async function getEligibilityResult(resultId, userId) {
  const result = await EligibilityResult.findOne({
    where: { id: resultId, userId },
    include: [
      {
        model: EligibilityItem,
        as: "items",
        include: [
          {
            model: OpportunityRequirement,
            as: "requirement",
            attributes: [
              "id",
              "type",
              "description",
              "isRequired",
              "evidenceSource",
              "acceptsAnyDiscipline",
            ],
          },
        ],
      },
      {
        model: Opportunity,
        as: "opportunity",
        attributes: ["id", "title", "organisation", "trustLabel"],
      },
    ],
  });

  if (!result) {
    throw new ApiError(404, "NOT_FOUND", "Eligibility result not found");
  }

  return result;
}
