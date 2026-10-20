import { Op } from "sequelize";
import {
  LearningResource,
  UserLearning,
  UserSkill,
  Skill,
  EligibilityResult,
  EligibilityItem,
  OpportunityRequirement,
} from "../../database/models/index.js";
import ApiError from "../../utils/ApiError.js";
import aiService from "../ai/ai.service.js";

/**
 * List curated learning resources with optional filters.
 */
export async function listResources(query) {
  const page = parseInt(query.page || "1", 10);
  const limit = parseInt(query.limit || "20", 10);
  const offset = (page - 1) * limit;

  const where = {};

  if (query.skillCategory) {
    where.skillCategory = { [Op.iLike]: `%${query.skillCategory}%` };
  }

  if (query.difficulty) {
    where.difficulty = query.difficulty;
  }

  if (query.freeOnly === "true") {
    where.isFree = true;
  }

  const { count, rows } = await LearningResource.findAndCountAll({
    where,
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });

  return {
    resources: rows,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      limit,
    },
  };
}

/**
 * Get AI-suggested resources based on the user's skill gaps.
 * Combines curated resources from the database with AI suggestions.
 */
export async function getSuggestedResources(userId) {
  // Find the user's skill gaps from their most recent eligibility checks
  const userSkills = await UserSkill.findAll({
    where: { userId },
    include: [{ model: Skill, as: "skill", attributes: ["name"] }],
  });

  const skillNames = userSkills.map((s) => s.skill?.name).filter(Boolean);

  // Get gap categories from eligibility items
  const gapItems = await EligibilityItem.findAll({
    include: [
      {
        model: EligibilityResult,
        as: "eligibilityResult",
        where: { userId },
        attributes: [],
      },
      {
        model: OpportunityRequirement,
        as: "requirement",
        attributes: ["type", "description"],
      },
    ],
    where: {
      result: {
        [Op.in]: ["NOT_SATISFIED", "POTENTIAL_GAP", "INFORMATION_NEEDED"],
      },
    },
    limit: 10,
  });

  const gaps = gapItems
    .filter((item) => item.requirement)
    .map((item) => ({
      type: item.requirement.type,
      description: item.requirement.description,
    }));

  // Get AI suggestions
  let aiSuggestions = null;
  if (gaps.length > 0) {
    try {
      aiSuggestions = await aiService.suggestLearningResources(gaps, {
        skills: skillNames,
      });
    } catch {
      // AI failure is silent
    }
  }

  // Get matching curated resources from the database
  const gapCategories = [...new Set(gaps.map((g) => g.type.toLowerCase()))];

  let curatedResources = [];
  if (gapCategories.length > 0) {
    curatedResources = await LearningResource.findAll({
      where: {
        skillCategory: {
          [Op.iLike]: {
            [Op.any]: gapCategories.map((c) => `%${c}%`),
          },
        },
      },
      limit: 5,
    });
  }

  return {
    curatedResources,
    aiSuggestions,
    gapsIdentified: gaps.length,
  };
}

/**
 * Save a resource to the user's learning list.
 */
export async function saveResource(userId, resourceId) {
  const resource = await LearningResource.findByPk(resourceId);
  if (!resource) {
    throw new ApiError(404, "NOT_FOUND", "Learning resource not found");
  }

  const existing = await UserLearning.findOne({
    where: { userId, resourceId },
  });

  if (existing) {
    throw new ApiError(
      409,
      "CONFLICT",
      "Resource already in your learning list",
    );
  }

  return UserLearning.create({
    userId,
    resourceId,
    status: "SAVED",
  });
}

/**
 * Update the status of a saved resource.
 */
export async function updateLearningStatus(userId, resourceId, status) {
  const learning = await UserLearning.findOne({
    where: { userId, resourceId },
  });

  if (!learning) {
    throw new ApiError(404, "NOT_FOUND", "Resource not in your learning list");
  }

  learning.status = status;
  await learning.save();

  return learning;
}

/**
 * List the user's saved learning resources with progress.
 */
export async function listMyLearning(userId) {
  return UserLearning.findAll({
    where: { userId },
    include: [
      {
        model: LearningResource,
        as: "resource",
      },
    ],
    order: [["created_at", "DESC"]],
  });
}
