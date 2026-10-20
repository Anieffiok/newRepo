import * as preparationService from "./preparation.service.js";

export async function getChecklist(req, res) {
  const checklist = await preparationService.getChecklist(
    req.user.id,
    req.query.opportunityId,
  );

  return res.status(200).json({
    success: true,
    data: checklist,
    message: "Preparation checklist retrieved successfully",
  });
}
