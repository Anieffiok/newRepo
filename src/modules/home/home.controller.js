import * as homeService from "./home.service.js";

export async function getHomeDashboard(req, res) {
  const dashboard = await homeService.getHomeDashboard(req.user.id);

  return res.status(200).json({
    success: true,
    data: dashboard,
    message: "Dashboard retrieved successfully",
  });
}

export async function listActions(req, res) {
  const actions = await homeService.listActions(req.user.id, req.query);

  return res.status(200).json({
    success: true,
    data: actions,
    message: "Actions retrieved successfully",
  });
}

export async function updateAction(req, res) {
  const action = await homeService.updateAction(
    req.user.id,
    req.params.id,
    req.body.status,
  );

  return res.status(200).json({
    success: true,
    data: action,
    message: "Action updated successfully",
  });
}
