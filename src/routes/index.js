import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import profileRoutes from "../modules/profile/profile.routes.js";
import educationRoutes from "../modules/education/education.routes.js";
import experienceRoutes from "../modules/experience/experience.routes.js";
import certificationRoutes from "../modules/certifications/certification.routes.js";
import goalRoutes from "../modules/goals/goal.routes.js";
import interestRoutes from "../modules/interests/interest.routes.js";
import skillRoutes from "../modules/skills/skills.routes.js";
import notificationRoutes from "../modules/notifications/notification.routes.js";
import documentRoutes from "../modules/documents/document.routes.js";
import opportunityRoutes from "../modules/opportunities/opportunity.routes.js";
import eligibilityRoutes from "../modules/eligibility/eligibility.routes.js";
import applicationRoutes from "../modules/applications/application.routes.js";
import readinessRoutes from "../modules/readiness/readiness.routes.js";
import homeRoutes from "../modules/home/home.routes.js";
import practiceRoutes from "../modules/practice/practice.routes.js";
import learningRoutes from "../modules/learning/learning.routes.js";
import preparationRoutes from "../modules/preparation/preparation.routes.js";
import trustRoutes from "../modules/trust/trust.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/profile", profileRoutes);
router.use("/profile/education", educationRoutes);
router.use("/profile/experience", experienceRoutes);
router.use("/profile/certifications", certificationRoutes);
router.use("/goals", goalRoutes);
router.use("/interests", interestRoutes);
router.use("/skills", skillRoutes);
router.use("/notifications", notificationRoutes);
router.use("/documents", documentRoutes);
router.use("/opportunities", opportunityRoutes);
router.use("/eligibility", eligibilityRoutes);
router.use("/applications", applicationRoutes);
router.use("/readiness", readinessRoutes);
router.use("/", homeRoutes);
router.use("/practice", practiceRoutes);
router.use("/learning", learningRoutes);
router.use("/preparation", preparationRoutes);
router.use("/trust", trustRoutes);
router.use("/admin", adminRoutes);

router.get("/", (req, res) => {
  res.json({ success: true, message: "Rovia API v1" });
});

export default router;
