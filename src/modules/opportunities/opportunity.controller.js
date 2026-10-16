import * as opportunityService from "./opportunity.service.js";

export async function listOpportunities(req, res) {
  const result = await opportunityService.listOpportunities(req.query);

  return res.status(200).json({
    success: true,
    data: result,
    message: "Opportunities retrieved successfully",
  });
}

export async function getOpportunity(req, res) {
  const result = await opportunityService.getOpportunityById(
    req.params.id,
    req.user?.id || null,
  );

  return res.status(200).json({
    success: true,
    data: result,
    message: "Opportunity retrieved successfully",
  });
}

export async function bringOpportunity(req, res) {
  const result = await opportunityService.bringOpportunity(
    req.user.id,
    req.body,
  );

  // If duplicate detected, return 200 with the flag so frontend shows the choice
  if (result.isDuplicate) {
    return res.status(200).json({
      success: true,
      data: result,
      message: result.message,
    });
  }

  return res.status(201).json({
    success: true,
    data: result,
    message: "Opportunity added successfully",
  });
}

export async function saveOpportunity(req, res) {
  const result = await opportunityService.saveOpportunity(
    req.user.id,
    req.params.id,
  );

  return res.status(200).json({
    success: true,
    data: result,
    message: "Opportunity saved",
  });
}

export async function unsaveOpportunity(req, res) {
  const result = await opportunityService.unsaveOpportunity(
    req.user.id,
    req.params.id,
  );

  return res.status(200).json({
    success: true,
    data: result,
    message: "Opportunity removed from saved list",
  });
}
