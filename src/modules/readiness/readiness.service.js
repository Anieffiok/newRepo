import {
  Opportunity,
  OpportunityRequirement,
  EligibilityResult,
  EligibilityItem,
  ReadinessResult,
  ReadinessItem,
  Profile,
  Document,
  UserSkill,
  Skill,
} from "../../database/models/index.js";
import ApiError from "../../utils/ApiError.js";
import aiService from "../ai/ai.service.js";
import * as eligibilityService from "../eligibility/eligibility.service.js";

/**
 * Run readiness analysis for a user against an opportunity.
 * This converts eligibility gaps into actionable to-do items.
 */
export async function analyseReadiness(userId, opportunityId) {
  // 1. Get or run eligibility first
  let eligibility = await EligibilityResult.findOne({
    where: { userId, opportunityId },
    include: [
      {
        model: EligibilityItem,
        as: "items",
        include: [
          {
            model: OpportunityRequirement,
            as: "requirement",
          },
        ],
      },
    ],
  });

  if (!eligibility) {
    // No eligibility check yet — run one automatically
    eligibility = await eligibilityService.analyseEligibility(
      userId,
      opportunityId,
    );
    // Re-fetch with associations
    eligibility = await EligibilityResult.findOne({
      where: { id: eligibility.id },
      include: [
        {
          model: EligibilityItem,
          as: "items",
          include: [
            {
              model: OpportunityRequirement,
              as: "requirement",
            },
          ],
        },
      ],
    });
  }

  // 2. Gather user data for document checks
  const [profile, documents, userSkills] = await Promise.all([
    Profile.findOne({ where: { userId } }),
    Document.findAll({ where: { userId } }),
    UserSkill.findAll({
      where: { userId },
      include: [{ model: Skill, as: "skill", attributes: ["name"] }],
    }),
  ]);

  // 3. Build readiness items from eligibility gaps
  const items = [];

  for (const item of eligibility.items) {
    const req = item.requirement;
    if (!req) continue;

    // Skip satisfied and not-applicable items — no action needed
    if (item.result === "SATISFIED" || item.result === "NOT_APPLICABLE")
      continue;

    // Convert each gap into an actionable item
    const readinessItem = buildReadinessItem(item, req);
    if (readinessItem) {
      items.push(readinessItem);
    }
  }

  // 4. Always check for CV/document readiness
  const hasCV = documents.some((d) => d.documentType === "CV");
  if (!hasCV) {
    items.push({
      itemType: "DOCUMENT",
      status: "PENDING",
      priority: "HIGH",
      title: "Upload your CV",
      description:
        "Most applications require a CV. Upload yours in the Documents section so it is ready when you apply.",
      profileSection: "documents",
    });
  }

  // 5. Check for assessment preparation
  const assessmentReqs = eligibility.items.filter(
    (i) => i.requirement?.type === "SKILLS" && i.result !== "SATISFIED",
  );
  if (assessmentReqs.length > 0) {
    items.push({
      itemType: "ASSESSMENT",
      status: "PENDING",
      priority: "MEDIUM",
      title: "Practise assessment areas",
      description:
        "This opportunity may include aptitude tests. Practise numerical reasoning, verbal reasoning, and logical reasoning to prepare.",
      profileSection: null,
    });
  }
  // 5b. AI guidance (fails silently — structured items stand on their own)
  let aiGuidance = null;
  const pendingItems = items.filter((i) => i.status === "PENDING");
  if (pendingItems.length > 0) {
    try {
      aiGuidance = await aiService.generateReadinessGuidance(
        pendingItems.map((i) => ({
          type: i.itemType,
          title: i.title,
          description: i.description,
        })),
        {
          degree: profile?.degree || "Not provided",
          skills: userSkills.map((s) => s.skill?.name).filter(Boolean),
        },
      );
    } catch {
      // AI failure is silent
    }
  }

  // 6. Determine overall readiness state
  const state = determineReadinessState(items, eligibility);
  const summary = buildSummary(state, items);

  // 7. Upsert the readiness result
  const [readinessResult] = await ReadinessResult.upsert({
    userId,
    opportunityId,
    eligibilityResultId: eligibility.id,
    state,
    summary,
    aiGuidance,
  });

  // 8. Replace old items with new ones
  await ReadinessItem.destroy({
    where: { readinessResultId: readinessResult.id },
  });

  if (items.length > 0) {
    const itemRecords = items.map((item) => ({
      readinessResultId: readinessResult.id,
      ...item,
    }));
    await ReadinessItem.bulkCreate(itemRecords);
  }

  // 9. Return the full result
  return getReadinessResult(readinessResult.id, userId);
}

/**
 * Convert an eligibility gap into a readiness action item.
 */
function buildReadinessItem(eligibilityItem, requirement) {
  const { result, reason } = eligibilityItem;
  const reqType = requirement.type;
  const desc = requirement.description;

  switch (reqType) {
    case "DEGREE":
      if (result === "INFORMATION_NEEDED") {
        return {
          itemType: "PROFILE",
          status: "PENDING",
          priority: "HIGH",
          title: "Add your education to your profile",
          description: `This opportunity requires ${desc}. Add your qualification in the Education section.`,
          profileSection: "education",
        };
      }
      if (result === "NOT_SATISFIED") {
        return {
          itemType: "PROFILE",
          status: "PENDING",
          priority: "HIGH",
          title: `Qualification gap: ${desc}`,
          description:
            reason +
            " Consider whether you have an equivalent qualification you can add.",
          profileSection: "education",
        };
      }
      return null;

    case "DISCIPLINE":
      // Any-discipline items are NOT_APPLICABLE, so we won't reach here.
      // But if there's a genuine discipline gap:
      return {
        itemType: "PROFILE",
        status: "PENDING",
        priority: "MEDIUM",
        title: `Check discipline requirement: ${desc}`,
        description: reason,
        profileSection: "education",
      };

    case "SKILLS":
      if (result === "INFORMATION_NEEDED") {
        return {
          itemType: "SKILL",
          status: "PENDING",
          priority: "MEDIUM",
          title: "Add your skills to your profile",
          description: `This opportunity requires ${desc}. Add relevant skills in the Skills section.`,
          profileSection: "skills",
        };
      }
      if (result === "POTENTIAL_GAP" || result === "NOT_SATISFIED") {
        return {
          itemType: "SKILL",
          status: "PENDING",
          priority: result === "NOT_SATISFIED" ? "HIGH" : "MEDIUM",
          title: `Develop or add skill: ${desc}`,
          description: reason,
          profileSection: "skills",
        };
      }
      return null;

    case "EXPERIENCE":
      if (result === "INFORMATION_NEEDED") {
        return {
          itemType: "EXPERIENCE",
          status: "PENDING",
          priority: "MEDIUM",
          title: "Add your work experience",
          description: `This opportunity requires ${desc}. Add your experience in the Experience section, including internships and projects.`,
          profileSection: "experience",
        };
      }
      if (result === "POTENTIAL_GAP" || result === "NOT_SATISFIED") {
        return {
          itemType: "EXPERIENCE",
          status: "PENDING",
          priority: "MEDIUM",
          title: `Experience gap: ${desc}`,
          description: reason,
          profileSection: "experience",
        };
      }
      return null;

    case "CERTIFICATIONS":
      if (result === "INFORMATION_NEEDED") {
        return {
          itemType: "CERTIFICATION",
          status: "PENDING",
          priority: "HIGH",
          title: `Add certification: ${desc}`,
          description: `This opportunity requires ${desc}. Add it in the Certifications section if you have it.`,
          profileSection: "certifications",
        };
      }
      if (result === "NOT_SATISFIED") {
        return {
          itemType: "CERTIFICATION",
          status: "PENDING",
          priority: "HIGH",
          title: `Missing certification: ${desc}`,
          description:
            reason +
            " Check if you can obtain this certification before the deadline.",
          profileSection: "certifications",
        };
      }
      return null;

    case "LOCATION":
      if (result === "INFORMATION_NEEDED") {
        return {
          itemType: "PROFILE",
          status: "PENDING",
          priority: "LOW",
          title: "Add your location to your profile",
          description:
            "Add your country and city in your Profile so we can check location requirements.",
          profileSection: "profile",
        };
      }
      return null;

    case "OTHER":
      return {
        itemType: "PROFILE",
        status: "PENDING",
        priority: "MEDIUM",
        title: `Review requirement: ${desc}`,
        description: reason,
        profileSection: null,
      };

    default:
      return null;
  }
}

/**
 * Determine the overall readiness state from the items.
 */
function determineReadinessState(items, eligibility) {
  if (items.length === 0) {
    return "READY";
  }

  const pendingItems = items.filter((i) => i.status === "PENDING");
  if (pendingItems.length === 0) {
    return "READY";
  }

  const highPriorityBlocking = pendingItems.filter(
    (i) =>
      i.priority === "HIGH" &&
      (i.itemType === "CERTIFICATION" || i.itemType === "PROFILE"),
  );

  const infoNeededCount = eligibility.items.filter(
    (i) => i.result === "INFORMATION_NEEDED",
  ).length;

  // If more than half the eligibility items need info, we can't assess readiness
  if (infoNeededCount > eligibility.items.length / 2) {
    return "INFORMATION_NEEDED";
  }

  // If there are high-priority blocking items (missing certs, missing degree info)
  if (highPriorityBlocking.length > 0) {
    return "MISSING_REQUIREMENT";
  }

  return "NEEDS_PREPARATION";
}

/**
 * Build a plain-language summary for the readiness state.
 */
function buildSummary(state, items) {
  const pending = items.filter((i) => i.status === "PENDING").length;

  switch (state) {
    case "READY":
      return "You are ready for this opportunity. All requirements are met.";
    case "NEEDS_PREPARATION":
      return `You have ${pending} action(s) to complete before you are fully ready.`;
    case "MISSING_REQUIREMENT":
      return `You are missing ${pending} required item(s). Check the list below to see what you can do.`;
    case "INFORMATION_NEEDED":
      return `We need more information about your profile to assess your readiness. ${pending} item(s) need your attention.`;
    default:
      return "Readiness assessment complete.";
  }
}

/**
 * Get a readiness result with all items.
 */
export async function getReadinessResult(resultId, userId) {
  const result = await ReadinessResult.findOne({
    where: { id: resultId, userId },
    include: [
      {
        model: ReadinessItem,
        as: "items",
        order: [
          ["priority", "ASC"], // HIGH first
          ["status", "ASC"], // PENDING first
        ],
      },
      {
        model: Opportunity,
        as: "opportunity",
        attributes: ["id", "title", "organisation", "deadline", "trustLabel"],
      },
    ],
  });

  if (!result) {
    throw new ApiError(404, "NOT_FOUND", "Readiness result not found");
  }

  return result;
}

/**
 * Update a readiness item status (mark as done or dismissed).
 */
export async function updateReadinessItem(resultId, itemId, userId, status) {
  // Verify ownership through the result
  const result = await ReadinessResult.findOne({
    where: { id: resultId, userId },
  });

  if (!result) {
    throw new ApiError(404, "NOT_FOUND", "Readiness result not found");
  }

  const item = await ReadinessItem.findOne({
    where: { id: itemId, readinessResultId: resultId },
  });

  if (!item) {
    throw new ApiError(404, "NOT_FOUND", "Readiness item not found");
  }

  item.status = status;
  await item.save();

  // Re-evaluate the overall state after the change
  const allItems = await ReadinessItem.findAll({
    where: { readinessResultId: resultId },
  });

  const pending = allItems.filter((i) => i.status === "PENDING");
  let newState = result.state;

  if (pending.length === 0) {
    newState = "READY";
  } else if (result.state === "READY") {
    newState = "NEEDS_PREPARATION";
  }

  if (newState !== result.state) {
    result.state = newState;
    result.summary = buildSummary(newState, allItems);
    await result.save();
  }

  return getReadinessResult(resultId, userId);
}
