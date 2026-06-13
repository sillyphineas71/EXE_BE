// src/services/subscription.service.js
const { User } = require("../models");

const PREMIUM_PLANS = {
  monthly: {
    code: "monthly",
    label: "Premium Monthly",
    price_vnd: 180000,
  },
  yearly: {
    code: "yearly",
    label: "Premium Yearly",
    price_vnd: 1600000,
  },
};

const isPremiumActiveByUser = (user) => {
  if (!user) return false;

  const tier = String(user.account_tier || "free").toLowerCase();
  if (tier !== "premium") return false;

  // Nếu không dùng hạn (cấp thủ công lâu dài), chỉ cần account_tier = premium
  if (!user.premium_expires_at) return true;

  return new Date(user.premium_expires_at).getTime() > Date.now();
};

const buildSubscriptionInfo = (user) => {
  const active = isPremiumActiveByUser(user);

  return {
    account_tier: active ? "premium" : "free",
    is_premium_active: active,
    premium_plan_code: active ? user.premium_plan_code || null : null,
    premium_expires_at: active ? user.premium_expires_at || null : null,
    profile_limit: active ? null : 1, // null = unlimited
    can_create_multiple_profiles: active,
  };
};

const assertPremiumUser = async (userId, featureLabel = "tính năng này") => {
  const user = await User.findByPk(userId, {
    attributes: ["id", "account_tier", "premium_plan_code", "premium_expires_at"],
  });

  if (!user) {
    const err = new Error("Không tìm thấy người dùng");
    err.statusCode = 404;
    throw err;
  }

  const subscription = buildSubscriptionInfo(user.get({ plain: true }));

  if (!subscription.is_premium_active) {
    const err = new Error(`Chỉ tài khoản Premium mới được sử dụng ${featureLabel}.`);
    err.statusCode = 403;
    err.code = "PREMIUM_REQUIRED";
    throw err;
  }

  return { user, subscription };
};

module.exports = {
  PREMIUM_PLANS,
  isPremiumActiveByUser,
  buildSubscriptionInfo,
  assertPremiumUser,
};