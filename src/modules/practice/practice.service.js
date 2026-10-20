import {
  PracticeSession,
  Opportunity,
  OpportunityRequirement,
  Profile,
  Education,
  UserSkill,
  Skill,
} from "../../database/models/index.js";
import ApiError from "../../utils/ApiError.js";
import aiService from "../ai/ai.service.js";

/**
 * Generate practice questions for an opportunity.
 * Creates a new session or returns the existing one for the same opportunity.
 */
export async function generatePractice(userId, opportunityId) {
  // Verify the opportunity exists
  const opportunity = await Opportunity.findByPk(opportunityId, {
    include: [
      {
        model: OpportunityRequirement,
        as: "requirements",
        attributes: ["type", "description"],
      },
    ],
  });

  if (!opportunity) {
    throw new ApiError(404, "NOT_FOUND", "Opportunity not found");
  }

  // Check for existing session for this opportunity
  const existing = await PracticeSession.findOne({
    where: { userId, opportunityId },
    include: [
      {
        model: Opportunity,
        as: "opportunity",
        attributes: ["id", "title", "organisation"],
      },
    ],
  });

  if (existing) {
    return existing;
  }

  // Gather user profile for context
  const [profile, education, userSkills] = await Promise.all([
    Profile.findOne({ where: { userId } }),
    Education.findOne({
      where: { userId },
      order: [["endDate", "DESC NULLS LAST"]],
    }),
    UserSkill.findAll({
      where: { userId },
      include: [{ model: Skill, as: "skill", attributes: ["name"] }],
    }),
  ]);

  // Generate questions via AI
  const rawOutput = await aiService.generatePracticeQuestions(
    {
      title: opportunity.title,
      organization: opportunity.organisation,
      type: opportunity.type,
    },
    {
      degree: education?.degree || "Not provided",
      skills: userSkills.map((s) => s.skill?.name).filter(Boolean),
    },
  );

  // Parse the AI output into structured questions
  const questions = parseQuestions(rawOutput);

  // Create the session
  const session = await PracticeSession.create({
    userId,
    opportunityId,
    questions,
    status: "GENERATED",
  });

  // Return with opportunity details
  return PracticeSession.findByPk(session.id, {
    include: [
      {
        model: Opportunity,
        as: "opportunity",
        attributes: ["id", "title", "organisation"],
      },
    ],
  });
}

/**
 * List all practice sessions for a user.
 */
export async function listPracticeSessions(userId) {
  return PracticeSession.findAll({
    where: { userId },
    include: [
      {
        model: Opportunity,
        as: "opportunity",
        attributes: ["id", "title", "organisation", "type", "deadline"],
      },
    ],
    order: [["created_at", "DESC"]],
  });
}

/**
 * Get a single practice session with questions.
 */
export async function getPracticeSession(sessionId, userId) {
  const session = await PracticeSession.findOne({
    where: { id: sessionId, userId },
    include: [
      {
        model: Opportunity,
        as: "opportunity",
        attributes: ["id", "title", "organisation", "type"],
      },
    ],
  });

  if (!session) {
    throw new ApiError(404, "NOT_FOUND", "Practice session not found");
  }

  return session;
}

/**
 * Update session status (e.g., mark as in progress or completed).
 */
export async function updateSessionStatus(sessionId, userId, status) {
  const session = await PracticeSession.findOne({
    where: { id: sessionId, userId },
  });

  if (!session) {
    throw new ApiError(404, "NOT_FOUND", "Practice session not found");
  }

  session.status = status;
  await session.save();

  return getPracticeSession(sessionId, userId);
}

/**
 * Parse raw AI text output into a structured array of questions.
 * Handles numbered lists like "1. Question text" or "1) Question text".
 * Filters out conversational filler and non-question lines.
 */
function parseQuestions(rawOutput) {
  if (!rawOutput) {
    return getDefaultQuestions();
  }

  const lines = rawOutput
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const questions = [];

  for (const line of lines) {
    // Match numbered patterns: "1. ", "1) ", "1 - "
    const match = line.match(/^\d+[\.\)\-]\s*(.+)/);
    if (match) {
      const questionText = match[1].trim();
      // Must end with ? and be a reasonable length
      if (questionText.endsWith("?") && questionText.length > 10) {
        questions.push(questionText);
      }
    }
  }

  // If numbered parsing failed, try extracting any line ending with ?
  if (questions.length < 3) {
    questions.length = 0; // Reset
    for (const line of lines) {
      const cleaned = line
        .replace(/^\d+[\.\)\-]\s*/, "")
        .replace(/^[-•]\s*/, "")
        .trim();
      if (
        cleaned.endsWith("?") &&
        cleaned.length > 15 &&
        !cleaned.toLowerCase().includes("would you like") &&
        !cleaned.toLowerCase().includes("do you want") &&
        !cleaned.toLowerCase().includes("let me know") &&
        !cleaned.toLowerCase().includes("shall i")
      ) {
        questions.push(cleaned);
      }
    }
  }

  // Final fallback
  if (questions.length === 0) {
    return getDefaultQuestions();
  }

  return questions.slice(0, 5).map((text, index) => ({
    id: index + 1,
    text,
  }));
}

/**
 * Default fallback questions when AI is unavailable or output is unparseable.
 */
function getDefaultQuestions() {
  return [
    "Tell me about yourself and why you are interested in this role.",
    "What relevant experience or projects do you have for this position?",
    "Describe a challenging problem you solved and how you approached it.",
    "How do you stay updated with developments in your field?",
    "Where do you see your career in the next three to five years?",
  ].map((text, index) => ({ id: index + 1, text }));
}
