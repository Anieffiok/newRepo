import {
  ReadinessResult,
  ReadinessItem,
  PracticeSession,
  UserLearning,
  LearningResource,
  Opportunity,
  Document,
} from "../../database/models/index.js";
import ApiError from "../../utils/ApiError.js";

/**
 * Build a unified preparation checklist for a specific opportunity.
 * Aggregates readiness items, practice sessions, and learning progress.
 */
export async function getChecklist(userId, opportunityId) {
  // Verify the opportunity exists
  const opportunity = await Opportunity.findByPk(opportunityId, {
    attributes: [
      "id",
      "title",
      "organisation",
      "deadline",
      "type",
      "trustLabel",
    ],
  });

  if (!opportunity) {
    throw new ApiError(404, "NOT_FOUND", "Opportunity not found");
  }

  // 1. Readiness items (from E1)
  const readiness = await ReadinessResult.findOne({
    where: { userId, opportunityId },
    include: [
      {
        model: ReadinessItem,
        as: "items",
        order: [
          ["priority", "ASC"],
          ["status", "ASC"],
        ],
      },
    ],
  });

  const readinessItems = readiness
    ? readiness.items.map((item) => ({
        id: item.id,
        source: "READINESS",
        itemType: item.itemType,
        title: item.title,
        description: item.description,
        priority: item.priority,
        status: item.status,
        profileSection: item.profileSection,
      }))
    : [];

  // 2. Practice sessions (from E3)
  const practiceSessions = await PracticeSession.findAll({
    where: { userId, opportunityId },
    attributes: ["id", "status", "questions", "created_at"],
  });

  const practiceItems = practiceSessions.map((session) => ({
    id: session.id,
    source: "PRACTICE",
    itemType: "ASSESSMENT",
    title: `Practise interview questions (${session.questions.length} questions)`,
    description: `Practice session for ${opportunity.title}. Status: ${session.status}.`,
    priority: "MEDIUM",
    status: session.status === "COMPLETED" ? "DONE" : "PENDING",
    profileSection: null,
  }));

  // 3. Learning resources linked to this opportunity's skill gaps
  // We get the user's saved learning resources and include them
  const savedLearning = await UserLearning.findAll({
    where: { userId },
    include: [
      {
        model: LearningResource,
        as: "resource",
        attributes: [
          "id",
          "title",
          "provider",
          "skillCategory",
          "difficulty",
          "isFree",
        ],
      },
    ],
    order: [["created_at", "DESC"]],
    limit: 5,
  });

  const learningItems = savedLearning.map((learning) => ({
    id: learning.id,
    source: "LEARNING",
    itemType: "SKILL",
    title: learning.resource?.title || "Learning resource",
    description: `${learning.resource?.provider || "Unknown provider"} — ${learning.resource?.skillCategory || "General"}`,
    priority: "MEDIUM",
    status: learning.status === "COMPLETED" ? "DONE" : "PENDING",
    profileSection: null,
  }));

  // 4. Document readiness check
  const documents = await Document.findAll({
    where: { userId },
    attributes: ["documentType"],
  });

  const hasCV = documents.some((d) => d.documentType === "CV");
  const documentItems = [
    {
      id: "doc-cv",
      source: "DOCUMENT",
      itemType: "DOCUMENT",
      title: "Upload your CV",
      description: "Most applications require an up-to-date CV.",
      priority: "HIGH",
      status: hasCV ? "DONE" : "PENDING",
      profileSection: "documents",
    },
  ];

  // 5. Combine all items
  const allItems = [
    ...readinessItems,
    ...practiceItems,
    ...learningItems,
    ...documentItems,
  ];

  // 6. Calculate summary stats
  const totalItems = allItems.length;
  const completedItems = allItems.filter((i) => i.status === "DONE").length;
  const pendingItems = totalItems - completedItems;

  // 7. Determine overall preparation state
  let overallState = "NOT_STARTED";
  if (totalItems === 0) {
    overallState = "READY";
  } else if (completedItems === totalItems) {
    overallState = "READY";
  } else if (completedItems > 0) {
    overallState = "IN_PROGRESS";
  }

  // 8. Calculate days remaining
  let daysRemaining = null;
  if (opportunity.deadline) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(opportunity.deadline);
    const diffMs = deadlineDate - now;
    daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  return {
    opportunity,
    overallState,
    summary: {
      totalItems,
      completedItems,
      pendingItems,
    },
    daysRemaining,
    items: allItems,
  };
}
