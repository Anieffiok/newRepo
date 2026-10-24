import { Op } from "sequelize";
import {
  sequelize,
  Interest,
  User,
  UserInterest,
} from "../../database/models/index.js";
import ApiError from "../../utils/ApiError.js";

/**
 * Get all available master interests (with optional search query)
 */
export async function getAllInterests(searchQuery) {
  const where = {};

  if (searchQuery) {
    where.name = {
      [Op.iLike]: `%${searchQuery}%`, // Case-insensitive search in PostgreSQL
    };
  }

  return Interest.findAll({
    where,
    order: [["name", "ASC"]],
  });
}

/**
 * Get interests for a specific user
 */
export async function getUserInterests(userId) {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Interest,
        as: "interests",
        through: { attributes: [] }, // Omit join table timestamps from response
      },
    ],
  });

  return user?.interests || [];
}

/**
 * Bulk sync user interests (creates missing master interests, updates join table)
 */
export async function syncUserInterests(userId, interestNames) {
  return sequelize.transaction(async (t) => {
    // 1. Find or create master records for all provided interest names
    const interestRecords = [];
    for (const rawName of interestNames) {
      const trimmed = rawName.trim();
      if (!trimmed) continue;

      const [interest] = await Interest.findOrCreate({
        where: { name: trimmed },
        defaults: { name: trimmed },
        transaction: t,
      });
      interestRecords.push(interest);
    }

    // 2. Remove old user associations
    await UserInterest.destroy({
      where: { userId },
      transaction: t,
    });

    // 3. Insert new user associations
    if (interestRecords.length > 0) {
      const rowsToInsert = interestRecords.map((item) => ({
        userId,
        interestId: item.id,
      }));

      await UserInterest.bulkCreate(rowsToInsert, { transaction: t });
    }

    return interestRecords;
  });
}

/**
 * Add a single interest to user profile
 */
export async function addUserInterest(userId, name, category = null) {
  const trimmed = name.trim();

  return sequelize.transaction(async (t) => {
    const [interest] = await Interest.findOrCreate({
      where: { name: trimmed },
      defaults: { name: trimmed, category },
      transaction: t,
    });

    const [, created] = await UserInterest.findOrCreate({
      where: { userId, interestId: interest.id },
      defaults: { userId, interestId: interest.id },
      transaction: t,
    });

    if (!created) {
      throw new ApiError(
        409,
        "CONFLICT",
        "You have already added this interest",
      );
    }

    return interest;
  });
}

/**
 * Remove an interest from user profile
 */
export async function removeUserInterest(userId, interestId) {
  const deletedCount = await UserInterest.destroy({
    where: { userId, interestId },
  });

  if (!deletedCount) {
    throw new ApiError(
      404,
      "NOT_FOUND",
      "Interest not associated with your profile",
    );
  }
}
