import * as authService from "./auth.service.js";

const isProduction = process.env.NODE_ENV === "production";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.cookie.secure,
  sameSite: env.cookie.sameSite,
  path: "/",
  domain: env.cookie.domain,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function getRefreshTokenFromRequest(req) {
  return req.cookies?.refreshToken || req.body?.refreshToken || null;
}

export async function register(req, res) {
  const result = await authService.register(req.body);

  res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

  return res.status(201).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
    message: "User registered successfully",
  });
}

export async function login(req, res) {
  const result = await authService.login(req.body);

  res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

  return res.status(200).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
    message: "Login successful",
  });
}

export async function refresh(req, res) {
  const rawToken = getRefreshTokenFromRequest(req);

  if (!rawToken) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Refresh token is required",
      },
    });
  }

  const result = await authService.refresh(rawToken);

  return res.status(200).json({
    success: true,
    data: {
      accessToken: result.accessToken,
    },
    message: "Access token refreshed successfully",
  });
}

export async function logout(req, res) {
  const userId = req.user?.id;
  const rawToken = getRefreshTokenFromRequest(req);

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    });
  }

  await authService.logout({
    userId,
    rawRefreshToken: rawToken,
  });

  res.clearCookie("refreshToken", {
    ...COOKIE_OPTIONS,
    path: "/",
  });

  return res.status(200).json({
    success: true,
    data: null,
    message: "Logged out successfully",
  });
}

export async function forgotPassword(req, res) {
  await authService.forgotPassword(req.body.email);

  return res.status(200).json({
    success: true,
    data: null,
    message:
      "If an account exists with this email, a password reset link has been sent.",
  });
}

export async function resetPassword(req, res) {
  await authService.resetPassword(req.body);

  return res.status(200).json({
    success: true,
    data: null,
    message:
      "Password has been reset successfully. Please log in with your new password.",
  });
}

export async function verifyEmail(req, res) {
  await authService.verifyEmail(req.body.token);

  return res.status(200).json({
    success: true,
    data: null,
    message: "Email verified successfully. Your account is now active.",
  });
}

export async function resendVerification(req, res) {
  await authService.resendVerification(req.body.email);

  return res.status(200).json({
    success: true,
    data: null,
    message:
      "If this email is registered and unverified, a new verification link has been sent.",
  });
}
