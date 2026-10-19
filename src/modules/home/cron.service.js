import cron from "node-cron";
import { User } from "../../database/models/index.js";
import * as homeService from "./home.service.js";
import logger from "../../config/logger.js";

/**
 * Start the daily deadline check cron job.
 * Runs every day at 6:00 AM server time.
 * Checks all active users for approaching deadlines and creates actions.
 */
export function startCronJobs() {
  // Skip in test environment
  if (process.env.NODE_ENV === "test") return;

  cron.schedule("0 6 * * *", async () => {
    logger.info("Cron: Starting daily deadline check");

    try {
      // Get all active users
      const users = await User.findAll({
        where: { accountStatus: "ACTIVE" },
        attributes: ["id"],
      });

      let totalActions = 0;

      for (const user of users) {
        try {
          const count = await homeService.syncAllActions(user.id);
          totalActions += count;
        } catch (error) {
          logger.error(
            { userId: user.id, error: error.message },
            "Cron: Failed to sync actions for user",
          );
        }
      }

      logger.info(
        { usersProcessed: users.length, actionsCreated: totalActions },
        "Cron: Daily deadline check complete",
      );
    } catch (error) {
      logger.error(
        { error: error.message },
        "Cron: Daily deadline check failed",
      );
    }
  });

  logger.info("Cron: Daily deadline check scheduled for 6:00 AM");
}
