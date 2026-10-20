import {
  Profile,
  User,
  Education,
  Skill,
  Experience,
  Certification,
  CareerGoal,
  Interest,
} from "../../database/models/index.js";
import ApiError from "../../utils/ApiError.js";

/**
 * Calculates profile completion status:
 * Required for COMPLETE:
 *  1. Target Role (Career Goal with targetRole)
 *  2. Education (at least 1 entry with institution, qualification, fieldOfStudy)
 *  3. Career Level (profile.careerLevel is set)
 */
function calculateProfileCompletion(data) {
  const {
    profile,
    education,
    careerGoals,
    skills,
    experiences,
    certifications,
    interests,
  } = data;
  const missingSteps = [];
  let score = 0;

  // 1. Target Role (Screen B1) - 35 points
  const hasTargetRole = Boolean(
    careerGoals && careerGoals.some((g) => g.targetRole?.trim()),
  );
  if (hasTargetRole) {
    score += 35;
  } else {
    missingSteps.push("Set your target role (Career Goals)");
  }

  // 2. Education (Screen B2) - 35 points
  const hasValidEducation = Boolean(
    education &&
    education.some(
      (e) =>
        e.institution?.trim() &&
        e.qualification?.trim() &&
        e.fieldOfStudy?.trim(),
    ),
  );

  if (hasValidEducation) {
    score += 35;
  } else {
    missingSteps.push(
      "Add your educational background (Institution, Degree, Field of Study)",
    );
  }

  // 3. Career Level (Screen B3) - 30 points
  const hasCareerLevel = Boolean(profile.careerLevel);
  if (hasCareerLevel) {
    score += 30;
  } else {
    missingSteps.push("Select your career level");
  }

  // Core onboarding is complete if all 3 required pillars are present
  const isCoreComplete = hasTargetRole && hasValidEducation && hasCareerLevel;

  return {
    percentage: score, // 0 - 100 based on the 3 core onboarding steps
    status: isCoreComplete ? "COMPLETE" : "INCOMPLETE",
    missingSteps,
  };
}

/**
 * Fetch complete aggregated career profile for a user
 */
export async function getProfileByUserId(userId) {
  // Fetch user and profile
  const profile = await Profile.findOne({
    where: { userId },
    include: [
      {
        model: User,
        as: "user",
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
          "accountStatus",
          "emailVerified",
          "createdAt",
        ],
      },
    ],
  });

  if (!profile) {
    throw new ApiError(404, "NOT_FOUND", "Profile not found");
  }

  // Execute queries in parallel for high performance
  const [
    education,
    experiences,
    certifications,
    careerGoals,
    userWithSkills,
    userWithInterests,
  ] = await Promise.all([
    Education.findAll({
      where: { userId },
      order: [["startDate", "DESC NULLS LAST"]],
    }),
    Experience.findAll({
      where: { userId },
      order: [["startDate", "DESC NULLS LAST"]],
    }),
    Certification.findAll({
      where: { userId },
      order: [["issueDate", "DESC NULLS LAST"]],
    }),
    CareerGoal.findAll({ where: { userId }, order: [["createdAt", "DESC"]] }),
    User.findByPk(userId, {
      include: [
        {
          model: Skill,
          as: "skills",
          through: { attributes: ["proficiency", "evidence"] },
        },
      ],
    }),
    User.findByPk(userId, {
      include: [
        {
          model: Interest,
          as: "interests",
          through: { attributes: [] },
        },
      ],
    }),
  ]);

  const skills = userWithSkills?.skills || [];
  const interests = userWithInterests?.interests || [];

  const completion = calculateProfileCompletion({
    profile,
    education,
    skills,
    experiences,
    certifications,
    careerGoals,
    interests,
  });

  // Sync completionStatus column on the profile table
  if (profile.completionStatus !== completion.status) {
    profile.completionStatus = completion.status;
    await profile.save();
  }

  return {
    profile,
    education,
    skills,
    experiences,
    certifications,
    careerGoals,
    interests,
    completion,
  };
}

/**
 * Update core profile fields
 */
export async function updateProfile(userId, updateData) {
  const profile = await Profile.findOne({ where: { userId } });

  if (!profile) {
    throw new ApiError(404, "NOT_FOUND", "Profile not found");
  }

  const allowedFields = [
    "headline",
    "location",
    "country",
    "careerLevel",
    "biography",
  ];
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      profile[field] = updateData[field];
    }
  }

  await profile.save();

  // Return the refreshed aggregate profile
  return getProfileByUserId(userId);
}
