import * as eligibilityService from "./eligibility.service.js";

export async function analyseEligibility(req, res) {
  const result = await eligibilityService.analyseEligibility(
    req.user.id,
    req.body.opportunityId,
  );

  return res.status(200).json({
    success: true,
    data: result,
    message: "Eligibility analysis completed",
  });
}

export async function getEligibilityResult(req, res) {
  const result = await eligibilityService.getEligibilityResult(
    req.params.id,
    req.user.id,
  );

  return res.status(200).json({
    success: true,
    data: result,
    message: "Eligibility result retrieved",
  });
}
