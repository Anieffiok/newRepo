# ROVIA

## Career profile data contract

The profile API aggregates a user's core profile and related education, experience, skills, certifications, career goals, and interests. The following database fields are the canonical structured fields for profile capture and analytics:

| Section | Canonical fields |
| --- | --- |
| Profile | `headline`, `location`, `country`, `careerLevel`, `biography` |
| Education | `institution`, `qualification`, `fieldOfStudy`, `startDate`, `endDate`, `country`, `verificationStatus` |
| Experience | `type`, `organisation`, `title`, `description`, `location`, `country`, `startDate`, `endDate`, `isCurrent` |
| Skill catalog | `name`, `category` |
| User skill | `proficiency`, `evidence` |
| Certification | `name`, `issuer`, `issueDate`, `expiryDate`, `credentialId`, `credentialUrl`, `verificationStatus` |
| Career goal | `goalType`, `targetRole`, `targetIndustry`, `targetLocation`, `priority`, `status` |
| Interest catalog | `name`, `category` |

Skills use the relational `skills` and `user_skills` tables. `Skill.name` is limited to 100 characters; `category` is optional. `UserSkill.proficiency` is one of `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, or `EXPERT`, with `BEGINNER` as the default; `evidence` is optional. The canonical skill API field is uppercase `proficiency`. For compatibility during transition, the API also accepts and returns `proficiencyLevel` with title-case values. Both fields map to the same relational proficiency value. Skill IDs are UUIDs.

Profile section values should use the corresponding model enums and field constraints. Dates use date-only values where modeled as dates. Verification status describes review state; it should not be interpreted as evidence of skill proficiency or as an analytics quality score.

### Profile completion rules

Completion uses the existing weighted score and marks a profile `COMPLETE` at 80% or above:

| Requirement | Criterion | Weight |
| --- | --- | ---: |
| Basic information | Non-empty headline, location, country, and biography | 25 |
| Education | At least one education record | 15 |
| Experience | At least one experience record | 15 |
| Skills | At least three associated skills | 15 |
| Certifications | At least one certification record | 10 |
| Career goals | At least one career goal, regardless of status | 10 |
| Interests | At least two associated interests | 10 |

The weights total 100. This is a weighted threshold, not an all-sections-required rule: a profile may be `COMPLETE` while still having checklist items. Certification and other missing sections remain in `missingSteps` as completion recommendations even when the score meets the threshold. Completion status is synchronized to the profile record when the aggregate profile is fetched.

Keep the scoring weights, criteria, and threshold in `src/modules/profile/profile.service.js` aligned with this contract. If the criteria change, update the profile completion calculation and this documentation together.

## Database migrations

The application, Sequelize config, and migrations use ES modules. Node.js 22.12.0 or newer is required because Sequelize CLI 6 loads migration modules through Node's `require()` interoperability for ES modules.

Use the npm scripts to run migrations with the ESM config and migrations directory:

```sh
npm run db:migrate:status
npm run db:migrate
npm run db:migrate:undo
```