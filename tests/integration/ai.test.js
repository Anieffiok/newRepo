import aiService from "../../src/modules/ai/ai.service.js";
import aiConfig from "../../src/config/ai.js";

describe("AIService", () => {
  const originalEnabled = Object.getOwnPropertyDescriptor(aiConfig, "enabled");

  beforeEach(() => {
    Object.defineProperty(aiConfig, "enabled", {
      configurable: true,
      get: () => false,
    });
  });

  afterEach(() => {
    if (originalEnabled) {
      Object.defineProperty(aiConfig, "enabled", originalEnabled);
    }
  });

  it("normalizes opportunity data with safe defaults", () => {
    const normalized = aiService.normalizeOpportunity({});

    expect(normalized).toEqual({
      title: "Opportunity",
      organisation: "Unknown organisation",
      type: "Unknown type",
      deadline: "Not stated",
      requirements: [],
    });
  });

  it("normalizes user profile data with safe defaults", () => {
    const normalized = aiService.normalizeUserProfile({});

    expect(normalized).toEqual({
      degree: "Not provided",
      discipline: "Not provided",
      skills: [],
      experienceYears: 0,
      country: "Not provided",
      careerLevel: "Not specified",
      fieldOfStudy: "Not provided",
      institution: "Not provided",
    });
  });

  it("returns null for all AI generation methods when AI is disabled", async () => {
    const results = await Promise.all([
      aiService.interpretEligibility(
        { title: "Data Analyst" },
        { degree: "B.Sc" },
        { overallMatch: "Strong fit" },
      ),
      aiService.generateReadinessGuidance(["Need SQL"], { degree: "B.Sc" }),
      aiService.explainOpportunityMatch(
        { title: "Data Analyst" },
        { degree: "B.Sc" },
      ),
      aiService.generatePracticeQuestions(
        { title: "Data Analyst" },
        { degree: "B.Sc" },
      ),
      aiService.suggestLearningResources(["Need SQL"], { degree: "B.Sc" }),
    ]);

    expect(results).toEqual([null, null, null, null, null]);
  });
});
