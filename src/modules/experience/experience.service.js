import { Experience } from "../../database/models/index.js";
import ApiError from "../../utils/ApiError.js";

const allowedFields = [
  "type",
  "organisation",
  "title",
  "description",
  "location",
  "country",
  "startDate",
  "endDate",
  "isCurrent",
];

function pickExperienceFields(data) {
  return Object.fromEntries(
    allowedFields
      .filter((field) => data[field] !== undefined)
      .map((field) => [field, data[field]]),
  );
}

class ExperienceService {
  async create(userId, data) {
    return Experience.create({
      ...pickExperienceFields(data),
      userId,
    });
  }

  async getAll(userId) {
    return Experience.findAll({
      where: { userId },
      order: [["startDate", "DESC NULLS LAST"]],
    });
  }

  async getById(userId, id) {
    const experience = await Experience.findOne({ where: { id, userId } });
    if (!experience) {
      throw new ApiError(404, "NOT_FOUND", "Experience record not found");
    }
    return experience;
  }

  async update(userId, id, data) {
    const experience = await this.getById(userId, id);
    return experience.update(pickExperienceFields(data));
  }

  async delete(userId, id) {
    const experience = await this.getById(userId, id);
    await experience.destroy();
    return { message: "Experience record deleted successfully" };
  }
}

export default new ExperienceService();
