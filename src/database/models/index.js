import sequelize from "../../config/sequelize.js";
import User from "./user.model.js";
import EmailVerificationToken from "./emailVerificationToken.model.js";
import Profile from "./profile.model.js";
import RefreshToken from "./refreshToken.model.js";
import PasswordResetToken from "./passwordResetToken.model.js";
import Education from "./education.model.js";
import Skill from "./skill.model.js";
import UserSkill from "./userSkill.model.js";
import Experience from "./experience.model.js";
import Certification from "./certification.model.js";
import CareerGoal from "./careerGoal.model.js";
import Interest from "./interest.model.js";
import UserInterest from "./userInterest.model.js";
import NotificationPreference from "./notificationPreference.model.js";
import Notification from "./notification.model.js";
import Document from "./document.model.js";
import Opportunity from "./opportunity.model.js";
import OpportunityRequirement from "./opportunityRequirement.model.js";
import SavedOpportunity from "./savedOpportunity.model.js";
import EligibilityResult from "./eligibilityResult.model.js";
import EligibilityItem from "./eligibilityItem.model.js";
import Application from "./application.model.js";
import ApplicationStage from "./applicationStage.model.js";
import ReadinessResult from "./readinessResult.model.js";
import ReadinessItem from "./readinessItem.model.js";
import Action from "./action.model.js";

// ==========================================
// 1. User & Profile (1:1)
// ==========================================
User.hasOne(Profile, {
  foreignKey: "userId",
  as: "profile",
  onDelete: "CASCADE",
});
Profile.belongsTo(User, { foreignKey: "userId", as: "user" });

// ==========================================
// 2. User & Auth Tokens (1:N)
// ==========================================
User.hasMany(RefreshToken, {
  foreignKey: "userId",
  as: "refreshTokens",
  onDelete: "CASCADE",
});
RefreshToken.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(PasswordResetToken, {
  foreignKey: "userId",
  as: "passwordResetTokens",
  onDelete: "CASCADE",
});
PasswordResetToken.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(EmailVerificationToken, {
  foreignKey: "userId",
  as: "emailVerificationTokens",
  onDelete: "CASCADE",
});
EmailVerificationToken.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// ==========================================
// 3. User & Education (1:N)
// ==========================================
User.hasMany(Education, {
  foreignKey: "userId",
  as: "education",
  onDelete: "CASCADE",
});
Education.belongsTo(User, { foreignKey: "userId", as: "user" });

// ==========================================
// 4. User & Skills (N:M through UserSkill)
// ==========================================
User.belongsToMany(Skill, {
  through: UserSkill,
  foreignKey: "userId",
  otherKey: "skillId",
  as: "skills",
});
Skill.belongsToMany(User, {
  through: UserSkill,
  foreignKey: "skillId",
  otherKey: "userId",
  as: "users",
});
UserSkill.belongsTo(User, { foreignKey: "userId", as: "user" });
UserSkill.belongsTo(Skill, { foreignKey: "skillId", as: "skill" });
User.hasMany(UserSkill, { foreignKey: "userId", as: "userSkills" });
Skill.hasMany(UserSkill, { foreignKey: "skillId", as: "userSkills" });

// ==========================================
// 5. User & Experience (1:N)
// ==========================================
User.hasMany(Experience, {
  foreignKey: "userId",
  as: "experiences",
  onDelete: "CASCADE",
});
Experience.belongsTo(User, { foreignKey: "userId", as: "user" });

// ==========================================
// 6. User & Certifications (1:N)
// ==========================================
User.hasMany(Certification, {
  foreignKey: "userId",
  as: "certifications",
  onDelete: "CASCADE",
});
Certification.belongsTo(User, { foreignKey: "userId", as: "user" });

// ==========================================
// 7. User & Career Goals (1:N)
// ==========================================
User.hasMany(CareerGoal, {
  foreignKey: "userId",
  as: "careerGoals",
  onDelete: "CASCADE",
});
CareerGoal.belongsTo(User, { foreignKey: "userId", as: "user" });

// ==========================================
// 8. User & Interests (N:M through UserInterest)
// ==========================================
User.belongsToMany(Interest, {
  through: UserInterest,
  foreignKey: "userId",
  otherKey: "interestId",
  as: "interests",
});
Interest.belongsToMany(User, {
  through: UserInterest,
  foreignKey: "interestId",
  otherKey: "userId",
  as: "users",
});
UserInterest.belongsTo(User, { foreignKey: "userId", as: "user" });
UserInterest.belongsTo(Interest, { foreignKey: "interestId", as: "interest" });
User.hasMany(UserInterest, { foreignKey: "userId", as: "userInterests" });
Interest.hasMany(UserInterest, {
  foreignKey: "interestId",
  as: "userInterests",
});

// 9. User & Notifications
User.hasMany(NotificationPreference, {
  foreignKey: "userId",
  as: "notificationPreferences",
  onDelete: "CASCADE",
});
NotificationPreference.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// 10. User & Documents
User.hasMany(Document, {
  foreignKey: "userId",
  as: "documents",
  onDelete: "CASCADE",
});
Document.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// 11. Opportunity → Requirements (1:N)
Opportunity.hasMany(OpportunityRequirement, {
  foreignKey: "opportunityId",
  as: "requirements",
  onDelete: "CASCADE",
});
OpportunityRequirement.belongsTo(Opportunity, {
  foreignKey: "opportunityId",
  as: "opportunity",
});

// 12. User → Saved Opportunities (1:N)
User.hasMany(SavedOpportunity, {
  foreignKey: "userId",
  as: "savedOpportunities",
  onDelete: "CASCADE",
});
SavedOpportunity.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// 13. Opportunity → Saved Opportunities (1:N)
Opportunity.hasMany(SavedOpportunity, {
  foreignKey: "opportunityId",
  as: "saves",
  onDelete: "CASCADE",
});
SavedOpportunity.belongsTo(Opportunity, {
  foreignKey: "opportunityId",
  as: "opportunity",
});

// User → Eligibility Results
User.hasMany(EligibilityResult, {
  foreignKey: "userId",
  as: "eligibilityResults",
  onDelete: "CASCADE",
});
EligibilityResult.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Opportunity → Eligibility Results
Opportunity.hasMany(EligibilityResult, {
  foreignKey: "opportunityId",
  as: "eligibilityResults",
  onDelete: "CASCADE",
});
EligibilityResult.belongsTo(Opportunity, {
  foreignKey: "opportunityId",
  as: "opportunity",
});

// EligibilityResult → Items (1:N)
EligibilityResult.hasMany(EligibilityItem, {
  foreignKey: "eligibilityResultId",
  as: "items",
  onDelete: "CASCADE",
});
EligibilityItem.belongsTo(EligibilityResult, {
  foreignKey: "eligibilityResultId",
  as: "eligibilityResult",
});

// EligibilityItem → Requirement
OpportunityRequirement.hasMany(EligibilityItem, {
  foreignKey: "requirementId",
  as: "eligibilityItems",
  onDelete: "CASCADE",
});
EligibilityItem.belongsTo(OpportunityRequirement, {
  foreignKey: "requirementId",
  as: "requirement",
});

// User → Applications
User.hasMany(Application, {
  foreignKey: "userId",
  as: "applications",
  onDelete: "CASCADE",
});
Application.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Opportunity → Applications
Opportunity.hasMany(Application, {
  foreignKey: "opportunityId",
  as: "applications",
  onDelete: "CASCADE",
});
Application.belongsTo(Opportunity, {
  foreignKey: "opportunityId",
  as: "opportunity",
});

// Application → Stages (1:N)
Application.hasMany(ApplicationStage, {
  foreignKey: "applicationId",
  as: "stages",
  onDelete: "CASCADE",
});
ApplicationStage.belongsTo(Application, {
  foreignKey: "applicationId",
  as: "application",
});

// User → Readiness Results
User.hasMany(ReadinessResult, {
  foreignKey: "userId",
  as: "readinessResults",
  onDelete: "CASCADE",
});
ReadinessResult.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Opportunity → Readiness Results
Opportunity.hasMany(ReadinessResult, {
  foreignKey: "opportunityId",
  as: "readinessResults",
  onDelete: "CASCADE",
});
ReadinessResult.belongsTo(Opportunity, {
  foreignKey: "opportunityId",
  as: "opportunity",
});

// EligibilityResult → ReadinessResult (1:1)
EligibilityResult.hasOne(ReadinessResult, {
  foreignKey: "eligibilityResultId",
  as: "readinessResult",
  onDelete: "SET NULL",
});
ReadinessResult.belongsTo(EligibilityResult, {
  foreignKey: "eligibilityResultId",
  as: "eligibilityResult",
});

// ReadinessResult → Items (1:N)
ReadinessResult.hasMany(ReadinessItem, {
  foreignKey: "readinessResultId",
  as: "items",
  onDelete: "CASCADE",
});
ReadinessItem.belongsTo(ReadinessResult, {
  foreignKey: "readinessResultId",
  as: "readinessResult",
});

// User -> Action
User.hasMany(Action, {
  foreignKey: "userId",
  as: "actions",
  onDelete: "CASCADE",
});
Action.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// ==========================================
// Exports
// ==========================================
export {
  sequelize,
  User,
  EmailVerificationToken,
  Profile,
  RefreshToken,
  PasswordResetToken,
  Education,
  Skill,
  UserSkill,
  Experience,
  Certification,
  CareerGoal,
  Interest,
  UserInterest,
  NotificationPreference,
  Document,
  Opportunity,
  OpportunityRequirement,
  SavedOpportunity,
  EligibilityResult,
  EligibilityItem,
  Application,
  ApplicationStage,
  ReadinessResult,
  ReadinessItem,
  Action,
  Notification,
};

export default {
  sequelize,
  User,
  EmailVerificationToken,
  Profile,
  RefreshToken,
  PasswordResetToken,
  Education,
  Skill,
  UserSkill,
  Experience,
  Certification,
  CareerGoal,
  Interest,
  UserInterest,
  NotificationPreference,
  Document,
  Opportunity,
  OpportunityRequirement,
  SavedOpportunity,
  EligibilityResult,
  EligibilityItem,
  Application,
  ApplicationStage,
  ReadinessResult,
  ReadinessItem,
  Action,
  Notification,
};
