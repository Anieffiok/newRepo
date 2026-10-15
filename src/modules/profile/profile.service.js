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

const PROFILE_COMPLETION_WEIGHTS = {
  basicInfo: 25,
  education: 15,
  experience: 15,
  skills: 15,
  certifications: 10,
  careerGoals: 10,
  interests: 10,
};
const PROFILE_COMPLETION_THRESHOLD = 80;

/**
 * Calculates profile completion percentage and returns missing checklist items
 */
function calculateProfileCompletion(data) {
  let score = 0;
  const missingSteps = [];

  const {
    profile,
    education,
    skills,
    experiences,
    certifications,
    careerGoals,
    interests,
  } = data;

  // 1. Basic profile info (25%)
  const hasBasicInfo = Boolean(
    profile.headline?.trim() &&
    profile.location?.trim() &&
    profile.country?.trim() &&
    profile.biography?.trim(),
  );
  if (hasBasicInfo) {
    score += PROFILE_COMPLETION_WEIGHTS.basicInfo;
  } else {
    missingSteps.push(
      "Complete basic profile information (headline, location, country, biography)",
    );
  }

  // 2. Education (15%)
  if (education && education.length > 0) {
    score += PROFILE_COMPLETION_WEIGHTS.education;
  } else {
    missingSteps.push("Add at least one education record");
  }

  // 3. Experience (15%)
  if (experiences && experiences.length > 0) {
    score += PROFILE_COMPLETION_WEIGHTS.experience;
  } else {
    missingSteps.push("Add at least one work or project experience");
  }

  // 4. Skills (15%)
  if (skills && skills.length >= 3) {
    score += PROFILE_COMPLETION_WEIGHTS.skills;
  } else {
    missingSteps.push("Add at least 3 skills to your profile");
  }

  // 5. Certifications (10%)
  if (certifications && certifications.length > 0) {
    score += PROFILE_COMPLETION_WEIGHTS.certifications;
  } else {
    missingSteps.push("Add certifications or licenses");
  }

  // 6. Career Goals (10%)
  if (careerGoals && careerGoals.length > 0) {
    score += PROFILE_COMPLETION_WEIGHTS.careerGoals;
  } else {
    missingSteps.push("Set your target career goals");
  }

  // 7. Interests (10%)
  if (interests && interests.length >= 2) {
    score += PROFILE_COMPLETION_WEIGHTS.interests;
  } else {
    missingSteps.push("Select at least 2 career interests");
  }

  return {
    percentage: score,
    status:
      score >= PROFILE_COMPLETION_THRESHOLD ? "COMPLETE" : "INCOMPLETE",
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
