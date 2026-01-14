"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useMerchantNav } from "../../_components/merchantNav";

interface Subscription {
  id: number;
  plan: string;
  status: string;
  billing_interval: string | null;
  invoices_limit: number;
  invoices_used_this_month: number;
  extra_invoice_price: string;
  trial_end: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface Plan {
  name: string;
  plan: string;
  invoices_limit: number;
  extra_invoice_price: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
}

interface PlansResponse {
  plans: Plan[];
  current_plan: string;
}

interface UsageResponse {
  invoices_used: number;
  invoices_limit: number;
  invoices_remaining: number;
  extra_invoices_count: number;
  extra_invoices_cost: number;
  plan: string;
  status: string;
  days_until_reset: number;
}

function errMsg(e: unknown) {
  if (e instanceof Error) return e.message;
  return typeof e === "string" ? e : "Failed";
}

export default function SubscriptionPage() {
  const t = useTranslations("subscription");
  const locale = useLocale();
  const nav = useMerchantNav();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isYearly, setIsYearly] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const base = process.env.NEXT_PUBLIC_API_URL;

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      if (!base) throw new Error("API URL not configured");

      const [subRes, plansRes, usageRes] = await Promise.all([
        fetch(`${base}/subscriptions/current`, { credentials: "include" }),
        fetch(`${base}/subscriptions/plans`, { credentials: "include" }),
        fetch(`${base}/subscriptions/usage`, { credentials: "include" }),
      ]);

      if (!subRes.ok) throw new Error("Failed to load subscription");
      if (!plansRes.ok) throw new Error("Failed to load plans");
      if (!usageRes.ok) throw new Error("Failed to load usage");

      const subData = await subRes.json();
      const plansData: PlansResponse = await plansRes.json();
      const usageData: UsageResponse = await usageRes.json();

      setSubscription(subData);
      setPlans(plansData.plans);
      setUsage(usageData);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCheckout(planKey: string) {
    if (!base) return;
    setCheckoutLoading(planKey);
    try {
      const billingInterval = isYearly ? "yearly" : "monthly";
      const successUrl = `${window.location.origin}/${locale}/dashboard/merchant/subscription?success=true`;
      const cancelUrl = `${window.location.origin}/${locale}/dashboard/merchant/subscription?canceled=true`;

      const res = await fetch(`${base}/subscriptions/checkout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planKey,
          billing_interval: billingInterval,
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handleManageSubscription() {
    if (!base) return;
    try {
      const returnUrl = `${window.location.origin}/${locale}/dashboard/merchant/subscription`;

      const res = await fetch(`${base}/subscriptions/portal`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ return_url: returnUrl }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      const data = await res.json();
      if (data.portal_url) {
        window.location.href = data.portal_url;
      }
    } catch (e) {
      setError(errMsg(e));
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      trialing:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      active:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      past_due:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      canceled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      unpaid: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return (
      colors[status] ||
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    );
  };

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = {
      free_trial: t("plans.freeTrial"),
      starter: t("plans.starter"),
      pro: t("plans.pro"),
      enterprise: t("plans.enterprise"),
    };
    return labels[plan] || plan;
  };

  if (loading) {
    return (
      <DashboardShell nav={nav}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell nav={nav}>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Current Subscription */}
        {subscription && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t("currentPlan")}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("plan")}
                </p>
                <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                  {getPlanLabel(subscription.plan)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("status")}
                </p>
                <span
                  className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(subscription.status)}`}
                >
                  {t(`statuses.${subscription.status}`)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("billingCycle")}
                </p>
                <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                  {subscription.billing_interval
                    ? t(`billing.${subscription.billing_interval}`)
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {subscription.status === "trialing"
                    ? t("trialEnds")
                    : t("renewsOn")}
                </p>
                <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                  {subscription.status === "trialing"
                    ? formatDate(subscription.trial_end)
                    : formatDate(subscription.current_period_end)}
                </p>
              </div>
            </div>

            {subscription.cancel_at_period_end && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-sm">
                {t("cancelAtPeriodEnd")}
              </div>
            )}

            {subscription.status !== "trialing" &&
              subscription.status !== "canceled" && (
                <button
                  onClick={handleManageSubscription}
                  className="mt-4 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  {t("manageSubscription")}
                </button>
              )}
          </div>
        )}

        {/* Usage */}
        {usage && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t("usage.title")}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("usage.invoicesUsed")}
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {usage.invoices_used}{" "}
                  <span className="text-base font-normal text-gray-500">
                    / {usage.invoices_limit}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("usage.remaining")}
                </p>
                <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                  {usage.invoices_remaining}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("usage.extraInvoices")}
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {usage.extra_invoices_count}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("usage.extraCost")}
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  €{usage.extra_invoices_cost.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 dark:text-gray-400">
                  {t("usage.progress")}
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {Math.round(
                    (usage.invoices_used / usage.invoices_limit) * 100
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    usage.invoices_used > usage.invoices_limit
                      ? "bg-red-500"
                      : usage.invoices_used > usage.invoices_limit * 0.8
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(100, (usage.invoices_used / usage.invoices_limit) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t("usage.resetsIn", { days: usage.days_until_reset })}
              </p>
            </div>
          </div>
        )}

        {/* Available Plans */}
        {plans.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {subscription?.plan === "free_trial"
                  ? t("choosePlan")
                  : t("changePlan")}
              </h2>

              {/* Billing toggle */}
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm ${!isYearly ? "text-gray-900 dark:text-white font-medium" : "text-gray-500"}`}
                >
                  {t("billing.monthly")}
                </span>
                <button
                  onClick={() => setIsYearly(!isYearly)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isYearly ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isYearly ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span
                  className={`text-sm ${isYearly ? "text-gray-900 dark:text-white font-medium" : "text-gray-500"}`}
                >
                  {t("billing.yearly")}
                </span>
                {isYearly && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                    {t("savePercent")}
                  </span>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isCurrentPlan = subscription?.plan === plan.plan;
                const price = isYearly ? plan.price_yearly : plan.price_monthly;
                const monthlyEquivalent = isYearly
                  ? (plan.price_yearly / 12).toFixed(2)
                  : plan.price_monthly;

                return (
                  <div
                    key={plan.plan}
                    className={`rounded-2xl border p-6 ${
                      plan.plan === "pro"
                        ? "border-green-500 ring-2 ring-green-500/20"
                        : "border-gray-200 dark:border-gray-700"
                    } bg-white dark:bg-gray-800`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {plan.name}
                      </h3>
                      {plan.plan === "pro" && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                          {t("popular")}
                        </span>
                      )}
                    </div>

                    <div className="mt-4">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        €{monthlyEquivalent}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        /{t("perMonth")}
                      </span>
                      {isYearly && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          €{price} {t("billedYearly")}
                        </p>
                      )}
                    </div>

                    <ul className="mt-6 space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                        >
                          <svg
                            className="h-5 w-5 text-green-500 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() =>
                        !isCurrentPlan && handleCheckout(plan.plan)
                      }
                      disabled={isCurrentPlan || checkoutLoading === plan.plan}
                      className={`mt-6 w-full py-2.5 px-4 rounded-lg font-medium transition ${
                        isCurrentPlan
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                          : plan.plan === "pro"
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {checkoutLoading === plan.plan ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            className="animate-spin h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          {t("processing")}
                        </span>
                      ) : isCurrentPlan ? (
                        t("currentPlanBadge")
                      ) : (
                        t("selectPlan")
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
