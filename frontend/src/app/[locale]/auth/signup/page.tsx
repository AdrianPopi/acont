"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations, useMessages } from "next-intl";
import { Eye, EyeOff, CheckCircle2, XCircle, ChevronDown } from "lucide-react";
import Link from "next/link";

type CountriesResponse = { countries: string[] };

type UnknownRecord = Record<string, unknown>;
function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === "object" && v !== null;
}
function getNested(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (!isRecord(cur) || !(key in cur)) return undefined;
    cur = cur[key];
  }
  return cur;
}

// Phone country codes with flags
const PHONE_COUNTRIES = [
  { code: "BE", dialCode: "+32", flag: "🇧🇪", name: "Belgium" },
  { code: "NL", dialCode: "+31", flag: "🇳🇱", name: "Netherlands" },
  { code: "FR", dialCode: "+33", flag: "🇫🇷", name: "France" },
  { code: "RO", dialCode: "+40", flag: "🇷🇴", name: "Romania" },
  { code: "DE", dialCode: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "LU", dialCode: "+352", flag: "🇱🇺", name: "Luxembourg" },
  { code: "GB", dialCode: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "ES", dialCode: "+34", flag: "🇪🇸", name: "Spain" },
  { code: "IT", dialCode: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "PT", dialCode: "+351", flag: "🇵🇹", name: "Portugal" },
  { code: "AT", dialCode: "+43", flag: "🇦🇹", name: "Austria" },
  { code: "CH", dialCode: "+41", flag: "🇨🇭", name: "Switzerland" },
  { code: "PL", dialCode: "+48", flag: "🇵🇱", name: "Poland" },
];

function parseErrorText(text: string) {
  try {
    const j: unknown = JSON.parse(text);
    if (isRecord(j)) {
      const detail = j.detail;
      const message = j.message;
      if (typeof detail === "string") return detail;
      if (typeof message === "string") return message;
    }
    return text;
  } catch {
    return text;
  }
}

function isValidEmail(v: string) {
  // simplu, suficient pentru UI (backend validează final)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function SignupPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth.signup");
  const messages = useMessages();

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // common
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // merchant
  const [companyName, setCompanyName] = useState("");
  const [countryCode, setCountryCode] = useState<string>("");
  const [phoneDialCode, setPhoneDialCode] = useState("+32"); // Belgium default
  const [phoneNumber, setPhoneNumber] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false);

  // touched (ca să nu afișăm erori din prima)
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // countries from backend
  const [countries, setCountries] = useState<string[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);

  // labels din i18n: auth.signup.countries.{RO|NL|FR|BE}
  const countryLabels = useMemo(() => {
    const raw = getNested(messages, ["auth", "signup", "countries"]);
    const labels: Record<string, string> = {};
    if (isRecord(raw)) {
      for (const [k, v] of Object.entries(raw)) {
        if (typeof v === "string") labels[k] = v;
      }
    }
    return labels;
  }, [messages]);

  useEffect(() => {
    let mounted = true;

    async function loadCountries() {
      try {
        setCountriesLoading(true);
        const base = process.env.NEXT_PUBLIC_API_URL || "/api";

        const res = await fetch(`${base}/auth/countries`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) return;

        const data = (await res.json()) as CountriesResponse;
        const list = Array.isArray(data.countries) ? data.countries : [];

        if (!mounted) return;

        setCountries(list);

        if (!countryCode) {
          if (list.includes("RO")) setCountryCode("RO");
          else if (list.length > 0) setCountryCode(list[0]);
        }
      } finally {
        if (mounted) setCountriesLoading(false);
      }
    }

    loadCountries();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ reguli UI
  const emailOk = useMemo(() => isValidEmail(email), [email]);
  const passLenOk = useMemo(() => password.length >= 8, [password]);
  const passMatchOk = useMemo(
    () => password.length > 0 && password === password2,
    [password, password2]
  );
  const termsOk = acceptTerms;

  const canSubmit = useMemo(() => {
    if (!firstName.trim() || !lastName.trim() || !companyName.trim())
      return false;
    if (!emailOk) return false;
    if (!passLenOk) return false;
    if (!passMatchOk) return false;
    if (!countryCode) return false;
    if (!termsOk) return false;
    return true;
  }, [
    firstName,
    lastName,
    companyName,
    emailOk,
    passLenOk,
    passMatchOk,
    countryCode,
    termsOk,
  ]);

  function markTouched(name: string) {
    setTouched((p) => ({ ...p, [name]: true }));
  }

  function StatusLine({ ok, text }: { ok: boolean; text: string }) {
    return (
      <div className="flex items-center gap-2 text-xs mt-2">
        {ok ? (
          <CheckCircle2 size={14} className="opacity-80" />
        ) : (
          <XCircle size={14} className="opacity-80" />
        )}
        <span className="opacity-80">{text}</span>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");

    // dacă user încearcă submit, marcăm tot ca touched ca să vadă exact ce lipsește
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      password2: true,
      companyName: true,
      countryCode: true,
      acceptTerms: true,
    });

    if (!canSubmit) return;

    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const url = `${base}/auth/signup/merchant`;

      const body = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        company_name: companyName.trim(),
        country_code: countryCode,
        phone: phoneNumber.trim()
          ? `${phoneDialCode}${phoneNumber.trim()}`
          : "",
        email: email.trim(),
        password,

        // ✅ păstrăm “compat” (cum ai deja) ca să nu stricăm backend-ul
        accept_terms: acceptTerms,
        accept_privacy: acceptTerms,
        accept_privacy_policy: acceptTerms,
        accept_terms_and_privacy: acceptTerms,

        locale,
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(parseErrorText(text));

      // auto-login (cookies)
      const loginRes = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const loginText = await loginRes.text();
      if (!loginRes.ok) throw new Error(parseErrorText(loginText));

      const auth = JSON.parse(loginText) as {
        access_token: string;
        role: string;
      };

      sessionStorage.setItem("access_token", auth.access_token);
      localStorage.setItem("access_token", auth.access_token);

      router.push(`/${locale}/dashboard/merchant`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  const countryOptions = countries.length ? countries : ["RO"];

  const showEmailError = touched.email && email.length > 0 && !emailOk;
  const showPassError = touched.password && password.length > 0 && !passLenOk;
  const showMatchError =
    touched.password2 && password2.length > 0 && !passMatchOk;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-lg rounded-3xl border border-black/10 dark:border-white/10 p-6 bg-[rgb(var(--card))]"
      >
        <h1 className="text-xl font-semibold">{t("title")}</h1>

        {err && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {err}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            name="first_name"
            autoComplete="given-name"
            className="rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            onBlur={() => markTouched("firstName")}
            placeholder={t("firstName")}
          />
          <input
            name="last_name"
            autoComplete="family-name"
            className="rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onBlur={() => markTouched("lastName")}
            placeholder={t("lastName")}
          />
        </div>

        <input
          name="email"
          autoComplete="email"
          className="mt-3 w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => markTouched("email")}
          placeholder={t("email")}
        />
        {showEmailError && (
          <div className="mt-2 text-xs text-red-500">
            {t("errors.emailInvalid")}
          </div>
        )}

        <div className="mt-3 relative">
          <input
            name="password"
            autoComplete="new-password"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 pr-10"
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => markTouched("password")}
            placeholder={t("passwordMin")}
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-70 hover:opacity-100"
            aria-label={showPwd ? t("hidePassword") : t("showPassword")}
          >
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* hints */}
        <StatusLine ok={passLenOk} text={t("hints.passwordMin")} />
        {showPassError && (
          <div className="mt-2 text-xs text-red-500">
            {t("errors.passwordTooShort")}
          </div>
        )}

        <input
          name="password_confirm"
          autoComplete="new-password"
          className="mt-3 w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
          type={showPwd ? "text" : "password"}
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          onBlur={() => markTouched("password2")}
          placeholder={t("passwordConfirm")}
        />
        <StatusLine ok={passMatchOk} text={t("hints.passwordMatch")} />
        {showMatchError && (
          <div className="mt-2 text-xs text-red-500">
            {t("errors.passwordsDontMatch")}
          </div>
        )}

        {/* merchant-only fields */}
        <input
          name="company_name"
          className="mt-3 w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          onBlur={() => markTouched("companyName")}
          placeholder={t("companyName")}
        />

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              className="block text-sm opacity-80 mb-2"
              htmlFor="country_code"
            >
              {t("countryLabel")}
            </label>

            <select
              id="country_code"
              name="country_code"
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] text-black dark:text-white px-3 py-2"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              onBlur={() => markTouched("countryCode")}
              disabled={countriesLoading}
            >
              <option value="" disabled>
                {countriesLoading
                  ? t("countryLoading")
                  : t("countryPlaceholder")}
              </option>

              {countryOptions.map((code) => (
                <option key={code} value={code}>
                  {countryLabels[code] ?? code}
                </option>
              ))}
            </select>

            {touched.countryCode && !countryCode && (
              <div className="mt-2 text-xs text-red-500">
                {t("errors.countryRequired")}
              </div>
            )}
          </div>

          {/* Phone with country code dropdown */}
          <div>
            <label className="block text-sm opacity-80 mb-2" htmlFor="phone">
              {t("phone")}
            </label>
            <div className="flex w-full">
              {/* Country code dropdown */}
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPhoneDropdown(!showPhoneDropdown)}
                  className="flex items-center gap-1 h-full rounded-l-xl border border-r-0 border-black/10 dark:border-white/10 bg-[rgb(var(--card))] px-2 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition whitespace-nowrap"
                >
                  <span className="text-base">
                    {PHONE_COUNTRIES.find((c) => c.dialCode === phoneDialCode)
                      ?.flag || "🌍"}
                  </span>
                  <span className="text-xs font-medium">{phoneDialCode}</span>
                  <ChevronDown size={12} className="opacity-60" />
                </button>

                {showPhoneDropdown && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowPhoneDropdown(false)}
                    />
                    {/* Dropdown menu */}
                    <div className="absolute z-20 top-full left-0 mt-1 w-56 max-h-64 overflow-y-auto rounded-xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] shadow-lg">
                      {PHONE_COUNTRIES.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            setPhoneDialCode(country.dialCode);
                            setShowPhoneDropdown(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition ${
                            phoneDialCode === country.dialCode
                              ? "bg-emerald-50 dark:bg-emerald-900/20"
                              : ""
                          }`}
                        >
                          <span className="text-lg">{country.flag}</span>
                          <span className="flex-1 text-left">
                            {country.name}
                          </span>
                          <span className="opacity-60 font-medium">
                            {country.dialCode}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Phone number input */}
              <input
                id="phone"
                name="phone"
                autoComplete="tel-national"
                type="tel"
                inputMode="numeric"
                className="flex-1 min-w-0 rounded-r-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                value={phoneNumber}
                onChange={(e) =>
                  setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))
                }
                onBlur={() => markTouched("phone")}
                placeholder="123 456 789"
              />
            </div>
          </div>
        </div>

        {/* checkbox */}
        <label className="mt-4 flex items-start gap-3 text-sm opacity-90">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-black/20 dark:border-white/20 bg-transparent"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            onBlur={() => markTouched("acceptTerms")}
          />
          <span className="leading-5">
            {t("acceptPrefix")}{" "}
            <Link
              href={`/${locale}/legal/terms`}
              className="underline underline-offset-4 hover:opacity-90"
              target="_blank"
              rel="noreferrer"
            >
              {t("termsLink")}
            </Link>{" "}
            {t("acceptAnd")}{" "}
            <Link
              href={`/${locale}/legal/privacy`}
              className="underline underline-offset-4 hover:opacity-90"
              target="_blank"
              rel="noreferrer"
            >
              {t("privacyLink")}
            </Link>
            {t("acceptSuffix")}
          </span>
        </label>
        {touched.acceptTerms && !acceptTerms && (
          <div className="mt-2 text-xs text-red-500">
            {t("errors.mustAccept")}
          </div>
        )}

        <button
          disabled={!canSubmit || loading}
          className="mt-5 w-full rounded-2xl bg-brand-gradient px-4 py-2 text-black font-medium shadow-glow disabled:opacity-60"
        >
          {loading ? t("creating") : t("createAccount")}
        </button>

        <div className="mt-4 text-xs opacity-70">
          {t("hints.loginInstead")}{" "}
          <Link
            className="underline underline-offset-4"
            href={`/${locale}/auth/login`}
          >
            {t("hints.loginLink")}
          </Link>
        </div>
      </form>
    </div>
  );
}
