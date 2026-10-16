import { Op } from "sequelize";
import {
  Opportunity,
  OpportunityRequirement,
  SavedOpportunity,
} from "../../database/models/index.js";
import ApiError from "../../utils/ApiError.js";

// ─── List Opportunities (D1) ──────────────────────────────────────
export async function listOpportunities(query) {
  const page = parseInt(query.page || "1", 10);
  const limit = parseInt(query.limit || "20", 10);
  const offset = (page - 1) * limit;

  const where = {};

  // Hide expired by default
  if (query.showExpired !== "true") {
    where.status = { [Op.ne]: "EXPIRED" };
  }

  // Text search across title, organisation, description
  if (query.search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${query.search}%` } },
      { organisation: { [Op.iLike]: `%${query.search}%` } },
      { description: { [Op.iLike]: `%${query.search}%` } },
    ];
  }

  // Type filter (comma-separated: "JOB,INTERNSHIP")
  if (query.type) {
    const types = query.type.split(",").map((t) => t.trim().toUpperCase());
    where.type = { [Op.in]: types };
  }

  if (query.workMode) where.workMode = query.workMode;
  if (query.careerLevel) where.careerLevel = query.careerLevel;
  if (query.country) where.country = { [Op.iLike]: `%${query.country}%` };

  // Deadline range filter
  if (query.deadlineWithin) {
    const days = parseInt(query.deadlineWithin, 10);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    where.deadline = { [Op.lte]: futureDate, [Op.gte]: new Date() };
  }

  // Sort
  let order = [["deadline", "ASC"]]; // Default: soonest deadline first
  if (query.sort === "recent") {
    order = [["createdAt", "DESC"]];
  }

  const { count, rows } = await Opportunity.findAndCountAll({
    where,
    attributes: [
      "id",
      "title",
      "organisation",
      "type",
      "location",
      "country",
      "workMode",
      "deadline",
      "trustLabel",
      "status",
      "createdAt",
    ],
    order,
    limit,
    offset,
  });

  return {
    opportunities: rows,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      limit,
    },
  };
}

// ─── Get Single Opportunity (D2) ──────────────────────────────────
export async function getOpportunityById(opportunityId, userId) {
  const opportunity = await Opportunity.findByPk(opportunityId, {
    include: [
      {
        model: OpportunityRequirement,
        as: "requirements",
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
  });

  if (!opportunity) {
    throw new ApiError(404, "NOT_FOUND", "Opportunity not found");
  }

  // Check if the current user has saved this opportunity
  let isSaved = false;
  if (userId) {
    const save = await SavedOpportunity.findOne({
      where: { userId, opportunityId },
    });
    isSaved = !!save;
  }

  // Calculate days remaining until deadline
  let daysRemaining = null;
  if (opportunity.deadline) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(opportunity.deadline);
    const diffMs = deadlineDate - now;
    daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  return {
    ...opportunity.toJSON(),
    isSaved,
    daysRemaining,
  };
}

// ─── Bring an Opportunity (D3) ────────────────────────────────────
export async function bringOpportunity(userId, data) {
  // Duplicate check: same title + organisation (case-insensitive)
  const existing = await Opportunity.findOne({
    where: {
      title: { [Op.iLike]: data.title },
      organisation: { [Op.iLike]: data.organisation },
    },
  });

  if (existing) {
    return {
      isDuplicate: true,
      existingOpportunity: {
        id: existing.id,
        title: existing.title,
        organisation: existing.organisation,
        deadline: existing.deadline,
        trustLabel: existing.trustLabel,
      },
    };
  }

  // Create the opportunity
  const opportunity = await Opportunity.create({
    title: data.title,
    organisation: data.organisation,
    type: data.type,
    description: data.description || null,
    industry: data.industry || null,
    country: data.country || null,
    location: data.location || null,
    workMode: data.workMode || null,
    careerLevel: data.careerLevel || null,
    deadline: data.deadline || null,
    applicationUrl: data.applicationUrl || null,
    sourceUrl: data.sourceUrl || null,
    sourceType: data.sourceUrl ? "USER_REPORTED" : null,
    trustLabel: "USER_REPORTED",
    verificationStatus: "UNVERIFIED",
    status: "ACTIVE",
    addedByUserId: userId,
  });

  // Create requirements if provided
  if (data.requirements && data.requirements.length > 0) {
    const requirementRecords = data.requirements.map((req) => ({
      opportunityId: opportunity.id,
      type: req.type,
      description: req.description,
      isRequired: req.isRequired ?? true,
      evidenceSource: req.evidenceSource || "PUBLISHED",
      acceptsAnyDiscipline: req.acceptsAnyDiscipline || false,
    }));

    await OpportunityRequirement.bulkCreate(requirementRecords);
  }

  // Reload with requirements
  return getOpportunityById(opportunity.id, userId);
}

// ─── Save Opportunity (D1) ────────────────────────────────────────
export async function saveOpportunity(userId, opportunityId) {
  // Verify opportunity exists
  const opportunity = await Opportunity.findByPk(opportunityId);
  if (!opportunity) {
    throw new ApiError(404, "NOT_FOUND", "Opportunity not found");
  }

  // Check if already saved
  const existing = await SavedOpportunity.findOne({
    where: { userId, opportunityId },
  });

  if (existing) {
    throw new ApiError(409, "CONFLICT", "Opportunity is already saved");
  }

  await SavedOpportunity.create({ userId, opportunityId });

  return { saved: true };
}

// ─── Unsave Opportunity (D1) ──────────────────────────────────────
export async function unsaveOpportunity(userId, opportunityId) {
  const saved = await SavedOpportunity.findOne({
    where: { userId, opportunityId },
  });

  if (!saved) {
    throw new ApiError(
      404,
      "NOT_FOUND",
      "Opportunity is not in your saved list",
    );
  }

  await saved.destroy();

  return { saved: false };
}
