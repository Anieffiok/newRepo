import {
  Application,
  ApplicationStage,
  Opportunity,
} from "../../database/models/index.js";
import ApiError from "../../utils/ApiError.js";

// Stage ordering for auto-updating currentStage
const STAGE_ORDER = {
  APPLIED: 1,
  ASSESSMENT: 2,
  INTERVIEW: 3,
  FINAL_STAGE: 4,
  OUTCOME: 5,
  REVIEW: 6,
};

// ─── List Applications (F1) ─────────────────────────────────────
export async function listApplications(userId, query) {
  const where = { userId };

  if (query.status === "ACTIVE") where.status = "ACTIVE";
  else if (query.status === "CLOSED") where.status = "CLOSED";
  // 'ALL' or undefined → no status filter

  const applications = await Application.findAll({
    where,
    include: [
      {
        model: Opportunity,
        as: "opportunity",
        attributes: ["id", "title", "organisation", "trustLabel", "deadline"],
      },
    ],
    order: [
      ["status", "ASC"], // Active first
      ["applicationDate", "DESC"], // Then newest
    ],
  });

  return applications;
}

// ─── Create Application (F2) ────────────────────────────────────
export async function createApplication(userId, data) {
  // Verify the opportunity exists
  const opportunity = await Opportunity.findByPk(data.opportunityId);
  if (!opportunity) {
    throw new ApiError(404, "NOT_FOUND", "Opportunity not found");
  }

  // Check for duplicate application (same user + same opportunity)
  const existing = await Application.findOne({
    where: { userId, opportunityId: data.opportunityId },
  });
  if (existing) {
    throw new ApiError(
      409,
      "CONFLICT",
      "You already have an application for this opportunity",
    );
  }

  // Create the application
  const application = await Application.create({
    userId,
    opportunityId: data.opportunityId,
    applicationDate:
      data.applicationDate || new Date().toISOString().split("T")[0],
    applicationUrl: data.applicationUrl || null,
    source: data.source || "FOUND_IN_ROVIA",
    currentStage: "APPLIED",
    status: "ACTIVE",
    notes: data.notes || null,
  });

  // Auto-create the "Applied" stage
  await ApplicationStage.create({
    applicationId: application.id,
    stageType: "APPLIED",
    status: "COMPLETED",
    completionDate: new Date(),
    sortOrder: 1,
  });

  return getApplicationById(application.id, userId);
}

// ─── Get Application Detail (F3) ────────────────────────────────
export async function getApplicationById(applicationId, userId) {
  const application = await Application.findOne({
    where: { id: applicationId, userId },
    include: [
      {
        model: Opportunity,
        as: "opportunity",
        attributes: [
          "id",
          "title",
          "organisation",
          "type",
          "location",
          "country",
          "deadline",
          "trustLabel",
          "applicationUrl",
        ],
      },
      {
        model: ApplicationStage,
        as: "stages",
        order: [["sortOrder", "ASC"]],
      },
    ],
  });

  if (!application) {
    throw new ApiError(404, "NOT_FOUND", "Application not found");
  }

  return application;
}

// ─── Update Application (F3) ────────────────────────────────────
export async function updateApplication(applicationId, userId, data) {
  const application = await Application.findOne({
    where: { id: applicationId, userId },
  });

  if (!application) {
    throw new ApiError(404, "NOT_FOUND", "Application not found");
  }

  const allowedFields = ["applicationDate", "applicationUrl", "notes"];
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      application[field] = data[field];
    }
  }

  await application.save();
  return getApplicationById(application.id, userId);
}

// ─── Add Stage (F4) ─────────────────────────────────────────────
export async function addStage(applicationId, userId, data) {
  const application = await Application.findOne({
    where: { id: applicationId, userId },
  });

  if (!application) {
    throw new ApiError(404, "NOT_FOUND", "Application not found");
  }

  if (application.status === "CLOSED") {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Cannot add stages to a closed application. Record a new outcome first if needed.",
    );
  }

  // Get the next sort order
  const lastStage = await ApplicationStage.findOne({
    where: { applicationId },
    order: [["sortOrder", "DESC"]],
  });
  const nextOrder = (lastStage?.sortOrder || 0) + 1;

  const stage = await ApplicationStage.create({
    applicationId,
    stageType: data.stageType,
    status: data.status || "PLANNED",
    scheduledDate: data.scheduledDate || null,
    completionDate: data.completionDate || null,
    assessmentArea: data.assessmentArea || null,
    notes: data.notes || null,
    sortOrder: nextOrder,
  });

  // Update the application's currentStage if this new stage is further along
  const newStageOrder = STAGE_ORDER[data.stageType] || 0;
  const currentOrder = STAGE_ORDER[application.currentStage] || 0;
  if (newStageOrder > currentOrder) {
    application.currentStage = data.stageType;
    await application.save();
  }

  return getApplicationById(applicationId, userId);
}

// ─── Update Stage (F4) ──────────────────────────────────────────
export async function updateStage(applicationId, stageId, userId, data) {
  const application = await Application.findOne({
    where: { id: applicationId, userId },
  });

  if (!application) {
    throw new ApiError(404, "NOT_FOUND", "Application not found");
  }

  const stage = await ApplicationStage.findOne({
    where: { id: stageId, applicationId },
  });

  if (!stage) {
    throw new ApiError(404, "NOT_FOUND", "Stage not found");
  }

  const allowedFields = [
    "status",
    "scheduledDate",
    "completionDate",
    "assessmentArea",
    "notes",
  ];
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      stage[field] = data[field];
    }
  }

  await stage.save();
  return getApplicationById(applicationId, userId);
}

// ─── Record Outcome (F5) ────────────────────────────────────────
export async function recordOutcome(applicationId, userId, data) {
  const application = await Application.findOne({
    where: { id: applicationId, userId },
  });

  if (!application) {
    throw new ApiError(404, "NOT_FOUND", "Application not found");
  }

  application.outcomeType = data.outcomeType;
  application.outcomeDate = data.outcomeDate;
  application.outcomeNotes = data.outcomeNotes || null;
  application.currentStage = "OUTCOME";
  application.status = "CLOSED";

  await application.save();
  return getApplicationById(applicationId, userId);
}
