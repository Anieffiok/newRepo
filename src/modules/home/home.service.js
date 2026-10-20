import { Op } from "sequelize";
import {
  Action,
  Opportunity,
  Application,
  ReadinessResult,
  ReadinessItem,
  Profile,
} from "../../database/models/index.js";
import ApiError from "../../utils/ApiError.js";

// ─── Generate Actions from Readiness Gaps ─────────────────────────
export async function syncReadinessActions(userId) {
  // Find all readiness results with pending items
  const readinessResults = await ReadinessResult.findAll({
    where: { userId },
    include: [
      {
        model: ReadinessItem,
        as: "items",
        where: { status: "PENDING" },
        required: true,
      },
      {
        model: Opportunity,
        as: "opportunity",
        attributes: ["id", "title", "deadline"],
      },
    ],
  });

  let created = 0;

  for (const result of readinessResults) {
    for (const item of result.items) {
      // Check if an action already exists for this readiness item
      const existing = await Action.findOne({
        where: {
          userId,
          sourceType: "READINESS",
          sourceId: item.id,
          status: "OPEN",
        },
      });

      if (!existing) {
        const oppTitle = result.opportunity?.title || "this opportunity";
        await Action.create({
          userId,
          title: item.title,
          reason: `${item.description} (from readiness check for ${oppTitle})`,
          priority: item.priority,
          status: "OPEN",
          dueDate: result.opportunity?.deadline || null,
          sourceType: "READINESS",
          sourceId: item.id,
        });
        created++;
      }
    }
  }

  return created;
}

// ─── Generate Actions from Application Deadlines ──────────────────
export async function syncDeadlineActions(userId) {
  // Find active applications linked to opportunities with upcoming deadlines
  const applications = await Application.findAll({
    where: { userId, status: "ACTIVE" },
    include: [
      {
        model: Opportunity,
        as: "opportunity",
        where: {
          deadline: {
            [Op.gte]: new Date(),
            [Op.lte]: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        },
        attributes: ["id", "title", "organisation", "deadline"],
      },
    ],
  });

  let created = 0;

  for (const app of applications) {
    const opp = app.opportunity;
    if (!opp?.deadline) continue;

    const existing = await Action.findOne({
      where: {
        userId,
        sourceType: "DEADLINE",
        sourceId: opp.id,
        status: "OPEN",
      },
    });

    if (!existing) {
      const deadlineDate = new Date(opp.deadline);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

      await Action.create({
        userId,
        title: `Follow up on ${opp.title} at ${opp.organisation}`,
        reason: `Deadline is in ${daysLeft} day(s). Make sure your application is on track.`,
        priority: daysLeft <= 7 ? "HIGH" : "MEDIUM",
        status: "OPEN",
        dueDate: opp.deadline,
        sourceType: "DEADLINE",
        sourceId: opp.id,
      });
      created++;
    }
  }

  // Also check saved opportunities with approaching deadlines
  const savedOpps = await Opportunity.findAll({
    where: {
      deadline: {
        [Op.gte]: new Date(),
        [Op.lte]: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      },
      status: { [Op.ne]: "EXPIRED" },
    },
    attributes: ["id", "title", "organisation", "deadline"],
    limit: 10,
  });

  for (const opp of savedOpps) {
    const existing = await Action.findOne({
      where: {
        userId,
        sourceType: "DEADLINE",
        sourceId: opp.id,
        status: "OPEN",
      },
    });

    if (!existing) {
      const deadlineDate = new Date(opp.deadline);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

      await Action.create({
        userId,
        title: `Apply to ${opp.title} before deadline`,
        reason: `${opp.organisation} deadline is in ${daysLeft} day(s).`,
        priority: daysLeft <= 3 ? "HIGH" : daysLeft <= 7 ? "MEDIUM" : "LOW",
        status: "OPEN",
        dueDate: opp.deadline,
        sourceType: "DEADLINE",
        sourceId: opp.id,
      });
      created++;
    }
  }

  return created;
}

// ─── Sync All Actions (called by cron and on Home load) ───────────
export async function syncAllActions(userId) {
  const [readinessCount, deadlineCount] = await Promise.all([
    syncReadinessActions(userId),
    syncDeadlineActions(userId),
  ]);

  return readinessCount + deadlineCount;
}

// ─── Get Home Dashboard (C1) ──────────────────────────────────────
export async function getHomeDashboard(userId) {
  // Sync actions first so the dashboard is fresh
  await syncAllActions(userId);

  // 1. Top 3 next actions
  const nextActions = await Action.findAll({
    where: { userId, status: "OPEN" },
    order: [
      ["dueDate", "ASC"],
      ["createdAt", "DESC"],
    ],
    limit: 20,
  });

  const priorityOrder = {
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  nextActions.sort((a, b) => {
    const aPriority = priorityOrder[a.priority] ?? 99;
    const bPriority = priorityOrder[b.priority] ?? 99;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }

    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const topThreeActions = nextActions.slice(0, 3);

  // 2. Upcoming deadlines (opportunities closing in next 30 days)
  const now = new Date();
  const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const upcomingDeadlines = await Opportunity.findAll({
    where: {
      deadline: { [Op.gte]: now, [Op.lte]: thirtyDays },
      status: { [Op.in]: ["ACTIVE", "CLOSING_SOON"] },
    },
    attributes: [
      "id",
      "title",
      "organisation",
      "deadline",
      "trustLabel",
      "type",
    ],
    order: [["deadline", "ASC"]],
    limit: 5,
  });

  // Calculate days remaining for each
  const deadlinesWithDays = upcomingDeadlines.map((opp) => {
    const deadlineDate = new Date(opp.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    return { ...opp.toJSON(), daysRemaining: daysLeft };
  });

  // 3. Recommended opportunities (rule-based for now, AI later)
  const profile = await Profile.findOne({ where: { userId } });
  const recommendedWhere = {
    status: { [Op.in]: ["ACTIVE", "CLOSING_SOON"] },
  };

  if (profile?.country) {
    recommendedWhere.country = profile.country;
  }
  if (profile?.careerLevel) {
    recommendedWhere.careerLevel = { [Op.in]: [profile.careerLevel, null] };
  }

  const recommendedOpportunities = await Opportunity.findAll({
    where: recommendedWhere,
    attributes: [
      "id",
      "title",
      "organisation",
      "type",
      "location",
      "deadline",
      "trustLabel",
      "workMode",
    ],
    order: [["deadline", "ASC"]],
    limit: 5,
  });

  // 4. Profile completion (simple check)
  const profileComplete = profile?.completionStatus === "COMPLETE";

  return {
    nextActions: topThreeActions,
    upcomingDeadlines: deadlinesWithDays,
    recommendedOpportunities,
    profileComplete,
    greeting: `Welcome back!`,
  };
}

// ─── List All Actions (G3) ────────────────────────────────────────
export async function listActions(userId, query) {
  const where = { userId };

  if (query.status && query.status !== "ALL") {
    where.status = query.status;
  } else {
    // Default: show open actions
    if (!query.status) where.status = "OPEN";
  }

  if (query.priority) {
    where.priority = query.priority;
  }

  const actions = await Action.findAll({
    where,
    order: [
      ["priority", "ASC"],
      ["dueDate", "ASC"],
      ["createdAt", "DESC"],
    ],
  });

  // Group by urgency
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const grouped = {
    today: [],
    thisWeek: [],
    later: [],
  };

  for (const action of actions) {
    if (!action.dueDate) {
      grouped.later.push(action);
    } else {
      const due = new Date(action.dueDate);
      if (due <= today) grouped.today.push(action);
      else if (due <= weekFromNow) grouped.thisWeek.push(action);
      else grouped.later.push(action);
    }
  }

  return grouped;
}

// ─── Update Action Status ─────────────────────────────────────────
export async function updateAction(userId, actionId, status) {
  const action = await Action.findOne({
    where: { id: actionId, userId },
  });

  if (!action) {
    throw new ApiError(404, "NOT_FOUND", "Action not found");
  }

  action.status = status;
  await action.save();

  return action;
}
