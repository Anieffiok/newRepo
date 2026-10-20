import { GoogleGenerativeAI } from "@google/generative-ai";
import aiConfig from "../../config/ai.js";
import logger from "../../config/logger.js";

class AIService {
  constructor() {
    this.client = null;
  }

  #getClient() {
    if (!aiConfig.enabled) return null;
    if (!this.client) {
      this.client = new GoogleGenerativeAI(aiConfig.apiKey);
    }
    return this.client;
  }

  normalizeOpportunity(opportunity = {}) {
    return {
      title: opportunity.title || "Opportunity",
      organisation:
        opportunity.organisation ||
        opportunity.organization ||
        "Unknown organisation",
      type: opportunity.type || "Unknown type",
      deadline:
        opportunity.deadline || opportunity.applicationDeadline || "Not stated",
      requirements: opportunity.requirements || [],
    };
  }

  normalizeUserProfile(userProfile = {}) {
    return {
      degree:
        userProfile.degree ||
        userProfile.highestQualification ||
        "Not provided",
      discipline: userProfile.discipline || "Not provided",
      skills: Array.isArray(userProfile.skills) ? userProfile.skills : [],
      experienceYears:
        userProfile.experienceYears ?? userProfile.experience ?? 0,
      country: userProfile.country || "Not provided",
      careerLevel: userProfile.careerLevel || "Not specified",
      fieldOfStudy: userProfile.fieldOfStudy || "Not provided",
      institution: userProfile.institution || "Not provided",
    };
  }

  async #call(systemInstruction, userPrompt, modelOverride = null) {
    const client = this.#getClient();
    if (!client) return null;

    const modelName = modelOverride || aiConfig.model;

    try {
      const model = client.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: {
          maxOutputTokens: aiConfig.maxOutputTokens,
          temperature: aiConfig.temperature,
        },
      });

      const result = await model.generateContent(userPrompt);
      return result.response.text();
    } catch (err) {
      logger.warn({ err: err.message, model: modelName }, "AI call failed");

      if (!modelOverride && aiConfig.fallbackModel) {
        logger.info("Retrying with fallback model");
        return this.#call(
          systemInstruction,
          userPrompt,
          aiConfig.fallbackModel,
        );
      }

      return null;
    }
  }

  async interpretEligibility(opportunity, userProfile, ruleResults) {
    const normalizedOpportunity = this.normalizeOpportunity(opportunity);
    const normalizedUserProfile = this.normalizeUserProfile(userProfile);

    const system = `You are Rovia, a career guidance assistant for global graduates.
You explain eligibility in plain English. Rules:
- Never use percentages or scores.
- Never contradict the rule engine result provided to you.
- Never say someone is "not eligible" — only the rules engine decides that.
- Use short sentences. Be specific to the user's actual profile.
- If information is missing, say so clearly.
- End with one practical suggestion if there is a gap.`;

    const prompt = `Opportunity: ${normalizedOpportunity.title} at ${normalizedOpportunity.organisation}
Requirements: ${JSON.stringify(normalizedOpportunity.requirements)}
Rule engine result: ${ruleResults?.overallMatch || "Unable to determine"}
User profile: degree=${normalizedUserProfile.degree}, discipline=${normalizedUserProfile.discipline}, skills=${normalizedUserProfile.skills.join(", ") || "not provided"}, experience=${normalizedUserProfile.experienceYears} years, country=${normalizedUserProfile.country}

Write a 3-4 sentence interpretation of how this user matches this opportunity.`;

    return this.#call(system, prompt);
  }

  async generateReadinessGuidance(gaps, userProfile) {
    const normalizedUserProfile = this.normalizeUserProfile(userProfile);

    const system = `You are Rovia, a career readiness coach for global graduates.
You turn eligibility gaps into clear action steps. Rules:
- Be specific and actionable.
- Reference local context where possible.
- Never use percentages.
- Keep each action to one sentence.
- Prioritize by impact.`;

    const prompt = `User profile: degree=${normalizedUserProfile.degree}, skills=${normalizedUserProfile.skills.join(", ") || "not provided"}
Eligibility gaps: ${JSON.stringify(gaps || [])}

List 3-5 specific actions this user should take to close these gaps. Format as a numbered list.`;

    return this.#call(system, prompt);
  }

  async explainOpportunityMatch(opportunity, userProfile) {
    const normalizedOpportunity = this.normalizeOpportunity(opportunity);
    const normalizedUserProfile = this.normalizeUserProfile(userProfile);

    const system = `You are Rovia, a career guidance assistant for global graduates.
You explain why an opportunity is relevant to a user. Rules:
- Be specific to the user's profile.
- Mention concrete matches (degree, skills, location).
- Be honest about gaps without being discouraging.
- No percentages. No fake precision.`;

    const prompt = `Opportunity: ${normalizedOpportunity.title} at ${normalizedOpportunity.organisation}
Type: ${normalizedOpportunity.type}, Deadline: ${normalizedOpportunity.deadline}
User: degree=${normalizedUserProfile.degree}, skills=${normalizedUserProfile.skills.join(", ") || "not provided"}, careerLevel=${normalizedUserProfile.careerLevel}, country=${normalizedUserProfile.country}

In 2-3 sentences, explain why this opportunity is relevant to this user.`;

    return this.#call(system, prompt);
  }

  async generatePracticeQuestions(opportunity, userProfile) {
    const normalizedOpportunity = this.normalizeOpportunity(opportunity);
    const normalizedUserProfile = this.normalizeUserProfile(userProfile);

    const system = `You are Rovia, an interview preparation coach for global graduates.
You generate realistic practice questions. Rules:
- Questions should be specific to the opportunity type and role.
- Mix behavioral and technical questions.
- Include one question about local context if relevant.
- Provide exactly 5 questions, no more, no less.
- Do NOT add any introductory text, closing remarks, or conversational filler.
- Do NOT ask if the user wants more help.
- Output ONLY the questions, each on a new line, numbered 1 through 5.
- Each question must end with a question mark.`;

    const prompt = `Opportunity: ${normalizedOpportunity.title} at ${normalizedOpportunity.organisation}
Type: ${normalizedOpportunity.type}
User background: degree=${normalizedUserProfile.degree}, skills=${normalizedUserProfile.skills.join(", ") || "not provided"}

Generate exactly 5 practice interview questions for this opportunity. Output ONLY the numbered questions, nothing else.`;

    return this.#call(system, prompt);
  }

  async suggestLearningResources(gaps, userProfile) {
    const normalizedUserProfile = this.normalizeUserProfile(userProfile);

    const system = `You are Rovia, a learning advisor for global graduates.
You suggest free or affordable learning resources. Rules:
- Prioritize free resources.
- Be specific with resource names, not generic advice.
- Focus on resources accessible locally.
- Maximum 3 recommendations.`;

    const prompt = `User: degree=${normalizedUserProfile.degree}, skills=${normalizedUserProfile.skills.join(", ") || "not provided"}
Skill gaps: ${JSON.stringify(gaps || [])}

Suggest 3 specific free learning resources to close these gaps.`;

    return this.#call(system, prompt);
  }
}

export default new AIService();
