// src/modules/eligibility/eligibility.rules.js
// Rules engine — compares user profile data against opportunity requirements.
// This determines the result. AI (when available) only writes the reason text.

/**
 * Build a profile snapshot from all the user's data.
 * This is what we compare against requirements.
 */
export function buildProfileSnapshot(
  profile,
  education,
  skills,
  experiences,
  certifications,
) {
  return {
    careerLevel: profile?.careerLevel || null,
    country: profile?.country || null,
    location: profile?.location || null,
    headline: profile?.headline || null,

    // Highest qualification (first education record, sorted by end date desc)
    highestQualification:
      education.length > 0 ? education[0].qualification : null,
    fieldOfStudy: education.length > 0 ? education[0].fieldOfStudy : null,
    institution: education.length > 0 ? education[0].institution : null,
    hasEducation: education.length > 0,

    // Skills as a flat array of lowercase names
    skillNames: skills.map(
      (s) => s.Skill?.name?.toLowerCase() || s.name?.toLowerCase() || "",
    ),

    // Total experience in months (rough estimate)
    totalExperienceMonths: experiences.reduce((total, exp) => {
      if (exp.isCurrent) return total + 12; // Assume 1 year for current roles
      if (exp.startDate && exp.endDate) {
        const start = new Date(exp.startDate);
        const end = new Date(exp.endDate);
        const months =
          (end.getFullYear() - start.getFullYear()) * 12 +
          (end.getMonth() - start.getMonth());
        return total + Math.max(months, 0);
      }
      return total;
    }, 0),
    hasExperience: experiences.length > 0,

    // Certification names as lowercase array
    certNames: certifications.map((c) => c.name?.toLowerCase() || ""),
    hasCertifications: certifications.length > 0,
  };
}

/**
 * Evaluate a single requirement against the profile snapshot.
 * Returns { result, reason, userInfoUsed }
 */
export function evaluateRequirement(requirement, profile) {
  const { type, description, isRequired, acceptsAnyDiscipline } = requirement;
  const descLower = description.toLowerCase();

  switch (type) {
    case "DEGREE":
      return evaluateDegree(descLower, profile);
    case "DISCIPLINE":
      return evaluateDiscipline(descLower, acceptsAnyDiscipline, profile);
    case "SKILLS":
      return evaluateSkills(descLower, profile);
    case "EXPERIENCE":
      return evaluateExperience(descLower, profile);
    case "CERTIFICATIONS":
      return evaluateCertifications(descLower, profile);
    case "LOCATION":
      return evaluateLocation(descLower, profile);
    case "OTHER":
      return evaluateOther(descLower, profile);
    default:
      return {
        result: "INFORMATION_NEEDED",
        reason:
          "This requirement type is not yet supported for automatic checking.",
        userInfoUsed: null,
      };
  }
}

// ─── Individual Evaluators ────────────────────────────────────────

function evaluateDegree(descLower, profile) {
  if (!profile.hasEducation) {
    return {
      result: "INFORMATION_NEEDED",
      reason:
        "Add your education to your profile so we can check this requirement.",
      userInfoUsed: null,
    };
  }

  const qual = profile.highestQualification.toLowerCase();
  const userInfo = `Degree: ${profile.highestQualification}, ${profile.fieldOfStudy}`;

  // Check for degree level keywords
  const wantsPhd = descLower.includes("phd") || descLower.includes("doctorate");
  const wantsMasters =
    descLower.includes("master") ||
    descLower.includes("msc") ||
    descLower.includes("mba");
  const wantsBachelors =
    descLower.includes("bachelor") ||
    descLower.includes("bsc") ||
    descLower.includes("beng") ||
    descLower.includes("ba");
  const wantsDiploma =
    descLower.includes("diploma") ||
    descLower.includes("hnd") ||
    descLower.includes("nd");

  const hasPhd = qual.includes("phd") || qual.includes("doctorate");
  const hasMasters =
    qual.includes("master") || qual.includes("msc") || qual.includes("mba");
  const hasBachelors =
    qual.includes("bachelor") ||
    qual.includes("bsc") ||
    qual.includes("beng") ||
    qual.includes("ba") ||
    qual.includes("b.tech");
  const hasDiploma =
    qual.includes("diploma") ||
    qual.includes("hnd") ||
    qual.includes("nd") ||
    qual.includes("certificate");

  // Higher degrees satisfy lower requirements
  if (wantsPhd && hasPhd)
    return {
      result: "SATISFIED",
      reason: `You have a doctoral degree.`,
      userInfoUsed: userInfo,
    };
  if (wantsMasters && (hasMasters || hasPhd))
    return {
      result: "SATISFIED",
      reason: `You have a master's degree or higher.`,
      userInfoUsed: userInfo,
    };
  if (wantsBachelors && (hasBachelors || hasMasters || hasPhd))
    return {
      result: "SATISFIED",
      reason: `You have a bachelor's degree or higher.`,
      userInfoUsed: userInfo,
    };
  if (wantsDiploma && (hasDiploma || hasBachelors || hasMasters || hasPhd))
    return {
      result: "SATISFIED",
      reason: `You have a qualification that meets this requirement.`,
      userInfoUsed: userInfo,
    };

  // Generic "degree" mention without specific level
  if (!wantsPhd && !wantsMasters && !wantsBachelors && !wantsDiploma) {
    if (profile.hasEducation)
      return {
        result: "SATISFIED",
        reason: `You have a ${profile.highestQualification}.`,
        userInfoUsed: userInfo,
      };
  }

  return {
    result: "NOT_SATISFIED",
    reason: `This opportunity requires ${description}, but your highest qualification is ${profile.highestQualification}.`,
    userInfoUsed: userInfo,
  };
}

function evaluateDiscipline(descLower, acceptsAnyDiscipline, profile) {
  // THE ANY-DISCIPLINE RULE: if the employer says "any discipline,"
  // the user's degree is NEVER a blocker. Period.
  if (acceptsAnyDiscipline) {
    return {
      result: "NOT_APPLICABLE",
      reason:
        "This programme accepts applicants from any discipline, so your degree is not a barrier.",
      userInfoUsed: profile.fieldOfStudy
        ? `Field of study: ${profile.fieldOfStudy}`
        : null,
    };
  }

  if (!profile.hasEducation) {
    return {
      result: "INFORMATION_NEEDED",
      reason:
        "Add your field of study to your profile so we can check this requirement.",
      userInfoUsed: null,
    };
  }

  const field = profile.fieldOfStudy.toLowerCase();
  const userInfo = `Field of study: ${profile.fieldOfStudy}`;

  // Extract discipline keywords from the requirement description
  // e.g., "Engineering, Sciences, or related field" → ["engineering", "science"]
  const keywords = descLower
    .replace(/[,;]|\bor\b|\band\b/g, " ")
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 3 &&
        ![
          "related",
          "field",
          "degree",
          "must",
          "have",
          "with",
          "from",
          "that",
          "this",
          "accepted",
          "required",
        ].includes(w),
    );

  const matches = keywords.some(
    (kw) => field.includes(kw) || kw.includes(field),
  );

  if (matches) {
    return {
      result: "SATISFIED",
      reason: `Your field of study (${profile.fieldOfStudy}) matches this requirement.`,
      userInfoUsed: userInfo,
    };
  }

  // If we can't confidently match, flag as potential gap rather than hard rejection
  return {
    result: "POTENTIAL_GAP",
    reason: `This opportunity mentions "${description}" but your field of study is ${profile.fieldOfStudy}. You may still be eligible — check the full requirements.`,
    userInfoUsed: userInfo,
  };
}

function evaluateSkills(descLower, profile) {
  if (profile.skillNames.length === 0) {
    return {
      result: "INFORMATION_NEEDED",
      reason:
        "Add your skills to your profile so we can check this requirement.",
      userInfoUsed: null,
    };
  }

  // Extract skill keywords from the requirement
  // e.g., "SQL, Excel, and a BI tool (Tableau or Power BI)" → ["sql", "excel", "tableau", "power bi"]
  const requiredSkills = descLower
    .replace(/[(),]/g, " ")
    .split(/\s+and\s+|\s+or\s+|,\s*/)
    .map((s) => s.trim())
    .filter(
      (s) =>
        s.length > 1 &&
        ![
          "a",
          "an",
          "the",
          "and",
          "or",
          "with",
          "proficiency",
          "in",
          "knowledge",
          "of",
          "experience",
          "tool",
          "tools",
        ].includes(s),
    );

  const matchedSkills = requiredSkills.filter((rs) =>
    profile.skillNames.some((us) => us.includes(rs) || rs.includes(us)),
  );

  const userInfo = `Skills: ${profile.skillNames.join(", ")}`;

  if (matchedSkills.length === requiredSkills.length) {
    return {
      result: "SATISFIED",
      reason: `You have all the required skills: ${matchedSkills.join(", ")}.`,
      userInfoUsed: userInfo,
    };
  }

  if (matchedSkills.length > 0) {
    const missing = requiredSkills.filter((rs) => !matchedSkills.includes(rs));
    return {
      result: "POTENTIAL_GAP",
      reason: `You have ${matchedSkills.join(", ")}, but ${missing.join(", ")} was not found on your profile.`,
      userInfoUsed: userInfo,
    };
  }

  return {
    result: "NOT_SATISFIED",
    reason: `The required skills (${requiredSkills.join(", ")}) were not found on your profile.`,
    userInfoUsed: userInfo,
  };
}

function evaluateExperience(descLower, profile) {
  if (!profile.hasExperience) {
    // Check if the requirement says "no experience required" or "0 years"
    if (
      descLower.includes("no experience") ||
      descLower.includes("0 year") ||
      descLower.includes("0-") ||
      descLower.includes("0 –")
    ) {
      return {
        result: "SATISFIED",
        reason: "No prior work experience is required for this opportunity.",
        userInfoUsed: "No experience listed",
      };
    }
    return {
      result: "INFORMATION_NEEDED",
      reason:
        "Add your work experience to your profile so we can check this requirement.",
      userInfoUsed: null,
    };
  }

  const years = Math.floor(profile.totalExperienceMonths / 12);
  const months = profile.totalExperienceMonths;
  const userInfo = `Experience: ${years} year(s) ${months % 12} month(s) total`;

  // Try to extract a max years number from the description
  // e.g., "0–2 years" → 2, "3–5 years" → 5, "2+ years" → 2 (minimum)
  const yearMatch = descLower.match(/(\d+)\s*[–\-to]+\s*(\d+)\s*year/);
  const minMatch = descLower.match(/(\d+)\+?\s*year/);

  if (yearMatch) {
    const maxYears = parseInt(yearMatch[2], 10);
    if (years <= maxYears) {
      return {
        result: "SATISFIED",
        reason: `Your experience (${years} years) falls within the required range.`,
        userInfoUsed: userInfo,
      };
    }
    return {
      result: "POTENTIAL_GAP",
      reason: `This opportunity asks for up to ${maxYears} years of experience. You have ${years} years.`,
      userInfoUsed: userInfo,
    };
  }

  if (minMatch) {
    const minYears = parseInt(minMatch[1], 10);
    if (years >= minYears) {
      return {
        result: "SATISFIED",
        reason: `You have ${years} years of experience, which meets the minimum of ${minYears} years.`,
        userInfoUsed: userInfo,
      };
    }
    return {
      result: "POTENTIAL_GAP",
      reason: `This opportunity requires at least ${minYears} years of experience. You have ${years} years.`,
      userInfoUsed: userInfo,
    };
  }

  // Generic experience requirement with no specific years
  return {
    result: "SATISFIED",
    reason: `You have ${years} years of work experience.`,
    userInfoUsed: userInfo,
  };
}

function evaluateCertifications(descLower, profile) {
  if (profile.certNames.length === 0) {
    return {
      result: "INFORMATION_NEEDED",
      reason:
        "Add your certifications to your profile so we can check this requirement.",
      userInfoUsed: null,
    };
  }

  const userInfo = `Certifications: ${profile.certNames.join(", ")}`;

  // Check if any certification name matches keywords in the requirement
  const keywords = descLower.split(/\s+/).filter((w) => w.length > 3);
  const matches = profile.certNames.some((cert) =>
    keywords.some((kw) => cert.includes(kw) || kw.includes(cert)),
  );

  if (matches) {
    return {
      result: "SATISFIED",
      reason: `A matching certification was found on your profile.`,
      userInfoUsed: userInfo,
    };
  }

  return {
    result: "NOT_SATISFIED",
    reason: `No certification matching "${description}" was found on your profile.`,
    userInfoUsed: userInfo,
  };
}

function evaluateLocation(descLower, profile) {
  if (!profile.country && !profile.location) {
    return {
      result: "INFORMATION_NEEDED",
      reason:
        "Add your location to your profile so we can check this requirement.",
      userInfoUsed: null,
    };
  }

  const userLocation =
    `${profile.location || ""} ${profile.country || ""}`.toLowerCase();
  const userInfo =
    `Location: ${profile.location || ""}, ${profile.country || ""}`.trim();

  // Check if the requirement mentions remote
  if (
    descLower.includes("remote") ||
    descLower.includes("anywhere") ||
    descLower.includes("worldwide")
  ) {
    return {
      result: "SATISFIED",
      reason: "This opportunity is open to remote applicants.",
      userInfoUsed: userInfo,
    };
  }

  // Check if user's country/location appears in the requirement
  const locationKeywords = descLower.split(/\s+/).filter((w) => w.length > 2);
  const matches = locationKeywords.some((kw) => userLocation.includes(kw));

  if (matches) {
    return {
      result: "SATISFIED",
      reason: `Your location matches this requirement.`,
      userInfoUsed: userInfo,
    };
  }

  return {
    result: "POTENTIAL_GAP",
    reason: `This opportunity mentions "${description}" but your location is ${userInfo}. Check if remote work is available.`,
    userInfoUsed: userInfo,
  };
}

function evaluateOther(descLower, profile) {
  // "Other" requirements are too varied to automate reliably.
  // Always flag as Information Needed so the user can self-assess.
  return {
    result: "INFORMATION_NEEDED",
    reason: `This requirement needs manual review: "${description}". Check the full opportunity details to see if you qualify.`,
    userInfoUsed: null,
  };
}

/**
 * Determine the overall match label from the individual item results.
 * NO percentages. Labels only.
 */
export function determineMatchLabel(items, requirements) {
  const requiredItems = items.filter((item) => {
    const req = requirements.find((r) => r.id === item.requirementId);
    return req?.isRequired;
  });

  const total = requiredItems.length;
  if (total === 0)
    return {
      label: "UNABLE_TO_DETERMINE",
      summary: "No required criteria to evaluate.",
    };

  const satisfied = requiredItems.filter(
    (i) => i.result === "SATISFIED" || i.result === "NOT_APPLICABLE",
  ).length;
  const gaps = requiredItems.filter((i) => i.result === "POTENTIAL_GAP").length;
  const notSatisfied = requiredItems.filter(
    (i) => i.result === "NOT_SATISFIED",
  ).length;
  const infoNeeded = requiredItems.filter(
    (i) => i.result === "INFORMATION_NEEDED",
  ).length;

  // If more than half the required items need info, we can't determine
  if (infoNeeded > total / 2) {
    return {
      label: "UNABLE_TO_DETERMINE",
      summary: `We need more information about your profile to give a complete result. ${infoNeeded} of ${total} requirements could not be checked.`,
    };
  }

  if (notSatisfied >= 2) {
    return {
      label: "NOT_ELIGIBLE",
      summary: `You don't currently meet ${notSatisfied} requirements, but you can still apply. Here's what could improve your chances.`,
    };
  }

  if (notSatisfied === 1 || gaps >= 2) {
    const issueCount = notSatisfied + gaps;
    return {
      label: "NEEDS_PREPARATION",
      summary: `You meet most requirements but have ${issueCount} area(s) to address before you're fully ready.`,
    };
  }

  if (gaps === 1 && notSatisfied === 0) {
    return {
      label: "GOOD_MATCH",
      summary: `You're a good fit for this opportunity with one area that could be stronger.`,
    };
  }

  if (satisfied === total) {
    return {
      label: "STRONG_MATCH",
      summary: `You meet all the required criteria for this opportunity.`,
    };
  }

  return {
    label: "GOOD_MATCH",
    summary: `You meet most of the requirements for this opportunity.`,
  };
}
