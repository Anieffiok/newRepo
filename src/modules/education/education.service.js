import { Education } from "../../database/models/index.js";
import ApiError from "../../utils/ApiError.js";

const allowedFields = [
  "institution",
  "qualification",
  "fieldOfStudy",
  "startDate",
  "endDate",
  "country",
];

function pickEducationFields(data) {
  return Object.fromEntries(
    allowedFields
      .filter((field) => data[field] !== undefined)
      .map((field) => [field, data[field]]),
  );
}

class EducationService {
  async create(userId, data) {
    return Education.create({
      ...pickEducationFields(data),
      userId,
    });
  }

  async getAll(userId) {
    return Education.findAll({
      where: { userId },
      order: [["startDate", "DESC NULLS LAST"]],
    });
  }

  async getById(userId, id) {
    const education = await Education.findOne({ where: { id, userId } });
    if (!education) {
      throw new ApiError(404, "NOT_FOUND", "Education record not found");
    }
    return education;
  }

  async update(userId, id, data) {
    const education = await this.getById(userId, id);
    return education.update(pickEducationFields(data));
  }

  async delete(userId, id) {
    const education = await this.getById(userId, id);
    await education.destroy();
    return { message: "Education record deleted successfully" };
  }
}

export default new EducationService();
