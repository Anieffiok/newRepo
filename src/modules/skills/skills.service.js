import { UniqueConstraintError } from "sequelize";
import { sequelize, Skill, UserSkill } from "../../database/models/index.js";
import ApiError from "../../utils/ApiError.js";

const proficiencyValues = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
  EXPERT: "EXPERT",
  Beginner: "BEGINNER",
  Intermediate: "INTERMEDIATE",
  Advanced: "ADVANCED",
  Expert: "EXPERT",
};

function normalizeProficiency(data) {
  return proficiencyValues[data.proficiency ?? data.proficiencyLevel] ?? "BEGINNER";
}

function serializeUserSkill(userSkill) {
  const proficiency = userSkill.proficiency;

  return {
    id: userSkill.skill.id,
    userId: userSkill.userId,
    name: userSkill.skill.name,
    proficiency,
    proficiencyLevel:
      proficiency.charAt(0) + proficiency.slice(1).toLowerCase(),
    evidence: userSkill.evidence,
  };
}

async function getUserSkill(userId, skillId, transaction) {
  return UserSkill.findOne({
    where: { userId, skillId },
    include: [{ model: Skill, as: "skill" }],
    transaction,
  });
}

class SkillsService {
  async create(userId, data) {
    try {
      return await sequelize.transaction(async (transaction) => {
        const name = data.name.trim();
        const [skill] = await Skill.findOrCreate({
          where: { name },
          defaults: { name },
          transaction,
        });

        const existing = await UserSkill.findOne({
          where: { userId, skillId: skill.id },
          transaction,
        });
        if (existing) {
          throw new ApiError(409, "CONFLICT", "You have already added this skill");
        }

        const userSkill = await UserSkill.create(
          {
            userId,
            skillId: skill.id,
            proficiency: normalizeProficiency(data),
            evidence: data.evidence ?? null,
          },
          { transaction },
        );

        return serializeUserSkill(
          await getUserSkill(userId, userSkill.skillId, transaction),
        );
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ApiError(409, "CONFLICT", "You have already added this skill");
      }
      throw error;
    }
  }

  async getAll(userId) {
    const userSkills = await UserSkill.findAll({
      where: { userId },
      include: [{ model: Skill, as: "skill" }],
      order: [[{ model: Skill, as: "skill" }, "name", "ASC"]],
    });

    return userSkills.map(serializeUserSkill);
  }

  async getById(userId, id) {
    const userSkill = await getUserSkill(userId, id);
    if (!userSkill) {
      throw new ApiError(404, "NOT_FOUND", "Skill not found");
    }
    return serializeUserSkill(userSkill);
  }

  async update(userId, id, data) {
    try {
      return await sequelize.transaction(async (transaction) => {
        const userSkill = await getUserSkill(userId, id, transaction);
        if (!userSkill) {
          throw new ApiError(404, "NOT_FOUND", "Skill not found");
        }

        const updates = {};
        if (data.proficiency !== undefined || data.proficiencyLevel !== undefined) {
          updates.proficiency = normalizeProficiency(data);
        }
        if (data.evidence !== undefined) {
          updates.evidence = data.evidence;
        }

        if (data.name !== undefined) {
          const name = data.name.trim();
          const [targetSkill] = await Skill.findOrCreate({
            where: { name },
            defaults: { name },
            transaction,
          });

          if (targetSkill.id !== userSkill.skillId) {
            const existing = await UserSkill.findOne({
              where: { userId, skillId: targetSkill.id },
              transaction,
            });
            if (existing) {
              throw new ApiError(
                409,
                "CONFLICT",
                "You have already added this skill",
              );
            }

            await userSkill.destroy({ transaction });
            await UserSkill.create(
              {
                userId,
                skillId: targetSkill.id,
                proficiency: updates.proficiency ?? userSkill.proficiency,
                evidence:
                  updates.evidence !== undefined
                    ? updates.evidence
                    : userSkill.evidence,
              },
              { transaction },
            );
            return serializeUserSkill(
              await getUserSkill(userId, targetSkill.id, transaction),
            );
          }
        }

        await userSkill.update(updates, { transaction });
        return serializeUserSkill(
          await getUserSkill(userId, id, transaction),
        );
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ApiError(409, "CONFLICT", "You have already added this skill");
      }
      throw error;
    }
  }

  async delete(userId, id) {
    const deletedCount = await UserSkill.destroy({
      where: { userId, skillId: id },
    });
    if (!deletedCount) {
      throw new ApiError(404, "NOT_FOUND", "Skill not found");
    }
    return { message: "Skill deleted successfully" };
  }
}

export default new SkillsService();
