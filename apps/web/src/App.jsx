import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowsClockwise,
  Bank,
  Bell,
  CalendarBlank,
  Camera,
  CameraSlash,
  CaretDown,
  Car,
  CarProfile,
  Check,
  CheckCircle,
  Clock,
  CreditCard,
  DownloadSimple,
  FileText,
  FileMagnifyingGlass,
  Gavel,
  Globe,
  Headphones,
  House,
  Info,
  IdentificationCard,
  ListChecks,
  List,
  MagnifyingGlass,
  MapPin,
  PersonArmsSpread,
  Plus,
  Receipt,
  SealCheck,
  Signpost,
  SquaresFour,
  Stamp,
  ShieldCheck,
  SignIn,
  UserCircle,
  Wallet,
  WarningCircle,
  WifiSlash,
  X,
} from "@phosphor-icons/react";

const CASE_ID = "CN-DEMO-WRONG-VEHICLE";
const DEMO_VALUES = {
  VEHICLE: "UP16NX2041",
  CHALLAN: "CN-GUEST-CHALLAN",
  DL: "DL-GUEST-2026",
};

const DEFAULT_ACCOUNT_ID = "DEMO-CITIZEN-01";

const ISSUE_DETAIL_DEFAULTS = {
  WRONG_VEHICLE: { mismatchFields: ["VEHICLE_TYPE", "COLOUR"] },
  ALREADY_PAID: {
    paymentReference: "DEMO-PAY-2026-4182",
    paymentDate: "2026-08-12",
    amountPaise: 100000,
  },
  DUPLICATE_CHALLAN: { relatedCaseId: "CN-DEMO-QUASHED" },
  VEHICLE_SOLD: { transferDate: "2026-07-10" },
  WRONG_DRIVER: { nominationDeclarationAccepted: false },
  EVIDENCE_UNCLEAR: { unclearFields: ["PLATE"] },
};

const ISSUE_STATEMENTS = {
  WRONG_VEHICLE:
    "The camera read my registered plate number, but the vehicle shown is a black scooter. My registered vehicle for this plate is a red motorcycle, so the vehicle body and colour do not match the registry profile.",
  ALREADY_PAID:
    "I completed this payment earlier, but the challan still appears open. Please reconcile the supplied payment reference with the challan ledger.",
  DUPLICATE_CHALLAN:
    "This challan appears to duplicate another notice for the same vehicle, event time and location. Please compare both records.",
  VEHICLE_SOLD:
    "The ownership transfer became effective before this event. Please compare the event date with the synthetic transfer acknowledgement.",
  WRONG_DRIVER:
    "I was not driving during this event. Please use the nomination route supported by the configured demo jurisdiction.",
  EVIDENCE_UNCLEAR:
    "The enforcement evidence does not clearly establish the selected details. Please review the original media and source metadata.",
};

const REVIEW_OUTCOMES = {
  QUASHED: {
    label: "Quash with reasons",
    reasonCode: "CITIZEN_EVIDENCE_ACCEPTED",
    explanation: "The submitted evidence supports the selected grievance reason. The challan is quashed with a recorded order.",
  },
  PAID: {
    label: "Confirm prior payment",
    reasonCode: "PRIOR_PAYMENT_CONFIRMED",
    explanation: "The payment reference, amount and date reconcile with the synthetic provider record. The challan is marked paid without requesting another payment.",
  },
  RECONCILIATION: {
    label: "Send to reconciliation",
    reasonCode: "PAYMENT_LEDGER_RECONCILIATION",
    explanation: "The provider reference requires a ledger reconciliation. The case is routed to the payment reconciliation team and no repeat payment is requested.",
  },
  REROUTED: {
    label: "Reroute case",
    reasonCode: "RESPONSIBLE_AUTHORITY_ROUTE",
    explanation: "The configured jurisdiction process requires another responsible authority. The packet is rerouted with its evidence and audit history intact.",
  },
  REJECTED: {
    label: "Reject with reasons",
    reasonCode: "CLAIM_NOT_ESTABLISHED",
    explanation: "The submitted packet does not establish the selected grievance reason. The reasoned order records the evidence considered and the applicable next remedy.",
  },
};

const MISSING_ITEM_REQUESTS = {
  WRONG_VEHICLE: ["CLEAR_VEHICLE_PHOTO", "Please add the synthetic registered-vehicle photo so the body type and colour can be compared with the retained frame."],
  ALREADY_PAID: ["SYNTHETIC_PAYMENT_RECEIPT_OR_REFERENCE", "Please add the synthetic payment receipt or provider reference so the payment and challan ledgers can be reconciled."],
  DUPLICATE_CHALLAN: ["RELATED_CASE_REFERENCE", "Please confirm the related synthetic challan so event time, location, offence and source can be compared."],
  VEHICLE_SOLD: ["SYNTHETIC_TRANSFER_ACKNOWLEDGEMENT", "Please add the synthetic transfer acknowledgement so its effective date can be compared with the event date."],
  WRONG_DRIVER: ["SYNTHETIC_NOMINATION_DECLARATION", "Please complete the synthetic nomination declaration required by the configured jurisdiction route."],
  EVIDENCE_UNCLEAR: ["UNCLEAR_ELEMENT_SELECTION", "Please identify the exact evidence element that remains unclear so the retained source record can be reviewed."],
};

const humanizeCode = (value) =>
  String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());

const COPY = {
  en: {
    language: "Language",
    citizenServices: "Citizen services",
    reviewerDemo: "Reviewer demo",
    title: "Understand your challan. Move forward with clarity.",
    subtitle:
      "Check the facts, review your options and take the right next step.",
    lookupTitle: "Find your challan",
    lookupHint:
      "The demo vehicle number is already filled in. Complete the human check to open it.",
    challan: "Challan number",
    vehicle: "Vehicle number",
    dl: "Driving licence",
    humanCheck: "Human check",
    getDetails: "Get challan details",
    demoDetails: "Use demo details",
    demoReady: "Demo case ready",
    openChallan: "Open challan",
    humanPrompt: "Answer this quick check to continue. What is",
    quickServices: "What you can do",
    protected: "Your lookup is protected",
    protectedCopy:
      "Synthetic demo only. No Aadhaar, card, real OTP or real personal information is collected.",
  },
  hi: {
    language: "भाषा",
    citizenServices: "नागरिक सेवाएँ",
    reviewerDemo: "समीक्षक डेमो",
    title: "अपना चालान समझें। सही अगला कदम चुनें।",
    subtitle:
      "तथ्य देखें, अपने विकल्प समझें और सही कार्रवाई करें।",
    lookupTitle: "अपना चालान खोजें",
    lookupHint:
      "डेमो वाहन नंबर पहले से भरा है। मानव जाँच पूरी करके इसे खोलें।",
    challan: "चालान नंबर",
    vehicle: "वाहन नंबर",
    dl: "ड्राइविंग लाइसेंस",
    humanCheck: "मानव जाँच",
    getDetails: "चालान विवरण देखें",
    demoDetails: "डेमो विवरण भरें",
    demoReady: "डेमो मामला तैयार है",
    openChallan: "चालान खोलें",
    humanPrompt: "आगे बढ़ने के लिए यह आसान जाँच पूरी करें। कितना है",
    quickServices: "आप क्या कर सकते हैं",
    protected: "आपकी खोज सुरक्षित है",
    protectedCopy:
      "इस प्रोटोटाइप में आधार, बैंक खाता, कार्ड, OTP या वास्तविक व्यक्तिगत जानकारी नहीं ली जाती।",
  },
  te: {
    language: "భాష",
    citizenServices: "పౌర సేవలు",
    reviewerDemo: "సమీక్షకుడి డెమో",
    title: "మీ చలాన్‌ను అర్థం చేసుకోండి. సరైన తదుపరి చర్య తీసుకోండి.",
    subtitle:
      "వాస్తవాలను తనిఖీ చేసి, మీ ఎంపికలను అర్థం చేసుకుని ముందుకు సాగండి.",
    lookupTitle: "మీ చలాన్‌ను కనుగొనండి",
    lookupHint:
      "డెమో వాహన నంబర్ ముందే నింపబడింది. మానవ నిర్ధారణ పూర్తి చేసి తెరవండి.",
    challan: "చలాన్ నంబర్",
    vehicle: "వాహన నంబర్",
    dl: "డ్రైవింగ్ లైసెన్స్",
    humanCheck: "మానవ నిర్ధారణ",
    getDetails: "చలాన్ వివరాలు చూడండి",
    demoDetails: "డెమో వివరాలు వాడండి",
    demoReady: "డెమో కేసు సిద్ధంగా ఉంది",
    openChallan: "చలాన్ తెరవండి",
    humanPrompt: "కొనసాగడానికి ఈ సులభమైన తనిఖీని పూర్తి చేయండి. ఎంత",
    quickServices: "మీరు చేయగలిగేవి",
    protected: "మీ శోధన రక్షితంగా ఉంది",
    protectedCopy:
      "ఈ ప్రోటోటైప్ ఆధార్, బ్యాంకు ఖాతా, కార్డు, OTP లేదా నిజమైన వ్యక్తిగత సమాచారాన్ని సేకరించదు.",
  },
};

const CITIZEN_SESSION_KEY = "challan-nyay-citizen-session";
const REVIEWER_SESSION_KEY = "challan-nyay-reviewer-session";

async function createCitizenSession() {
  const response = await fetch("/api/demo/sessions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  if (!response.ok) throw new Error("The synthetic workspace could not be started. Refresh and try again.");
  const body = await response.json();
  window.localStorage.setItem(CITIZEN_SESSION_KEY, body.token);
  window.localStorage.removeItem(REVIEWER_SESSION_KEY);
  return body.token;
}

async function citizenSessionToken() {
  return window.localStorage.getItem(CITIZEN_SESSION_KEY) || createCitizenSession();
}

async function request(path, options = {}) {
  const { auth = path.startsWith("/api/authority/") ? "reviewer" : "citizen", retrySession = true, ...fetchOptions } = options;
  let token = null;
  if (auth === "citizen") token = await citizenSessionToken();
  if (auth === "reviewer") token = window.localStorage.getItem(REVIEWER_SESSION_KEY);
  if (auth === "reviewer" && !token) throw new Error("Sign in to the synthetic reviewer workspace to continue.");
  const response = await fetch(path, {
    ...fetchOptions,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
  });

  if (response.status === 401 && retrySession && auth === "citizen") {
    window.localStorage.removeItem(CITIZEN_SESSION_KEY);
    window.localStorage.removeItem(REVIEWER_SESSION_KEY);
    return request(path, { ...options, retrySession: false });
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    await response.text();
    throw new Error(
      "The challan service is temporarily unavailable. Refresh and try again.",
    );
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(
      "The challan service returned an incomplete response. Refresh and try again.",
    );
  }
  if (!response.ok)
    throw new Error(body.message || "The request could not be completed.");
  return body;
}

async function createReviewerSession(accessCode) {
  const body = await request("/api/authority/sessions", {
    method: "POST",
    auth: "citizen",
    body: JSON.stringify({ accessCode }),
  });
  window.localStorage.setItem(REVIEWER_SESSION_KEY, body.token);
  return body;
}

const formatMoney = (paise) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
const formatDate = (value, includeTime = false) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "numeric", minute: "2-digit" } : {}),
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));

const vehicleDisplayName = (vehicle) =>
  vehicle.label || [vehicle.make, vehicle.model].filter(Boolean).join(" ") || vehicle.type;

function VehicleThumbnail({ vehicle, className = "vehicle-thumbnail" }) {
  if (!vehicle?.imageAssetPath) {
    return <span className={`${className} vehicle-thumbnail-fallback`}><Car size={24} /></span>;
  }
  return (
    <img
      className={className}
      src={vehicle.imageAssetPath}
      alt={`${vehicleDisplayName(vehicle)}, ${vehicle.colour.toLowerCase()} ${vehicle.type.toLowerCase()}`}
      loading="lazy"
      decoding="async"
    />
  );
}

function LowDataPlaceholder({ onLoad, label = "Load evidence and map" }) {
  return (
    <div className="low-data-placeholder" role="status">
      <WifiSlash size={28} weight="duotone" />
      <div><strong>Media preview paused</strong><small>Case facts, source metadata and actions remain available.</small></div>
      <button className="button secondary compact-button" type="button" onClick={onLoad}>{label}</button>
    </div>
  );
}

function UtilityBar({
  language,
  onLanguageChange,
  fontScale,
  onFontScale,
  highContrast,
  onContrast,
  lowData,
  onLowData,
}) {
  return (
    <div className="utility-bar">
      <div className="utility-inner">
        <span className="prototype-label">
          <ShieldCheck size={15} weight="fill" /> Independent prototype |
          synthetic data only | not a government website
        </span>
        <div className="utility-actions">
          <div className="font-controls" aria-label="Text size">
            <button
              type="button"
              onClick={() => onFontScale(Math.max(0.92, fontScale - 0.08))}
              aria-label="Decrease text size"
            >
              A−
            </button>
            <button
              type="button"
              onClick={() => onFontScale(1)}
              aria-label="Reset text size"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => onFontScale(Math.min(1.16, fontScale + 0.08))}
              aria-label="Increase text size"
            >
              A+
            </button>
          </div>
          <button
            className={`utility-button ${highContrast ? "selected" : ""}`}
            type="button"
            onClick={onContrast}
          >
            <PersonArmsSpread size={16} /> <span className="utility-button-label">High contrast</span>
          </button>
          <button
            className={`utility-button ${lowData ? "selected" : ""}`}
            type="button"
            onClick={onLowData}
            aria-pressed={lowData}
            title="Pause hero, evidence, vehicle and map previews. Text, status, receipts and actions stay available."
          >
            <WifiSlash size={16} /> <span className="utility-button-label">Low data</span>
          </button>
          <label className="language-control">
            <Globe size={16} />
            <span className="sr-only">Choose language</span>
            <select
              value={language}
              onChange={(event) => onLanguageChange(event.target.value)}
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="te">తెలుగు</option>
            </select>
          </label>
        </div>
        <details className="mobile-utility-disclosure">
          <summary aria-label="Accessibility, language and data settings">
            <PersonArmsSpread size={17} /> <span>Access & language</span>
          </summary>
          <div className="mobile-utility-panel">
            <div className="font-controls" aria-label="Text size">
              <button type="button" onClick={() => onFontScale(Math.max(0.92, fontScale - 0.08))} aria-label="Decrease text size">A−</button>
              <button type="button" onClick={() => onFontScale(1)} aria-label="Reset text size">A</button>
              <button type="button" onClick={() => onFontScale(Math.min(1.16, fontScale + 0.08))} aria-label="Increase text size">A+</button>
            </div>
            <button className={`utility-button ${highContrast ? "selected" : ""}`} type="button" onClick={onContrast} aria-pressed={highContrast}>
              <PersonArmsSpread size={16} /> <span>Contrast</span>
            </button>
            <button className={`utility-button ${lowData ? "selected" : ""}`} type="button" onClick={onLowData} aria-pressed={lowData} title="Pause media previews while keeping facts and actions available">
              <WifiSlash size={16} /> <span>Low data</span>
            </button>
            <label className="language-control">
              <Globe size={16} /><span className="sr-only">Choose language</span>
              <select value={language} onChange={(event) => onLanguageChange(event.target.value)}>
                <option value="en">English</option><option value="hi">हिन्दी</option><option value="te">తెలుగు</option>
              </select>
            </label>
          </div>
        </details>
      </div>
    </div>
  );
}

function Header({
  section,
  onCitizen,
  onDashboard,
  onChallans,
  onServices,
  onReviewer,
  accountActive,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function navigate(action) {
    setMobileMenuOpen(false);
    action();
  }

  function goTo(id) {
    setMobileMenuOpen(false);
    onCitizen();
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }
  return (
    <header className="site-header">
      <div className="header-inner">
        <button
          className="brand"
          type="button"
          onClick={() => navigate(onCitizen)}
          aria-label="Challan Nyay home"
        >
          <span className="brand-mark">
            <ShieldCheck size={22} weight="fill" />
          </span>
          <span>
            <strong>Challan Nyay</strong>
            <small>{section === "reviewer" ? "Protected synthetic reviewer workspace" : "Independent citizen-service prototype"}</small>
          </span>
        </button>
        <nav
          className={`primary-nav ${mobileMenuOpen ? "mobile-open" : ""}`}
          id="primary-navigation"
          aria-label="Primary navigation"
        >
          {section === "reviewer" ? (
            <button onClick={() => navigate(onCitizen)} type="button">
              <ArrowLeft size={18} /> Return to citizen site
            </button>
          ) : (
            <>
              <button className={section === "gateway" ? "active" : ""} onClick={() => navigate(onCitizen)} type="button">
                <House size={18} /> Home
              </button>
              <button className={section === "services" ? "active" : ""} onClick={() => navigate(onServices)} type="button">
                <SquaresFour size={18} /> Services
              </button>
              <button onClick={() => goTo("service-journey")} type="button">
                <Info size={18} /> How it works
              </button>
              <button onClick={() => goTo("citizen-help")} type="button">
                <Headphones size={18} /> Help
              </button>
              <button className={["challans", "case"].includes(section) ? "active" : ""} onClick={() => navigate(onChallans)} type="button">
                <ListChecks size={18} /> My challans
              </button>
              <button
                className="reviewer-entry"
                onClick={() => navigate(onReviewer)}
                type="button"
                title="Open the separate synthetic authority workspace"
              >
                <Gavel size={18} /> Authority workspace
              </button>
            </>
          )}
        </nav>
        <div className="header-actions">
          {section !== "reviewer" && (
            <button
              className="account-entry"
              onClick={() => navigate(onDashboard)}
              type="button"
              aria-label={accountActive ? "Open demo account" : "Create demo account"}
              title={accountActive ? "Demo account" : "Create demo account"}
            >
              {accountActive ? <UserCircle size={19} /> : <SignIn size={19} />}
              {accountActive ? "Demo account" : "Create demo account"}
            </button>
          )}
          <button
            className="mobile-nav-toggle"
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="primary-navigation"
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={21} /> : <List size={21} />}
          </button>
        </div>
      </div>
    </header>
  );
}

function CitizenGateway({ language, onFound, lowData }) {
  const copy = COPY[language];
  const [lookupType, setLookupType] = useState("VEHICLE");
  const [query, setQuery] = useState(DEMO_VALUES.VEHICLE);
  const [challenge, setChallenge] = useState(null);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lookupRef = useRef(null);

  async function refreshChallenge() {
    setChallenge(null);
    setChallengeAnswer("");
    try {
      const result = await request("/api/lookup/challenge");
      setChallenge(result.challenge);
    } catch (reason) {
      setError(reason.message);
    }
  }

  useEffect(() => {
    refreshChallenge();
  }, []);

  function chooseType(type) {
    setLookupType(type);
    setQuery(DEMO_VALUES[type]);
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await request("/api/cases/lookup", {
        method: "POST",
        body: JSON.stringify({
          lookupType,
          query,
          challengeId: challenge?.id,
          challengeAnswer,
        }),
      });
      await onFound(result.match.caseId);
    } catch (reason) {
      setError(reason.message);
      await refreshChallenge();
    } finally {
      setLoading(false);
    }
  }

  const labels = { VEHICLE: copy.vehicle, CHALLAN: copy.challan, DL: copy.dl };
  return (
    <main id="main-content">
      <section className="gateway-hero">
        {!lowData && <img
          className="gateway-hero-art"
          src="/assets/challan-nyay-road-hero-v2.webp"
          alt="Illustration of cars and scooter riders travelling on a clear Indian urban road"
          decoding="async"
          fetchPriority="high"
        />}
        <div className="shell gateway-hero-inner">
          <div className="gateway-hero-copy">
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
            <a className="hero-secondary-link" href="#service-journey">
              See how the journey works <ArrowRight size={17} />
            </a>
          </div>
          <section
            className="lookup-panel hero-lookup"
            id="challan-lookup"
            ref={lookupRef}
            aria-labelledby="lookup-title"
          >
          <div className="lookup-heading">
            <div>
              <div>
                <h2 id="lookup-title">{copy.lookupTitle}</h2>
                <p>{copy.lookupHint}</p>
              </div>
            </div>
            <div className="demo-status" aria-live="polite">
              <CheckCircle size={20} weight="fill" />
              <span>
                <strong>{copy.demoReady}</strong>
                <small>{DEMO_VALUES[lookupType]}</small>
              </span>
            </div>
          </div>
          <form onSubmit={submit}>
            <fieldset className="lookup-tabs">
              <legend className="sr-only">
                Choose how to find the challan
              </legend>
              {Object.entries(labels).map(([type, label]) => (
                <label
                  key={type}
                  className={lookupType === type ? "selected" : ""}
                >
                  <input
                    type="radio"
                    name="lookupType"
                    value={type}
                    checked={lookupType === type}
                    onChange={() => chooseType(type)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>
            <div className="lookup-action-row">
              <div>
                <label className="field-label" htmlFor="lookup-query">
                  {labels[lookupType]}
                </label>
                <div className="lookup-input">
                  <span className="country-prefix">IND</span>
                  <input
                    id="lookup-query"
                    value={query}
                    onChange={(event) => setQuery(event.target.value.toUpperCase())}
                    placeholder={`Enter ${labels[lookupType].toLowerCase()}`}
                    autoComplete="off"
                    required
                  />
                  <MagnifyingGlass size={21} />
                </div>
              </div>
              <button
                className="button primary lookup-submit"
                disabled={!challenge || loading}
                type="submit"
              >
                {loading ? "Checking..." : copy.openChallan}
                {!loading && <ArrowRight size={18} />}
              </button>
            </div>
            <div className="human-check">
              <div>
                <span className="field-label">{copy.humanCheck}</span>
                <p id="human-help">
                  {copy.humanPrompt}{" "}
                  <strong>{challenge?.prompt || "…"}</strong>?
                </p>
              </div>
              <input
                aria-describedby="human-help"
                aria-label={
                  challenge?.accessibilityLabel || "Human check answer"
                }
                inputMode="numeric"
                value={challengeAnswer}
                onChange={(event) => setChallengeAnswer(event.target.value)}
                required
              />
              <button
                className="icon-button"
                type="button"
                onClick={refreshChallenge}
                aria-label="Refresh human check"
              >
                <ArrowsClockwise size={19} />
              </button>
            </div>
            {error && (
              <p className="form-error" role="alert">
                <WarningCircle size={18} /> {error}
              </p>
            )}
          </form>
          <div className="lookup-privacy">
            <ShieldCheck size={20} weight="fill" />
            <div>
              <strong>{copy.protected}</strong>
              <p>{copy.protectedCopy}</p>
            </div>
          </div>
          </section>
        </div>
      </section>

      <section className="shell services-section" id="service-journey">
        <div className="journey-heading">
          <span className="eyebrow">How the service works</span>
          <h2>From notice to a recorded outcome</h2>
          <p>Every step shows the current owner, the evidence used and what happens next.</p>
        </div>
        <ol className="journey-flow">
          {[
            ["01", <CarProfile size={29} weight="duotone" />, "Find", "Vehicle-first lookup, with no account required", "entry"],
            ["02", <FileMagnifyingGlass size={29} weight="duotone" />, "Understand", "Review evidence, location, amount and applicable route", "review"],
            ["03", <Signpost size={29} weight="duotone" />, "Choose", "Pay, raise the right grievance or supply one missing item", "action"],
            ["04", <Stamp size={29} weight="duotone" />, "Resolve", "A human records the evidence considered and the reason", "decision"],
            ["05", <SealCheck size={29} weight="duotone" />, "Track", "Keep the receipt, current owner, target date and final order", "outcome"],
          ].map(([number, icon, title, description, stage]) => (
            <li className={`journey-step journey-step-${stage}`} key={number}>
              <button type="button" onClick={() => lookupRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                <span className="journey-marker"><small>{number}</small>{icon}</span>
                <span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                  {stage === "outcome" && <em className="journey-proof"><Receipt size={15} /> Receipt and final order retained</em>}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <button className="journey-cta" type="button" onClick={() => lookupRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}>
          Start with the demo vehicle <ArrowRight size={17} />
        </button>
      </section>
      <section className="shell citizen-trust-strip" id="citizen-help">
        <div>
          <ShieldCheck size={24} weight="duotone" />
          <span><strong>Independent prototype</strong><small>No government endorsement claimed</small></span>
        </div>
        <div>
          <CreditCard size={24} />
          <span><strong>No real payments</strong><small>No card, UPI ID or OTP collected</small></span>
        </div>
        <div>
          <Globe size={24} />
          <span><strong>Language pilot</strong><small>English, Hindi and Telugu entry</small></span>
        </div>
        <div>
          <Headphones size={24} />
          <span><strong>Accessible by design</strong><small>Keyboard, zoom and contrast support</small></span>
        </div>
      </section>
      <section className="shell faq-section" aria-labelledby="faq-title">
        <div className="faq-heading">
          <span className="eyebrow">Quick answers</span>
          <h2 id="faq-title">Before you act on a challan</h2>
          <p>Short, practical answers based on the official e‑Challan service journey.</p>
        </div>
        <div className="faq-list">
          {[
            ["How can I find a challan?", "Use a challan number, vehicle number or driving-licence number. This prototype keeps vehicle number first because it is the easiest starting point for most citizens."],
            ["My payment is deducted but still pending. What should I do?", "Do not pay again immediately. Check the pending-transaction or payment-status service first and keep the transaction reference for support."],
            ["How do I track a grievance?", "Use the grievance receipt or e-ticket number. A complete service should show the current owner, evidence received, review stage and decision reference."],
            ["How do I avoid fake challan links?", "Open the official portal yourself. Do not share passwords, OTPs, payment details or remote-access permissions with callers or links sent in messages."],
            ["What if the challan has moved to Virtual Court?", "Check the court status before paying. Avoid paying the same challan on two portals; use the recorded status and receipt to confirm where it was settled."],
          ].map(([question, answer]) => (
            <details className="faq-item" key={question}>
              <summary><span>{question}</span><CaretDown size={19} /></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}

function ServicesPage({ onLookup, onChallans, onDashboard }) {
  const services = [
    { icon: <MagnifyingGlass size={25} />, title: "Check challan", copy: "Search by vehicle, challan or driving licence and review evidence before acting.", action: onLookup, label: "Start lookup" },
    { icon: <ListChecks size={25} />, title: "Manage challans", copy: "Filter every notice across saved vehicles, with status, amount, location and next action.", action: onChallans, label: "View challans" },
    { icon: <Gavel size={25} />, title: "Raise and track a grievance", copy: "Choose a reason, attach evidence, receive a receipt and follow the review decision.", action: onChallans, label: "Open cases" },
    { icon: <CreditCard size={25} />, title: "Payments and receipts", copy: "Use the safe mock payment flow and retain provider, ledger and receipt references.", action: onDashboard, label: "View payments" },
    { icon: <Car size={25} />, title: "Saved vehicles", copy: "See all authorized demo vehicles connected to a citizen or fleet account.", action: onDashboard, label: "Manage vehicles" },
  ];
  return (
    <main id="main-content" className="services-page">
      <section className="services-page-hero">
        <div className="shell">
          <span className="eyebrow">Citizen service catalogue</span>
          <h1>Everything needed to resolve a challan.</h1>
          <p>One calm journey for lookup, evidence, payment, grievance and accountable review.</p>
        </div>
      </section>
      <section className="shell service-catalogue" aria-label="Available demo services">
        {services.map((service, index) => (
          <button key={service.title} className="catalogue-card" type="button" onClick={() => service.action()}>
            <span className={`catalogue-number n${index + 1}`}>{service.icon}</span>
            <span><strong>{service.title}</strong><small>{service.copy}</small><em>{service.label} <ArrowRight size={15} /></em></span>
          </button>
        ))}
      </section>
    </main>
  );
}

function LoadingState() {
  return (
    <main className="shell loading-state">
      <span className="spinner" /> Loading the synthetic service…
    </main>
  );
}

function DialogShell({ eyebrow, title, onClose, children }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const dialog = closeRef.current?.closest("[role='dialog']");
    const backdrop = closeRef.current?.closest(".dialog-backdrop");
    const appRoot = backdrop?.parentElement;
    const obscured = appRoot
      ? [...appRoot.children].filter((element) => element !== backdrop)
      : [];
    const previous = obscured.map((element) => ({
      element,
      ariaHidden: element.getAttribute("aria-hidden"),
      inert: element.inert,
    }));
    for (const element of obscured) {
      element.setAttribute("aria-hidden", "true");
      element.inert = true;
    }
    closeRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = [...dialog.querySelectorAll(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])",
      )].filter((element) => !element.hidden && element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      for (const state of previous) {
        state.element.inert = state.inert;
        if (state.ariaHidden === null) state.element.removeAttribute("aria-hidden");
        else state.element.setAttribute("aria-hidden", state.ariaHidden);
      }
    };
  }, [onClose]);
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className={`dialog ${eyebrow === "Guided dispute" ? "dialog-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="dialog-head">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h2 id="dialog-title">{title}</h2>
          </div>
          <button
            className="icon-button"
            ref={closeRef}
            onClick={onClose}
            type="button"
            aria-label="Close dialog"
          >
            <X size={21} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function AccountDialog({ onClose, onReady }) {
  const [step, setStep] = useState("mobile");
  const [mobileToken, setMobileToken] = useState("+91 DEMO 000 001");
  const [otp, setOtp] = useState("");
  const DEMO_OTP = "246810";

  function sendOtp(event) {
    event.preventDefault();
    setStep("otp");
  }

  function verifyOtp(event) {
    event.preventDefault();
    if (otp === DEMO_OTP) onReady();
  }

  return (
    <DialogShell
      eyebrow="Optional demo account"
      title="See every vehicle you manage"
      onClose={onClose}
    >
      {step === "mobile" ? (
        <form onSubmit={sendOtp}>
          <div className="account-explainer">
            <ShieldCheck size={24} weight="fill" />
            <div>
              <strong>Future architecture: mobile verification</strong>
              <p>
                An authorized registry adapter would return vehicles linked to
                the verified citizen. Challan Nyay would not copy or own the
                registry record.
              </p>
            </div>
          </div>
          <label className="field-label" htmlFor="demo-mobile">
            Synthetic mobile identifier
          </label>
          <input
            className="text-field"
            id="demo-mobile"
            value={mobileToken}
            onChange={(event) => setMobileToken(event.target.value)}
            required
          />
          <p className="field-help">
            Use only the prefilled demo value. No SMS is sent and no real number
            is stored.
          </p>
          <div className="dialog-actions">
            <button className="button secondary" type="button" onClick={onClose}>
              Continue as guest
            </button>
            <button className="button primary" type="submit">
              Send demo OTP <ArrowRight size={18} />
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={verifyOtp}>
          <div className="demo-otp-callout">
            <span>Demo OTP</span>
            <strong>{DEMO_OTP}</strong>
            <small>Shown openly so judges can test without external access.</small>
          </div>
          <label className="field-label" htmlFor="demo-otp">
            Enter the six-digit demo OTP
          </label>
          <input
            className="text-field otp-field"
            id="demo-otp"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
            required
          />
          {otp.length === 6 && otp !== DEMO_OTP && (
            <p className="form-error" role="alert">
              <WarningCircle size={18} /> Use the demo OTP shown above.
            </p>
          )}
          <div className="dialog-actions">
            <button className="button secondary" type="button" onClick={() => setStep("mobile")}>
              Back
            </button>
            <button className="button primary" disabled={otp !== DEMO_OTP} type="submit">
              Verify and open account <ArrowRight size={18} />
            </button>
          </div>
        </form>
      )}
    </DialogShell>
  );
}

function ContestDialog({ caseRecord, initialGround = "WRONG_VEHICLE", onClose, onSubmitted }) {
  const safeInitialGround = ISSUE_STATEMENTS[initialGround] ? initialGround : "WRONG_VEHICLE";
  const [ground, setGround] = useState(safeInitialGround);
  const [statement, setStatement] = useState(ISSUE_STATEMENTS[safeInitialGround]);
  const [issueDetails, setIssueDetails] = useState(ISSUE_DETAIL_DEFAULTS[safeInitialGround]);
  const [contracts, setContracts] = useState([]);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [draftVersion, setDraftVersion] = useState(0);
  const [draftStatus, setDraftStatus] = useState("Loading saved draft…");
  const [draftTouched, setDraftTouched] = useState(false);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const draftVersionRef = useRef(0);
  const saveTimerRef = useRef(null);
  const currentContract = contracts.find((contract) => contract.code === ground);

  useEffect(() => {
    let active = true;
    Promise.all([
      request("/api/dispute-ground-contracts"),
      request(`/api/cases/${caseRecord.id}/contest-draft`),
    ]).then(([contractResult, draftResult]) => {
      if (!active) return;
      setContracts(contractResult.contracts);
      if (draftResult.draft) {
        const draft = draftResult.draft;
        setGround(draft.ground);
        setStatement(draft.statement);
        setIssueDetails(draft.issueDetails);
        setAccepted(draft.declarationAccepted);
        setDraftVersion(draft.version);
        draftVersionRef.current = draft.version;
        setDraftStatus(`Draft restored · version ${draft.version}`);
      } else {
        setDraftStatus("Draft ready");
      }
      setDraftHydrated(true);
    }).catch((reason) => {
      if (!active) return;
      setError(reason.message);
      setDraftStatus("Draft unavailable");
      setDraftHydrated(true);
    });
    return () => {
      active = false;
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [caseRecord.id]);

  async function saveDraft({ closeAfter = false } = {}) {
    if (!draftHydrated) return false;
    if (!draftTouched) {
      if (closeAfter) onClose();
      return true;
    }
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    setDraftStatus("Saving draft…");
    setError("");
    try {
      const result = await request(`/api/cases/${caseRecord.id}/contest-draft`, {
        method: "PUT",
        body: JSON.stringify({
          expectedDraftVersion: draftVersionRef.current,
          ground,
          statement,
          issueDetails,
          declarationAccepted: accepted,
        }),
      });
      draftVersionRef.current = result.draft.version;
      setDraftVersion(result.draft.version);
      setDraftTouched(false);
      setDraftStatus(`Saved · version ${result.draft.version}`);
      if (closeAfter) onClose();
      return true;
    } catch (reason) {
      setError(reason.message);
      setDraftStatus("Draft not saved");
      return false;
    }
  }

  useEffect(() => {
    if (!draftHydrated || !draftTouched || submitting) return undefined;
    saveTimerRef.current = window.setTimeout(() => saveDraft(), 700);
    return () => window.clearTimeout(saveTimerRef.current);
  }, [ground, statement, issueDetails, accepted, draftHydrated, draftTouched, submitting]);

  function markDraftChanged() {
    setDraftTouched(true);
    setDraftStatus("Unsaved changes");
  }

  function chooseGround(value) {
    setGround(value);
    setIssueDetails({ ...ISSUE_DETAIL_DEFAULTS[value] });
    setStatement(ISSUE_STATEMENTS[value]);
    setError("");
    markDraftChanged();
  }

  function updateIssueDetail(code, value) {
    setIssueDetails((current) => ({ ...current, [code]: value }));
    markDraftChanged();
  }

  function toggleIssueChoice(code, value, checked) {
    const current = Array.isArray(issueDetails[code]) ? issueDetails[code] : [];
    updateIssueDetail(
      code,
      checked ? [...new Set([...current, value])] : current.filter((item) => item !== value),
    );
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = await request(
        `/api/cases/${caseRecord.id}/contest-submissions`,
        {
          method: "POST",
          headers: {
            "idempotency-key": `contest-${caseRecord.id}-v${caseRecord.version}`,
          },
          body: JSON.stringify({
            expectedVersion: caseRecord.version,
            ground,
            statement,
            issueDetails,
            declarationAccepted: accepted,
          }),
        },
      );
      onSubmitted(result.case);
    } catch (reason) {
      setError(reason.message);
      setSubmitting(false);
    }
  }
  return (
    <DialogShell
      eyebrow="Guided dispute"
      title="Raise a dispute"
      onClose={() => saveDraft({ closeAfter: true })}
    >
      <form onSubmit={submit}>
        <ol className="contest-progress" aria-label="Dispute progress">
          <li className="active">Choose reason</li>
          <li>Review evidence</li>
          <li>Submit</li>
        </ol>
        <div className="contest-layout">
          <div className="contest-main">
            <h3>Choose a reason</h3>
            <p className="contest-intro">Select the reason that best matches the evidence. Every submission receives a trackable receipt.</p>
            <div className="dispute-reason-grid">
              {[
                ["WRONG_VEHICLE", <Car size={21} />, "Incorrect vehicle", "The plate or vehicle is not mine"],
                ["ALREADY_PAID", <Wallet size={21} />, "Already paid", "I have a valid payment reference"],
                ["DUPLICATE_CHALLAN", <Receipt size={21} />, "Duplicate challan", "The same event appears twice"],
                ["VEHICLE_SOLD", <IdentificationCard size={21} />, "Vehicle sold", "Ownership changed before the event"],
                ["WRONG_DRIVER", <UserCircle size={21} />, "Wrong driver", "Another person was driving"],
                ["EVIDENCE_UNCLEAR", <Camera size={21} />, "Evidence unclear", "The image or details are insufficient"],
              ].map(([value, icon, title, copy]) => <label className={ground === value ? "selected" : ""} key={value}>
                <input type="radio" name="ground" value={value} checked={ground === value} onChange={() => chooseGround(value)} />
                <span className="reason-icon">{icon}</span>
                <span><strong>{title}</strong><small>{copy}</small></span>
                {ground === value && <CheckCircle size={18} weight="fill" />}
              </label>)}
            </div>
            {currentContract ? (
              <section className="issue-specific-panel" aria-labelledby="issue-details-title">
                <div className="issue-specific-heading">
                  <div>
                    <h3 id="issue-details-title">Details for this issue</h3>
                    <p>{currentContract.citizenPrompt}</p>
                  </div>
                  <span>{humanizeCode(currentContract.routingTag)}</span>
                </div>
                <div className="issue-fields">
                  {currentContract.fields.map((definition) =>
                    definition.type === "MULTI_SELECT" ? (
                      <fieldset className="issue-choice-field" key={definition.code}>
                        <legend>{definition.label}</legend>
                        <div>
                          {definition.choices.map((choice) => (
                            <label key={choice}>
                              <input
                                type="checkbox"
                                checked={(issueDetails[definition.code] || []).includes(choice)}
                                onChange={(event) => toggleIssueChoice(definition.code, choice, event.target.checked)}
                              />
                              <span>{humanizeCode(choice)}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ) : definition.type === "BOOLEAN" ? (
                      <label className="issue-boolean-field" key={definition.code}>
                        <input
                          type="checkbox"
                          checked={issueDetails[definition.code] === true}
                          onChange={(event) => updateIssueDetail(definition.code, event.target.checked)}
                        />
                        <span>{definition.label}</span>
                      </label>
                    ) : (
                      <label className="issue-text-field" key={definition.code}>
                        <span>{definition.label}</span>
                        <input
                          type={definition.type === "DATE" ? "date" : definition.type === "MONEY_PAISE" ? "number" : "text"}
                          min={definition.type === "MONEY_PAISE" ? "1" : undefined}
                          value={definition.type === "MONEY_PAISE" ? (issueDetails[definition.code] || 0) / 100 : issueDetails[definition.code] || ""}
                          onChange={(event) =>
                            updateIssueDetail(
                              definition.code,
                              definition.type === "MONEY_PAISE"
                                ? Math.round(Number(event.target.value) * 100)
                                : event.target.value,
                            )
                          }
                          required={definition.required}
                        />
                      </label>
                    ),
                  )}
                </div>
                <div className="issue-evidence-list">
                  <strong>Evidence checklist</strong>
                  <span>
                    {currentContract.requiredEvidence.map(humanizeCode).join(", ")}
                  </span>
                  {currentContract.recommendedEvidence.length > 0 && (
                    <small>
                      Helpful: {currentContract.recommendedEvidence.map(humanizeCode).join(", ")}
                    </small>
                  )}
                </div>
              </section>
            ) : (
              <div className="issue-specific-loading" aria-live="polite">
                Loading issue-specific guidance...
              </div>
            )}
            <label className="field-label" htmlFor="statement">
              What should the reviewer know?
            </label>
            <textarea
              id="statement"
              value={statement}
              onChange={(event) => {
                setStatement(event.target.value);
                markDraftChanged();
              }}
              minLength={20}
              required
            />
            <div className="evidence-note">
              <FileText size={21} />
              <span>
                <strong>Issue-specific packet ready</strong>
                <small>
                  {currentContract
                    ? currentContract.requiredEvidence.map(humanizeCode).join(", ")
                    : "Loading required evidence"}
                </small>
              </span>
            </div>
            <label className="declaration">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => {
                  setAccepted(event.target.checked);
                  markDraftChanged();
                }}
              />
              <span>
                I understand this is a synthetic demonstration, not a filing with an authority.
              </span>
            </label>
          </div>
          <aside className="contest-case-summary">
            <span>Selected challan</span>
            <strong>{caseRecord.id}</strong>
            <dl>
              <div><dt>Amount</dt><dd>{formatMoney(caseRecord.allegation.amountPaise)}</dd></div>
              <div><dt>Vehicle</dt><dd>{caseRecord.registeredVehicle.registration}</dd></div>
              <div><dt>Location</dt><dd>{caseRecord.allegation.location}</dd></div>
              <div><dt>Violation</dt><dd>{caseRecord.allegation.offence}</dd></div>
            </dl>
          </aside>
        </div>
        {error && (
          <p className="form-error" role="alert">
            <WarningCircle size={18} /> {error}
          </p>
        )}
        <div className="dialog-actions">
          <span className={`draft-save-status ${draftStatus.includes("not saved") ? "error" : ""}`} role="status">
            <CheckCircle size={17} /> {draftStatus}{draftVersion > 0 && draftTouched ? ` · based on version ${draftVersion}` : ""}
          </span>
          <button className="button secondary" type="button" onClick={() => saveDraft({ closeAfter: true })}>
            Save &amp; close
          </button>
          <button
            className="button primary"
            disabled={!accepted || submitting || !currentContract}
            type="submit"
          >
            {submitting ? "Submitting…" : "Submit contest"}{" "}
            {!submitting && <ArrowRight size={18} />}
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

function PaymentDialog({ caseRecord, onClose, onPaid }) {
  const [method, setMethod] = useState("DEMO_UPI");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = await request(
        `/api/cases/${caseRecord.id}/payment-attempts`,
        {
          method: "POST",
          headers: {
            "idempotency-key": `payment-${caseRecord.id}-v${caseRecord.version}`,
          },
          body: JSON.stringify({
            expectedVersion: caseRecord.version,
            paymentMethod: method,
            confirmationAccepted: accepted,
          }),
        },
      );
      onPaid(result.case);
    } catch (reason) {
      setError(reason.message);
      setSubmitting(false);
    }
  }
  return (
    <DialogShell
      eyebrow="Safe payment demonstration"
      title={`Pay ${formatMoney(caseRecord.allegation.amountPaise)}`}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="payment-warning">
          <Info size={21} />
          <p>
            <strong>No real payment will occur.</strong> This proves
            idempotency, gateway status, challan-ledger posting and receipt
            generation without collecting financial data.
          </p>
        </div>
        <fieldset className="payment-methods">
          <legend>Choose a synthetic method</legend>
          <label className={method === "DEMO_UPI" ? "selected" : ""}>
            <input
              type="radio"
              name="method"
              checked={method === "DEMO_UPI"}
              onChange={() => setMethod("DEMO_UPI")}
            />
            <CreditCard size={22} />
            <span>
              <strong>Demo UPI</strong>
              <small>No UPI ID or OTP requested</small>
            </span>
          </label>
          <label className={method === "DEMO_NET_BANKING" ? "selected" : ""}>
            <input
              type="radio"
              name="method"
              checked={method === "DEMO_NET_BANKING"}
              onChange={() => setMethod("DEMO_NET_BANKING")}
            />
            <Bank size={22} />
            <span>
              <strong>Demo net banking</strong>
              <small>No account or password requested</small>
            </span>
          </label>
        </fieldset>
        <label className="declaration">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
          />
          <span>
            I confirm that this is a synthetic payment and I am not entering
            real financial information.
          </span>
        </label>
        {error && (
          <p className="form-error" role="alert">
            <WarningCircle size={18} /> {error}
          </p>
        )}
        <div className="dialog-actions">
          <button className="button secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button pay"
            disabled={!accepted || submitting}
            type="submit"
          >
            {submitting ? "Posting…" : "Complete demo payment"}{" "}
            {!submitting && <ArrowRight size={18} />}
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

function BatchPaymentDialog({ cases, onClose, onPaid }) {
  const [method, setMethod] = useState("DEMO_UPI");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const totalPaise = cases.reduce((sum, item) => sum + item.allegation.amountPaise, 0);
  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const versionKey = cases.map((item) => `${item.id}-${item.version}`).join("-");
      const result = await request("/api/payment-batches", {
        method: "POST",
        headers: { "idempotency-key": `payment-batch-${versionKey}` },
        body: JSON.stringify({
          items: cases.map((item) => ({ caseId: item.id, expectedVersion: item.version })),
          paymentMethod: method,
          confirmationAccepted: accepted,
        }),
      });
      onPaid(result);
    } catch (reason) {
      setError(reason.message);
      setSubmitting(false);
    }
  }
  return (
    <DialogShell eyebrow="Safe batch-payment demonstration" title={`Review ${cases.length} challans`} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="payment-warning">
          <Info size={21} />
          <p><strong>No real payment will occur.</strong> The selected challans post in one atomic demo transaction: either all succeed or none change.</p>
        </div>
        <div className="batch-payment-list" aria-label="Selected challans">
          {cases.map((item) => (
            <article key={item.id}>
              <div>
                <strong>{item.registeredVehicle.registration}</strong>
                <span>{item.id}</span>
                <small>{item.allegation.offence}</small>
              </div>
              <b>{formatMoney(item.allegation.amountPaise)}</b>
            </article>
          ))}
          <div className="batch-payment-total"><span>Total synthetic amount</span><strong>{formatMoney(totalPaise)}</strong></div>
        </div>
        <fieldset className="payment-methods">
          <legend>Choose one synthetic method for the batch</legend>
          <label className={method === "DEMO_UPI" ? "selected" : ""}>
            <input type="radio" name="batch-method" checked={method === "DEMO_UPI"} onChange={() => setMethod("DEMO_UPI")} />
            <CreditCard size={22} />
            <span><strong>Demo UPI</strong><small>No UPI ID or OTP requested</small></span>
          </label>
          <label className={method === "DEMO_NET_BANKING" ? "selected" : ""}>
            <input type="radio" name="batch-method" checked={method === "DEMO_NET_BANKING"} onChange={() => setMethod("DEMO_NET_BANKING")} />
            <Bank size={22} />
            <span><strong>Demo net banking</strong><small>No account or password requested</small></span>
          </label>
        </fieldset>
        <label className="declaration">
          <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
          <span>I confirm this is a synthetic batch payment and I am not entering real financial information.</span>
        </label>
        {error && <p className="form-error" role="alert"><WarningCircle size={18} /> {error}</p>}
        <div className="dialog-actions">
          <button className="button secondary" type="button" onClick={onClose}>Cancel</button>
          <button className="button pay" disabled={!accepted || submitting} type="submit">
            {submitting ? "Posting batch…" : `Post ${cases.length} demo payments`} {!submitting && <ArrowRight size={18} />}
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

function SummaryCard({ icon, label, value, note, tone = "blue", onClick }) {
  const content = (
    <>
      <span className={`summary-icon ${tone}`}>{icon}</span>
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
        <em>{note}</em>
      </span>
      {onClick && <ArrowRight size={17} />}
    </>
  );
  return onClick ? (
    <button className="summary-card" type="button" onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className="summary-card">{content}</div>
  );
}

function AccountDashboard({ portfolio, onViewCase, onViewChallans, onSwitchAccount }) {
  const { account, cases } = portfolio;
  const activeCases = cases.filter((item) => !["PAID", "QUASHED"].includes(item.state));
  const reviewCases = cases.filter((item) => ["CONTEST_SUBMITTED", "UNDER_REVIEW"].includes(item.state));
  const payments = cases.filter((item) => item.payment);
  const progressCase = reviewCases[0] || cases.find((item) => item.contest);
  const contest = progressCase?.contest;
  const updates = cases.flatMap((item) => (item.tracking?.events?.length ? item.tracking.events : item.timeline).map((entry) => ({ ...entry, caseId: item.id }))).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 4);
  return (
    <main id="main-content" className="account-page">
      <section className="account-welcome">
        <div className="shell account-welcome-inner">
          <span className="profile-avatar">{account.initials}</span>
          <div>
            <span>Welcome back</span>
            <h1>{account.name}</h1>
            <p>{account.email} · {account.phone} · synthetic session</p>
          </div>
          <span className="verified-chip"><CheckCircle size={17} weight="fill" /> Demo verified</span>
          <label className="account-switcher">Demo profile
            <select value={account.id} onChange={(event) => onSwitchAccount(event.target.value)}>
              <option value="DEMO-CITIZEN-01">Amit Rao - 10 challans</option>
              <option value="DEMO-FLEET-02">Neha Logistics - 6 challans</option>
              <option value="DEMO-CITIZEN-03">Farah Nair - 4 challans</option>
            </select>
          </label>
        </div>
      </section>
      <div className="shell dashboard-shell">
        <section className="dashboard-summary" aria-label="Account summary">
          <SummaryCard icon={<Car size={25} />} label="My vehicles" value={account.vehicles.length} note="Authorized demo vehicles" tone="blue" onClick={() => onViewChallans()} />
          <SummaryCard icon={<Receipt size={25} />} label="Active challans" value={activeCases.length} note="Needs attention" tone="orange" onClick={() => onViewChallans()} />
          <SummaryCard icon={<Clock size={25} />} label="Under review" value={reviewCases.length} note="Track responsibility" tone="purple" onClick={progressCase ? () => onViewCase(progressCase.id) : undefined} />
          <SummaryCard icon={<Wallet size={25} />} label="Payments" value={payments.length} note={payments.length ? "Receipts available" : "No payment posted"} tone="green" />
        </section>

        {contest && (
          <section className="panel dashboard-progress">
            <div className="section-heading">
              <div><span className="eyebrow">Grievance {contest.receiptId}</span><h2>{progressCase.stateLabel}</h2></div>
              <button className="button secondary compact-button" type="button" onClick={() => onViewCase(progressCase.id)}>View review progress <ArrowRight size={16} /></button>
            </div>
            <div className="resolution-steps" aria-label="Dispute status">
              {(progressCase.tracking?.stages || []).map((stage, index) => (
                <div className={stage.status !== "PENDING" ? `reached ${stage.status === "CURRENT" ? "current" : ""}` : ""} key={stage.id}>
                  <span>{stage.status === "COMPLETE" ? <Check size={15} weight="bold" /> : index + 1}</span>
                  <strong>{stage.label}</strong>
                </div>
              ))}
            </div>
            {progressCase.tracking && <p className="dashboard-progress-note"><strong>{progressCase.tracking.currentOwner}</strong> owns the next step · {progressCase.tracking.nextAction}</p>}
          </section>
        )}

        <div className="dashboard-grid">
          <section className="panel dashboard-panel">
            <div className="panel-title"><h2>Recent updates</h2><Bell size={20} /></div>
            <div className="update-list">
              {updates.map((entry) => (
                <button key={`${entry.caseId}-${entry.id}`} type="button" onClick={() => onViewCase(entry.caseId)}>
                  <span className="update-dot"><Check size={14} /></span>
                  <span><strong>{entry.label}</strong><small>{formatDate(entry.at, true)} · {entry.actor}</small></span>
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>
          </section>
          <section className="panel dashboard-panel">
            <div className="panel-title"><h2>Saved vehicles</h2><span>{account.vehicles.length} {account.vehicles.length === 1 ? "vehicle" : "vehicles"}</span></div>
            <div className="saved-vehicle-list">
              {account.vehicles.map((vehicle, index) => (
                <button type="button" key={vehicle.registration} onClick={() => onViewChallans(vehicle.registration)}>
                  <VehicleThumbnail vehicle={vehicle} />
                  <span><strong>{vehicle.registration}</strong><small>{vehicleDisplayName(vehicle)} · {vehicle.type} · {vehicle.colour}{index === 0 ? " · Primary" : ""}</small></span>
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>
          </section>
          <section className="panel dashboard-panel">
            <div className="panel-title"><h2>Recent payments</h2><CreditCard size={20} /></div>
            {payments.length ? (
              <div className="payment-list">{payments.map((item) => <button className="payment-row" type="button" key={item.id} onClick={() => onViewCase(item.id)}>
                <span className="summary-icon green"><Receipt size={21} /></span>
                <span><strong>Payment posted</strong><small>{item.payment.receiptId} · {item.payment.providerReference}</small></span>
                <b>{formatMoney(item.payment.amountPaise)}</b>
              </button>)}</div>
            ) : (
              <div className="dashboard-empty"><Wallet size={25} /><span><strong>No payments yet</strong><small>A receipt will appear here after the mock payment flow.</small></span></div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function ChallanList({ cases, vehicles, initialVehicle, onViewCase, onBack }) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [vehicleFilter, setVehicleFilter] = useState(initialVehicle || "ALL");
  const visible = cases.filter((item) => (statusFilter === "ALL" || statusFilter === item.state) && (vehicleFilter === "ALL" || vehicleFilter === item.registeredVehicle.registration));
  const outstanding = cases.filter((item) => !["PAID", "QUASHED"].includes(item.state));
  function downloadRecord() {
    const blob = new Blob([JSON.stringify({ synthetic: true, cases: visible }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "challan-nyay-demo-records.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <main id="main-content" className="challans-page">
      <section className="challans-hero">
        <div className="shell">
          <button className="text-button" type="button" onClick={onBack}><ArrowLeft size={16} /> Back to account</button>
          <h1>My challans</h1>
          <p>Every notice across your authorized demo vehicles, in one place.</p>
        </div>
      </section>
      <div className="shell challans-content">
        <section className="dashboard-summary challan-summary">
          <SummaryCard icon={<WarningCircle size={25} />} label="Outstanding" value={outstanding.length} note={formatMoney(outstanding.reduce((sum, item) => sum + item.allegation.amountPaise, 0))} tone="orange" />
          <SummaryCard icon={<Clock size={25} />} label="Under review" value={cases.filter((item) => ["CONTEST_SUBMITTED", "UNDER_REVIEW"].includes(item.state)).length} note="Human decision loop" tone="purple" />
          <SummaryCard icon={<CheckCircle size={25} />} label="Closed" value={cases.filter((item) => ["PAID", "QUASHED", "REJECTED"].includes(item.state)).length} note="Receipt or decision" tone="green" />
        </section>
        <section className="panel challan-table-panel">
          <div className="table-toolbar">
            <div className="table-filters">
              <label>Vehicle <select value={vehicleFilter} onChange={(event) => setVehicleFilter(event.target.value)}><option value="ALL">All vehicles</option>{vehicles.map((vehicle) => <option value={vehicle.registration} key={vehicle.registration}>{vehicle.registration}</option>)}</select></label>
              <label>Status <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ALL">All statuses</option><option value="VIEWED">Action required</option><option value="CONTEST_SUBMITTED">Submitted</option><option value="UNDER_REVIEW">Under review</option><option value="PAID">Paid</option><option value="QUASHED">Quashed</option><option value="REJECTED">Decision issued</option></select></label>
            </div>
            <button className="button secondary compact-button" type="button" onClick={downloadRecord}><DownloadSimple size={17} /> Download records</button>
          </div>
          <div className="challan-table" role="table" aria-label="Synthetic challans">
            <div className="challan-row challan-head" role="row"><span>Challan</span><span>Date and place</span><span>Violation</span><span>Amount</span><span>Status</span><span>Action</span></div>
            {visible.length ? visible.map((item) => (
              <div className="challan-row" role="row" key={item.id}>
                <span className="challan-vehicle-cell"><VehicleThumbnail vehicle={item.registeredVehicle} /><span><strong>{item.id}</strong><small>{item.registeredVehicle.registration} · {vehicleDisplayName(item.registeredVehicle)}</small></span></span>
                <span><strong>{formatDate(item.allegation.eventAt)}</strong><small>{item.allegation.location}</small></span>
                <span>{item.allegation.offence}</span>
                <span><strong>{formatMoney(item.allegation.amountPaise)}</strong></span>
                <span><em className={"status-pill state-" + item.state.toLowerCase()}>{item.stateLabel}</em></span>
                <span><button className="button primary compact-button" type="button" onClick={() => onViewCase(item.id)}>{item.payment ? "View receipt" : item.decision ? "View decision" : item.contest ? "Track review" : "View details"}</button></span>
              </div>
            )) : <div className="table-empty">No challan matches these filters.</div>}
          </div>
        </section>
      </div>
    </main>
  );
}

function VehicleCard({ title, vehicle, tone }) {
  return (
    <div className={`vehicle-card ${tone}`}>
      <div className="vehicle-card-heading">
        <div>
          <span className="vehicle-label">{title}</span>
          <strong>{vehicle.registration}</strong>
          <small>{vehicleDisplayName(vehicle)}</small>
        </div>
        <VehicleThumbnail vehicle={vehicle} className="vehicle-comparison-thumbnail" />
      </div>
      <dl>
        <div>
          <dt>Type</dt>
          <dd>{vehicle.type}</dd>
        </div>
        <div>
          <dt>Colour</dt>
          <dd>{vehicle.colour}</dd>
        </div>
      </dl>
      {vehicle.registry && (
        <span className="registry-source"><ShieldCheck size={14} /> Synthetic registry snapshot · {vehicle.registry.snapshotVersion}</span>
      )}
    </div>
  );
}

function EvidencePassport({ passport, compact = false }) {
  if (!passport) return null;
  const sourceLabel = passport.source?.kind === "OFFICER_MOBILE" ? "Officer mobile event" : "Fixed camera event";
  const vehicleMismatch = passport.vehicleComparison?.mismatches?.map(humanizeCode).join(" + ") || "No body mismatch";
  return (
    <section className={`evidence-passport ${compact ? "compact" : ""}`} aria-label="Evidence integrity passport">
      <header>
        <div>
          <span className="eyebrow"><ShieldCheck size={15} /> Evidence passport</span>
          <strong>{passport.lineageStatus === "COMPLETE" ? "Original and derived evidence are linked" : "Source metadata retained"}</strong>
        </div>
        <em>{passport.lineageStatus === "COMPLETE" ? "Lineage complete" : "Metadata only"}</em>
      </header>
      <dl>
        <div><dt>Capture source</dt><dd>{sourceLabel}<small>{passport.source?.sourceId}</small></dd></div>
        <div><dt>Original record</dt><dd>{passport.original?.retained ? "Immutable original retained" : "Image not retained"}<small>{passport.original?.sha256}</small></dd></div>
        <div><dt>Plate comparison</dt><dd>{passport.plateComparison?.matches ? "Matches registered plate" : "Plate differs"}<small>{passport.plateComparison?.observed} ↔ {passport.plateComparison?.registered}</small></dd></div>
        <div><dt>Vehicle comparison</dt><dd>{vehicleMismatch}<small>{passport.vehicleComparison?.assessment === "MATCHED" ? "Profile attributes align" : "Human review required"}</small></dd></div>
      </dl>
      {!compact && <p>A matching plate identifies the registration read; it does not prove that the vehicle body and colour match the registry profile.</p>}
    </section>
  );
}

function ReviewerEvidenceContext({ caseRecord, showMedia = true }) {
  const evidence = caseRecord?.evidence?.[0];
  if (!evidence) return null;
  const plateCrop = evidence.derivedAssets?.find((asset) => asset.kind === "PLATE_CROP");
  const location = evidence.location;
  const mapLink = location?.latitude && location?.longitude
    ? `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=17/${location.latitude}/${location.longitude}`
    : null;
  return (
    <section className="review-evidence-context" aria-label="Derived evidence and captured location">
      <figure>
        <div className="media-label"><Camera size={16} /> Derived plate crop</div>
        {evidence.plateAssetPath && showMedia ? (
          <img src={evidence.plateAssetPath} alt={`Derived synthetic plate crop showing ${evidence.plateRegistration}`} />
        ) : (
          <div className="plate-readout"><span>IND</span><strong>{caseRecord.detectedVehicle.registration}</strong></div>
        )}
        <figcaption>{plateCrop ? `Derived from ${plateCrop.derivedFrom}` : "No retained crop for this historical record"}</figcaption>
      </figure>
      <div className="review-location-card">
        <span className="eyebrow"><MapPin size={15} /> Captured location</span>
        <strong>{location?.label || caseRecord.allegation.location}</strong>
        <small>{location?.latitude}, {location?.longitude} · approx. {location?.accuracyMetres} m</small>
        <small>{humanizeCode(location?.coordinateSource || "Legacy source metadata")}</small>
        {mapLink && <a href={mapLink} target="_blank" rel="noreferrer">Inspect attributed map <ArrowRight size={14} /></a>}
      </div>
      <div className="review-source-card">
        <span className="eyebrow"><ShieldCheck size={15} /> Chain of custody</span>
        <strong>{evidence.original?.assetId || evidence.id}</strong>
        <small>{evidence.source?.agency || caseRecord.jurisdiction.authority}</small>
        <small>{evidence.source?.adapterVersion || "Legacy demo envelope"}</small>
        <span>{evidence.original?.retained ? "Original retained" : "Metadata-only record"}</span>
      </div>
    </section>
  );
}
function Timeline({ entries }) {
  return (
    <ol className="timeline">
      {entries.map((entry, index) => (
        <li
          key={entry.id}
          className={index === entries.length - 1 ? "current" : ""}
        >
          <span className="timeline-dot">
            {index === entries.length - 1 ? (
              <Clock size={15} weight="fill" />
            ) : (
              <Check size={14} weight="bold" />
            )}
          </span>
          <div>
            <strong>{entry.label}</strong>
            {entry.summary && <p>{entry.summary}</p>}
            <small>
              {formatDate(entry.at, true)} · {entry.actor}{entry.caseVersion ? ` · v${entry.caseVersion}` : ""}
            </small>
          </div>
        </li>
      ))}
    </ol>
  );
}

function CitizenCase({ caseRecord, auditCount, onContest, onPay, onBack, backLabel = "Back to my challans", onInformationResponded, lowData }) {
  const [responseNote, setResponseNote] = useState("The requested synthetic registered-vehicle image is attached for comparison.");
  const [responding, setResponding] = useState(false);
  const [responseError, setResponseError] = useState("");
  const [mediaRequested, setMediaRequested] = useState(false);
  const primaryEvidence = caseRecord.evidence[0];
  const mapLocation = primaryEvidence.location || {
    latitude: 17.36887,
    longitude: 78.52562,
    label: caseRecord.allegation.location,
    accuracyMetres: 25,
  };
  const mapBbox = [
    mapLocation.longitude - 0.012,
    mapLocation.latitude - 0.009,
    mapLocation.longitude + 0.012,
    mapLocation.latitude + 0.009,
  ].map((coordinate) => coordinate.toFixed(5)).join(",");
  const mapEmbed = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(mapBbox)}&layer=mapnik&marker=${mapLocation.latitude}%2C${mapLocation.longitude}`;
  const mapLink = `https://www.openstreetmap.org/?mlat=${mapLocation.latitude}&mlon=${mapLocation.longitude}#map=16/${mapLocation.latitude}/${mapLocation.longitude}`;
  const showMedia = !lowData || mediaRequested;
  const captureSourceLabel = primaryEvidence.captureSource === "OFFICER_MOBILE"
    ? "Officer upload"
    : "Fixed camera";
  const hasVehicleMismatch = ["registration", "type", "colour"].some(
    (field) => caseRecord.detectedVehicle[field] !== caseRecord.registeredVehicle[field],
  );
  const submitted = ["CONTEST_SUBMITTED", "UNDER_REVIEW", "INFORMATION_REQUESTED", "CITIZEN_SUPPLEMENTED"].includes(
    caseRecord.state,
  );
  const informationRequested = caseRecord.state === "INFORMATION_REQUESTED";
  const informationSupplied = caseRecord.state === "CITIZEN_SUPPLEMENTED";
  const routed = ["RECONCILIATION", "REROUTED"].includes(caseRecord.state);
  const decided = ["QUASHED", "REJECTED", "RECONCILIATION", "REROUTED"].includes(caseRecord.state);
  const quashed = caseRecord.state === "QUASHED";
  const paid = caseRecord.state === "PAID";
  const closed = decided || paid;
  const contestGround = caseRecord.contest?.ground;
  const tracking = caseRecord.tracking || null;
  async function respondToReviewer(event) {
    event.preventDefault();
    setResponding(true);
    setResponseError("");
    try {
      const result = await request(`/api/cases/${caseRecord.id}/information-responses`, {
        method: "POST",
        headers: { "idempotency-key": `information-response-${caseRecord.id}-v${caseRecord.version}` },
        body: JSON.stringify({
          expectedVersion: caseRecord.version,
          evidenceCode: caseRecord.informationRequest?.itemCode || "SYNTHETIC_SUPPORTING_ITEM",
          responseNote,
        }),
      });
      onInformationResponded(result.case);
    } catch (reason) {
      setResponseError(reason.message);
    } finally {
      setResponding(false);
    }
  }
  const alertClass =
    quashed || paid
      ? "success"
      : decided
        ? "neutral"
        : submitted
          ? "submitted"
          : "urgent";
  const alertTitle = caseRecord.state === "RECONCILIATION"
    ? "Your prior payment is being reconciled"
    : caseRecord.state === "REROUTED"
      ? "Your case has been rerouted"
      : paid
    ? "Payment recorded in this demonstration"
    : quashed
      ? "This challan has been quashed"
      : decided
        ? "A reasoned decision is available"
        : submitted
          ? "Your contest is in the review queue"
          : hasVehicleMismatch
            ? "Possible vehicle mismatch in the evidence"
            : "Review this challan before acting";
  const alertCopy = routed
    ? (tracking?.nextAction || caseRecord.decision?.explanation)
    : paid
    ? "The mock gateway succeeded, the challan ledger posted once, and a synthetic receipt is ready."
    : quashed
      ? "The demo reviewer confirmed the vehicle mismatch and closed the case."
      : decided
        ? "Review the evidence considered and the next option below."
        : submitted
          ? `Receipt ${caseRecord.contest.receiptId} is saved. The authority now owns the next action.`
          : hasVehicleMismatch
            ? "The evidence appears to show a different vehicle. Review the comparison before you decide whether to pay or contest."
            : "The seeded evidence metadata matches this vehicle. Review the offence, location, amount and deadline before choosing an action.";
  return (
    <main id="main-content">
      <div className="shell case-toolbar">
        <button className="text-button" type="button" onClick={onBack}>
          <ArrowLeft size={17} /> {backLabel}
        </button>
        <span>
          <ShieldCheck size={16} /> Synthetic case ·{" "}
          {caseRecord.jurisdiction.name} demo
        </span>
      </div>
      <section className="shell case-metadata" aria-label="Challan summary">
        <div><small>Challan ID</small><strong>{caseRecord.id}</strong></div>
        <div><small>Vehicle number</small><strong>{caseRecord.registeredVehicle.registration}</strong></div>
        <div><small>Violation</small><strong>{caseRecord.allegation.offence}</strong></div>
        <div className="metadata-amount"><small>Fine amount</small><strong>{formatMoney(caseRecord.allegation.amountPaise)}</strong></div>
        <div><small>Issued by</small><strong>{caseRecord.jurisdiction.authority}</strong></div>
        <div><small>Contest by</small><strong>{formatDate(caseRecord.contestDeadline)}</strong></div>
        <div><small>Status</small><span className="status-pill">{caseRecord.stateLabel}</span></div>
      </section>
      <section className={`action-band ${alertClass}`}>
        <div className="shell action-band-inner">
          <div className="action-icon">
            {quashed || paid ? (
              <CheckCircle size={28} weight="fill" />
            ) : submitted || routed ? (
              <Clock size={28} weight="fill" />
            ) : (
              <WarningCircle size={28} weight="fill" />
            )}
          </div>
          <div>
            <span className="eyebrow">Case status</span>
            <h1>{alertTitle}</h1>
            <p>{alertCopy}</p>
          </div>
          <div className="amount">
            <span>
              {paid ? "Amount paid" : quashed ? "Amount cancelled" : routed ? "Fine under review" : "Amount due"}
            </span>
            <strong>
              {quashed ? formatMoney(0) : formatMoney(caseRecord.allegation.amountPaise)}
            </strong>
            <small>
              {paid
                ? "Synthetic receipt issued"
                : quashed
                  ? `${formatMoney(caseRecord.allegation.amountPaise)} challan ceased`
                  : routed
                    ? "No repeat payment requested"
                  : "Choose only after reviewing the case"}
            </small>
          </div>
        </div>
      </section>
      <div className="shell page-grid">
        <div className="main-column">
          <section className="panel case-summary">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Case {caseRecord.id}</span>
                <h2>{caseRecord.allegation.offence}</h2>
              </div>
              <span className="status-pill">{caseRecord.stateLabel}</span>
            </div>
            <dl className="fact-grid">
              <div>
                <dt>Recorded at</dt>
                <dd>{formatDate(caseRecord.allegation.eventAt, true)}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{caseRecord.allegation.location}</dd>
              </div>
              <div>
                <dt>Jurisdiction</dt>
                <dd>{caseRecord.jurisdiction.name} · demo adapter</dd>
              </div>
            </dl>
          </section>
          <section className="panel evidence-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Evidence captured at {formatDate(primaryEvidence.capturedAt || caseRecord.allegation.eventAt, true)}</span>
                <h2>See exactly what produced this notice</h2>
              </div>
              <span className="confidence">
                <Camera size={16} /> {captureSourceLabel}
              </span>
            </div>
            <div className="evidence-media-grid">
              <figure className="enforcement-frame">
                {primaryEvidence.assetPath && showMedia ? (
                  <img
                    src={primaryEvidence.previewAssetPath || primaryEvidence.assetPath}
                    alt={`Synthetic enforcement frame showing the detected ${caseRecord.detectedVehicle.colour.toLowerCase()} ${caseRecord.detectedVehicle.type.toLowerCase()}`}
                    loading="lazy"
                    decoding="async"
                  />
                ) : primaryEvidence.assetPath ? (
                  <LowDataPlaceholder onLoad={() => setMediaRequested(true)} />
                ) : (
                  <div className="evidence-unavailable" role="img" aria-label="No image retained for this seeded historical record">
                    <Camera size={32} />
                    <strong>Historical image not retained</strong>
                    <small>This portfolio record demonstrates status and payment history. The highlighted showcase case contains complete visual evidence.</small>
                  </div>
                )}
                <figcaption>
                  {primaryEvidence.integrity.originalRetained
                    ? "Original synthetic enforcement frame · retained for reviewer comparison"
                    : "Synthetic historical record · no image file attached"}
                </figcaption>
              </figure>
              <div className="evidence-side-media">
                <figure className="plate-frame">
                  <div className="media-label"><Camera size={17} /> {primaryEvidence.plateAssetPath ? "Number plate · derived crop" : "Plate observation"}</div>
                  {primaryEvidence.plateAssetPath && showMedia ? (
                    <img
                      src={primaryEvidence.plateAssetPath}
                      alt={`Synthetic close-up of number plate ${primaryEvidence.plateRegistration || caseRecord.detectedVehicle.registration}`}
                    />
                  ) : (
                    <div className="plate-readout" aria-label={`Recorded vehicle number ${caseRecord.detectedVehicle.registration}`}>
                      <span>IND</span>
                      <strong>{caseRecord.detectedVehicle.registration}</strong>
                    </div>
                  )}
                  <figcaption>{caseRecord.detectedVehicle.registration} · synthetic evidence</figcaption>
                </figure>
                <section className="map-card" aria-label="Event location map">
                  <div className="media-label"><MapPin size={17} /> Captured location</div>
                  {showMedia ? <iframe
                    title={`Map showing ${mapLocation.label}`}
                    src={mapEmbed}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  /> : <div className="low-data-map"><MapPin size={25} /><span>Interactive map paused<small>Use the external attributed map link when needed.</small></span></div>}
                  <div className="map-caption">
                    <span><strong>{mapLocation.label}</strong><small>Approx. {mapLocation.accuracyMetres} m accuracy · demo coordinates</small></span>
                    <a href={mapLink} target="_blank" rel="noreferrer">Open map <ArrowRight size={14} /></a>
                  </div>
                </section>
              </div>
            </div>
            <EvidencePassport passport={caseRecord.evidencePassport} />
            <div className="comparison comparison-inline">
              <VehicleCard title="Detected in notice" vehicle={caseRecord.detectedVehicle} tone="detected" />
              <div className={`mismatch ${hasVehicleMismatch ? "" : "match"}`}>
                {hasVehicleMismatch ? <WarningCircle size={19} weight="fill" /> : <CheckCircle size={19} weight="fill" />}
                {hasVehicleMismatch ? "Vehicle body or colour does not match" : "Evidence metadata matches this vehicle"}
              </div>
              <VehicleCard title="Your authorized vehicle" vehicle={caseRecord.registeredVehicle} tone="registered" />
            </div>
          </section>
          {caseRecord.decision && (
            <section
              className={`panel decision-panel ${quashed || paid ? "approved" : routed ? "neutral" : "rejected"}`}
            >
              <div className="decision-icon">
                <Gavel size={24} weight="fill" />
              </div>
              <div>
                <span className="eyebrow">Reasoned decision</span>
                <h2>{caseRecord.stateLabel}</h2>
                <p>{caseRecord.decision.explanation}</p>
                <small>
                  Order {caseRecord.decision.orderReference} ·{" "}
                  {formatDate(caseRecord.decision.decidedAt, true)}
                </small>
              </div>
            </section>
          )}
          {caseRecord.payment && (
            <section className="panel payment-receipt">
              <div className="decision-icon">
                <Receipt size={24} weight="fill" />
              </div>
              <div>
                <span className="eyebrow">Synthetic payment receipt</span>
                <h2>{caseRecord.payment.receiptId}</h2>
                <p>
                  Provider: {caseRecord.payment.providerStatus} · Challan
                  ledger: {caseRecord.payment.ledgerStatus}
                </p>
                <small>
                  Attempt {caseRecord.payment.attemptId} ·{" "}
                  {formatDate(caseRecord.payment.paidAt, true)}
                </small>
              </div>
            </section>
          )}
          <section className="panel timeline-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Trackable process</span>
                <h2>Case timeline</h2>
              </div>
              <span className="audit-label">
                {auditCount} audit {auditCount === 1 ? "event" : "events"}
              </span>
            </div>
            <Timeline entries={tracking?.events?.length ? tracking.events : caseRecord.timeline} />
          </section>
        </div>
        <aside className="side-column">
          <section className="case-explanation-card">
            <span className="eyebrow"><Info size={15} /> Understanding what happened</span>
            <h2>{contestGround === "ALREADY_PAID" ? "Why payment reconciliation is needed" : hasVehicleMismatch ? "The evidence does not match your vehicle" : "What this record says"}</h2>
            <p>
              {contestGround === "ALREADY_PAID"
                ? `The citizen supplied payment reference ${caseRecord.contest.issuePacket.details.paymentReference}. It is being checked against the provider attempt and challan ledger before any further payment is requested.`
                : <>At {formatDate(caseRecord.allegation.eventAt, true)}, {captureSourceLabel.toLowerCase()} evidence recorded a {caseRecord.detectedVehicle.colour.toLowerCase()} {caseRecord.detectedVehicle.type.toLowerCase()} at {caseRecord.allegation.location}.{" "}{hasVehicleMismatch ? "The captured plate matches your registration, but it is attached to a different vehicle body and colour." : "The recorded vehicle details match the authorized vehicle in this synthetic account."}</>}
            </p>
            <div className="law-card">
              <ShieldCheck size={20} />
              <span><strong>Rule and review route</strong><small>{caseRecord.jurisdiction.ruleVersion} · configured demo rule version</small></span>
            </div>
          </section>
          <section className="next-action-card">
            <span className="eyebrow">Next action owner</span>
            <h2>{tracking?.currentOwner || caseRecord.nextActionOwner}</h2>
            {!submitted && !closed && (
              <>
                <p>
                  Review the evidence, amount and location before choosing. Paying closes the
                  demo case; contesting sends the selected issue for human review.
                </p>
                <button
                  className="button light full"
                  onClick={onContest}
                  type="button"
                >
                  Contest this challan <ArrowRight size={18} />
                </button>
                <button
                  className="button dark-outline full"
                  onClick={onPay}
                  type="button"
                >
                  Pay in demo <CreditCard size={18} />
                </button>
                <span className="deadline">
                  <CalendarBlank size={17} /> Decide before{" "}
                  {formatDate(caseRecord.contestDeadline)}
                </span>
              </>
            )}
            {submitted && (
              <>
                {informationRequested ? (
                  <form className="information-response-form" onSubmit={respondToReviewer}>
                    <span className="eyebrow">Reviewer needs one item</span>
                    <strong>{humanizeCode(caseRecord.informationRequest.itemCode)}</strong>
                    <p>{caseRecord.informationRequest.reason}</p>
                    <label htmlFor="information-response-note">Your response</label>
                    <textarea id="information-response-note" value={responseNote} onChange={(event) => setResponseNote(event.target.value)} rows="4" />
                    {responseError && <small className="form-error" role="alert">{responseError}</small>}
                    <button className="button light full" disabled={responding} type="submit">
                      {responding ? "Sending response…" : "Send requested item"} <ArrowRight size={18} />
                    </button>
                  </form>
                ) : (
                  <p>
                    {tracking?.nextAction || (informationSupplied
                      ? "Your response is saved as a new packet version. The reviewer now owns the next action."
                      : "No extra action is needed now. A reviewer must record a reasoned outcome by the service target.")}
                  </p>
                )}
                <span className="receipt">
                  <CheckCircle size={18} weight="fill" /> Receipt{" "}
                  {caseRecord.contest.receiptId}
                </span>
                <span className="deadline">
                  <CalendarBlank size={17} /> Target{" "}
                  {formatDate(tracking?.targetAt || caseRecord.reviewDeadline)}
                </span>
                {tracking?.targetSource && <small className="target-source">{tracking.targetSource}</small>}
              </>
            )}
            {routed && (
              <>
                <p>{tracking?.nextAction || caseRecord.decision?.explanation}</p>
                <span className="receipt">
                  <ArrowsClockwise size={18} /> Route recorded in the audit trail
                </span>
              </>
            )}
            {closed && !routed && (
              <>
                <p>
                  The outcome is recorded with its reference, accountable actor
                  and evidence trail.
                </p>
                <span className="receipt">
                  <CheckCircle size={18} weight="fill" /> Case record complete
                </span>
              </>
            )}
          </section>
          <section className="trust-card">
            <ShieldCheck size={24} weight="fill" />
            <div>
              <strong>Do not pay unknown callers</strong>
              <p>
                This prototype never asks for an OTP, bank details, card data or
                remote access.
              </p>
            </div>
          </section>
          <section className="plain-card">
            <span className="eyebrow">Jurisdiction routing</span>
            <h3>One experience, state-configured authority</h3>
            <p>
              The citizen journey stays consistent while each adapter records
              its authority, rule version and capabilities.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}

function ReviewerDesk({ onCaseChanged, onReset, lowData }) {
  const [summary, setSummary] = useState(null);
  const [demonstrationScale, setDemonstrationScale] = useState(null);
  const [workItems, setWorkItems] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [task, setTask] = useState(null);
  const [activeView, setActiveView] = useState("OPEN");
  const [nextCursor, setNextCursor] = useState(null);
  const [authenticated, setAuthenticated] = useState(
    () => typeof window !== "undefined" && Boolean(window.localStorage.getItem(REVIEWER_SESSION_KEY)),
  );
  const [accessCode, setAccessCode] = useState("NYAY-REVIEW-2026");
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [reviewMediaRequested, setReviewMediaRequested] = useState(false);

  useEffect(() => setReviewMediaRequested(false), [selectedTaskId]);

  const views = [
    { id: "OPEN", label: "Open", count: summary?.open },
    { id: "UNASSIGNED", label: "Unassigned", count: summary?.unassigned },
    { id: "MY_BATCH", label: "My batch", count: summary?.myBatch },
    { id: "WAITING_FOR_CITIZEN", label: "Waiting for citizen", count: summary?.waitingForCitizen },
    { id: "DUE_TODAY", label: "Due today", count: summary?.dueToday },
    { id: "ESCALATED", label: "Escalated", count: summary?.escalated },
    { id: "RESOLVED", label: "Recently resolved", count: summary?.resolved },
  ];

  const selectedWorkItem = workItems.find((item) => item.id === selectedTaskId) || null;
  const taskTitle = task?.contest?.groundLabel || task?.stateLabel || "Case record";
  const taskResolved = ["QUASHED", "REJECTED", "PAID", "RECONCILIATION", "REROUTED"].includes(task?.state);
  const issuePacket = task?.contest?.issuePacket || null;
  const allowedDecisionOutcomes = (issuePacket?.allowedOutcomes || ["QUASHED", "REJECTED"])
    .filter((outcome) => outcome !== "INFORMATION_REQUESTED");
  const reviewerChecks = issuePacket?.reviewerChecks || [];
  const comparisonChecks = task ? [
    { label: "Registration", matches: task.detectedVehicle.registration === task.registeredVehicle.registration },
    { label: "Vehicle type", matches: task.detectedVehicle.type === task.registeredVehicle.type },
    { label: "Colour", matches: task.detectedVehicle.colour === task.registeredVehicle.colour },
  ] : [];

  function formatIssueDetail(code, value) {
    if (code === "amountPaise") return formatMoney(value);
    if (Array.isArray(value)) return value.map(humanizeCode).join(", ");
    if (typeof value === "boolean") return value ? "Confirmed" : "Not confirmed";
    return String(value || "Not supplied");
  }

  function describeAge(value) {
    if (!value) return "Time unavailable";
    const hours = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 3_600_000));
    if (hours < 1) return "Received recently";
    if (hours < 24) return `${hours}h in queue`;
    return `${Math.floor(hours / 24)}d in queue`;
  }

  function describeDeadline(value) {
    if (!value) return { label: "No SLA date", tone: "neutral" };
    const days = Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
    if (days < 0) return { label: `${Math.abs(days)}d overdue`, tone: "danger" };
    if (days === 0) return { label: "Due today", tone: "warning" };
    return { label: `${days}d remaining`, tone: days <= 3 ? "warning" : "safe" };
  }

  async function loadTaskDetails(caseId) {
    if (!caseId) {
      setTask(null);
      return;
    }
    setDetailLoading(true);
    try {
      const body = await request(`/api/authority/tasks/${caseId}`);
      setTask(body.task);
    } catch (reason) {
      setError(reason.message);
      setTask(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadWorkspace({ cursor = null, append = false, preferredTaskId = null } = {}) {
    if (!summary) setLoading(true);
    setError("");
    try {
      const [summaryBody, page] = await Promise.all([
        request("/api/authority/queue-summary"),
        request(`/api/authority/work-items?view=${activeView}&limit=12${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`),
      ]);
      const nextItems = append ? [...workItems, ...page.items] : page.items;
      setSummary(summaryBody.summary);
      setDemonstrationScale(summaryBody.demonstrationScale);
      setWorkItems(nextItems);
      setNextCursor(page.nextCursor);
      const candidateId = preferredTaskId && nextItems.some((item) => item.id === preferredTaskId)
        ? preferredTaskId
        : selectedTaskId && nextItems.some((item) => item.id === selectedTaskId)
          ? selectedTaskId
          : nextItems[0]?.id || null;
      setSelectedTaskId(candidateId);
      await loadTaskDetails(candidateId);
    } catch (reason) {
      if (/sign in|session/i.test(reason.message)) {
        window.localStorage.removeItem(REVIEWER_SESSION_KEY);
        setAuthenticated(false);
      }
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (authenticated) loadWorkspace();
  }, [authenticated, activeView]);

  async function signIn(event) {
    event.preventDefault();
    setWorking(true);
    setError("");
    try {
      await createReviewerSession(accessCode);
      setAuthenticated(true);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setWorking(false);
    }
  }

  async function selectTask(caseId) {
    setSelectedTaskId(caseId);
    setError("");
    await loadTaskDetails(caseId);
  }

  async function claimTask() {
    if (!task) return;
    setWorking(true);
    setError("");
    try {
      await request(`/api/authority/tasks/${task.id}/claim`, {
        method: "POST",
        headers: { "idempotency-key": `claim-${task.id}-${Date.now()}` },
        body: "{}",
      });
      await loadWorkspace({ preferredTaskId: task.id });
    } catch (reason) {
      setError(reason.message);
    } finally {
      setWorking(false);
    }
  }

  async function decide(outcome) {
    if (!task) return;
    setWorking(true);
    setError("");
    try {
      const presentation = REVIEW_OUTCOMES[outcome];
      const mismatchGround = task.contest?.ground === "WRONG_VEHICLE";
      const result = await request(`/api/authority/tasks/${task.id}/decisions`, {
        method: "POST",
        headers: {
          "idempotency-key": `decision-${task.id}-${outcome}-v${task.version}`,
        },
        body: JSON.stringify({
          expectedVersion: task.version,
          outcome,
          reasonCode: outcome === "QUASHED" && mismatchGround
            ? "VEHICLE_MISMATCH_CONFIRMED"
            : presentation.reasonCode,
          explanation: outcome === "QUASHED" && mismatchGround
            ? "The captured plate matches the registered number, but the vehicle body and colour do not. The challan is quashed with a recorded order."
            : presentation.explanation,
        }),
      });
      setSelectedTaskId(null);
      setTask(null);
      onCaseChanged(result.case, { stayInReviewer: true });
      await loadWorkspace();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setWorking(false);
    }
  }
  async function askForInformation() {
    if (!task) return;
    setWorking(true);
    setError("");
    try {
      const [itemCode, reason] = MISSING_ITEM_REQUESTS[task.contest?.ground]
        || [issuePacket?.requiredEvidence?.[0] || "SUPPORTING_INFORMATION", "Please add the one synthetic supporting item needed to complete this review."];
      const result = await request(`/api/authority/tasks/${task.id}/information-requests`, {
        method: "POST",
        headers: { "idempotency-key": `information-${task.id}-v${task.version}` },
        body: JSON.stringify({
          expectedVersion: task.version,
          itemCode,
          reason,
        }),
      });
      setTask(result.case);
      onCaseChanged(result.case, { stayInReviewer: true });
      await loadWorkspace({ preferredTaskId: task.id });
    } catch (reason) {
      setError(reason.message);
    } finally {
      setWorking(false);
    }
  }
  if (!authenticated) {
    return (
      <main id="main-content" className="shell authority-sign-in-page">
        <section className="authority-sign-in panel">
          <ShieldCheck size={36} weight="duotone" />
          <span className="eyebrow">Separate staff workspace</span>
          <h1>Reviewer sign in</h1>
          <p>This protected synthetic workspace is separate from citizen accounts. It can review only cases from this browser’s demo session.</p>
          {error && <p className="form-error" role="alert"><WarningCircle size={18} /> {error}</p>}
          <form onSubmit={signIn}>
            <label htmlFor="reviewer-access-code">Demo access code</label>
            <input id="reviewer-access-code" className="text-field" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} autoComplete="off" />
            <small>For judges: the synthetic access code is prefilled. No government credential is used.</small>
            <button className="button primary full" disabled={working} type="submit">{working ? "Opening workspace…" : "Open reviewer workspace"}<ArrowRight size={18} /></button>
          </form>
        </section>
      </main>
    );
  }
  if (loading) return <LoadingState />;
  return (
    <main id="main-content" className="shell reviewer-page authority-operations">
      <header className="reviewer-heading authority-heading">
        <div>
          <span className="eyebrow">Demo nationwide operations · synthetic data</span>
          <h1>Authority operations</h1>
          <p>Prioritise jurisdiction work, claim a bounded case and record a human decision without downloading the full queue.</p>
        </div>
        <div className="authority-heading-actions">
          <span className="authority-session"><span aria-hidden="true" /> Reviewer session active</span>
          <button className="button secondary" onClick={onReset} type="button">Reset synthetic data</button>
        </div>
      </header>
      {error && (
        <p className="form-error" role="alert">
          <WarningCircle size={18} /> {error}
        </p>
      )}
      <section className="authority-summary" aria-label="Current demo queue summary">
        {[
          ["Open", summary?.open ?? 0, "Cases requiring action"],
          ["Unassigned", summary?.unassigned ?? 0, "Available to claim"],
          ["My batch", summary?.myBatch ?? 0, "Owned by this session"],
          ["Waiting", summary?.waitingForCitizen ?? 0, "Citizen response due"],
          ["SLA risk", (summary?.dueToday ?? 0) + (summary?.escalated ?? 0), "Due or escalated"],
        ].map(([label, value, note]) => (
          <div key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
        ))}
      </section>

      <section className="authority-capacity" aria-label="Synthetic scale demonstration">
        <div>
          <span className="eyebrow">Capacity model · illustrative</span>
          <h2>Designed for a team queue, not one endless inbox</h2>
          <p>Aggregate counters and cursor-paged worklists keep evidence out of the browser until a reviewer opens one case.</p>
        </div>
        <dl>
          <div><dt>Received today</dt><dd>{demonstrationScale?.receivedToday?.toLocaleString("en-IN") || "—"}</dd></div>
          <div><dt>Active officers</dt><dd>{demonstrationScale?.activeOfficers || "—"}</dd></div>
          <div><dt>Cases per batch</dt><dd>{demonstrationScale?.standardBatchSize || "—"}</dd></div>
          <div><dt>Synthetic history</dt><dd>{demonstrationScale?.historicalCases?.toLocaleString("en-IN") || "—"}</dd></div>
        </dl>
      </section>

      <section className="authority-worklist-shell">
        <nav className="authority-views" aria-label="Authority queue views">
          {views.map((view) => (
            <button
              className={activeView === view.id ? "active" : ""}
              key={view.id}
              type="button"
              aria-current={activeView === view.id ? "page" : undefined}
              onClick={() => setActiveView(view.id)}
            >
              <span>{view.label}</span><strong>{view.count ?? 0}</strong>
            </button>
          ))}
        </nav>

        <div className="authority-worklist panel">
          <div className="authority-worklist-heading">
            <div><h2>{views.find((view) => view.id === activeView)?.label} worklist</h2><p>Compact routing facts only. Full evidence loads after selection.</p></div>
            <span>{workItems.length} shown</span>
          </div>
          <div className="authority-table-heading" aria-hidden="true">
            <span>Case and vehicle</span><span>Issue</span><span>Queue age</span><span>Packet</span><span>SLA</span><span>Ownership</span>
          </div>
          {workItems.length ? (
            <div className="authority-worklist-rows">
              {workItems.map((item) => {
                const deadline = describeDeadline(item.reviewDeadline);
                return (
                  <button
                    className={`authority-worklist-row ${selectedTaskId === item.id ? "selected" : ""}`}
                    key={item.id}
                    type="button"
                    onClick={() => selectTask(item.id)}
                  >
                    <span className="authority-case-ref" data-label="Case and vehicle"><strong>{item.vehicleRegistration}</strong><small>{item.id}</small></span>
                    <span data-label="Issue"><strong>{humanizeCode(item.issueCode || "Not submitted")}</strong><small>{humanizeCode(item.routingTag || item.state)}</small></span>
                    <span data-label="Queue age"><strong>{describeAge(item.receivedAt)}</strong><small>{item.receivedAt ? formatDate(item.receivedAt, true) : "—"}</small></span>
                    <span data-label="Packet"><em className={`packet-status ${item.completeness === "COMPLETE" ? "complete" : "incomplete"}`}>{humanizeCode(item.completeness)}</em></span>
                    <span data-label="SLA"><em className={`sla-status ${deadline.tone}`}>{deadline.label}</em></span>
                    <span data-label="Ownership"><strong>{item.assignment?.ownedByCurrentReviewer ? "Owned by you" : item.assignment ? "Claimed" : "Unassigned"}</strong><small>{item.assignment?.leaseExpiresAt ? `Lease to ${formatDate(item.assignment.leaseExpiresAt, true)}` : "Ready for routing"}</small></span>
                    <ArrowRight size={18} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="authority-worklist-empty"><CheckCircle size={30} weight="duotone" /><strong>No cases in this view</strong><p>Choose another queue view or submit a citizen contest to create work.</p></div>
          )}
          {nextCursor && <button className="button secondary authority-load-more" type="button" onClick={() => loadWorkspace({ cursor: nextCursor, append: true })}>Load next page</button>}
        </div>
      </section>

      {detailLoading ? (
        <section className="authority-detail-loading" aria-live="polite"><ArrowsClockwise size={22} /> Loading the selected evidence packet…</section>
      ) : task ? (
        <section className="authority-case-section" aria-labelledby="authority-case-title">
          <div className="authority-case-toolbar">
            <div>
              <span className="eyebrow">Selected case · {task.id}</span>
              <h2 id="authority-case-title">{taskTitle}</h2>
            </div>
            <div className="authority-owner-control">
              <span>{taskResolved ? "Closed record" : selectedWorkItem?.assignment?.ownedByCurrentReviewer ? "Claimed by this reviewer" : selectedWorkItem?.assignment ? "Claimed by another reviewer" : "Unassigned case"}</span>
              {!taskResolved && !selectedWorkItem?.assignment && <button className="button primary" type="button" disabled={working} onClick={claimTask}>Claim for 30 minutes</button>}
            </div>
          </div>
          <section className="review-workspace">
          <div className="panel review-evidence">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Queue item · {task.id}</span>
                <h2>{taskTitle}</h2>
              </div>
              <span className="status-pill">{task.stateLabel}</span>
            </div>
            <div className="statement">
              <FileText size={20} />
              <p>{task.contest?.statement || task.decision?.explanation || "No citizen grievance statement is attached to this case record."}</p>
            </div>
            {issuePacket && (
              <section className="review-contract-summary" aria-label="Issue-specific review packet">
                <header>
                  <div><span className="eyebrow">Issue route</span><strong>{issuePacket.issueLabel}</strong></div>
                  <em>{humanizeCode(issuePacket.routingTag)}</em>
                </header>
                <dl>
                  {Object.entries(issuePacket.details || {}).map(([code, value]) => (
                    <div key={code}><dt>{humanizeCode(code)}</dt><dd>{formatIssueDetail(code, value)}</dd></div>
                  ))}
                </dl>
                <p><strong>Required packet:</strong> {issuePacket.requiredEvidence.map(humanizeCode).join(", ")}</p>
              </section>
            )}
            <EvidencePassport passport={task.evidencePassport} compact />
            {task.evidence?.[0]?.assetPath && (!lowData || reviewMediaRequested) ? (
              <img
                src={task.evidence[0].previewAssetPath || task.evidence[0].assetPath}
                alt="Synthetic traffic enforcement frame for reviewer assessment"
                loading="lazy"
                decoding="async"
              />
            ) : task.evidence?.[0]?.assetPath ? (
              <LowDataPlaceholder onLoad={() => setReviewMediaRequested(true)} label="Load reviewer evidence" />
            ) : (
              <div className="review-evidence-fallback" role="status">
                <CameraSlash size={30} weight="duotone" />
                <div>
                  <strong>Original image is not retained in this historical demo record</strong>
                  <p>
                    Review the available capture metadata and citizen packet. Choose the flagship
                    wrong-vehicle case when a visual vehicle comparison is required.
                  </p>
                </div>
                <dl>
                  <div><dt>Source</dt><dd>{task.evidence?.[0]?.captureSource === "OFFICER_MOBILE" ? "Officer mobile" : "Fixed camera"}</dd></div>
                  <div><dt>Recorded</dt><dd>{formatDate(task.evidence?.[0]?.capturedAt || task.allegation.eventAt, true)}</dd></div>
                  <div><dt>Location</dt><dd>{task.evidence?.[0]?.location?.label || task.allegation.location}</dd></div>
                </dl>
              </div>
            )}
            <ReviewerEvidenceContext caseRecord={task} showMedia={!lowData || reviewMediaRequested} />
            <div className="vehicle-pair">
              <VehicleCard
                title="Enforcement record"
                vehicle={task.detectedVehicle}
                tone="detected"
              />
              <VehicleCard
                title="Registration profile"
                vehicle={task.registeredVehicle}
                tone="registered"
              />
            </div>
          </div>
          <aside className="decision-card">
            <span className="eyebrow">Decision control</span>
            <h2>Record a reasoned outcome</h2>
            <p>The selected issue contract controls the checks, missing-item request and outcomes. A human remains accountable for the recorded reason.</p>
            <div className="review-checklist">
              <strong>Reviewer checklist</strong>
              <ul>
                {(reviewerChecks.length ? reviewerChecks : comparisonChecks.map((check) => check.label)).map((check) => (
                  <li key={check}><Check size={16} /> {humanizeCode(check)}</li>
                ))}
              </ul>
            </div>
            {taskResolved ? (
              <div className="decision-supplied" role="status">
                <CheckCircle size={18} />
                <div><strong>Case already resolved</strong><small>{task.decision?.explanation || "The terminal case state is recorded in the shared audit trail."}</small></div>
              </div>
            ) : task.state === "INFORMATION_REQUESTED" ? (
              <div className="decision-waiting" role="status">
                <Clock size={18} />
                <div><strong>Waiting for citizen</strong><small>{task.informationRequest?.reason}</small></div>
              </div>
            ) : task.state === "CITIZEN_SUPPLEMENTED" ? (
              <div className="decision-supplied" role="status">
                <CheckCircle size={18} />
                <div><strong>Requested item received</strong><small>Packet version {task.supplements?.at(-1)?.packetVersion || 2} is ready for the final human decision.</small></div>
              </div>
            ) : issuePacket?.allowedOutcomes?.includes("INFORMATION_REQUESTED") || !issuePacket ? (
              <button
                className="button request-info full"
                disabled={working || !selectedWorkItem?.assignment?.ownedByCurrentReviewer}
                onClick={askForInformation}
                type="button"
              >
                Request one missing item <FileText size={18} />
              </button>
            ) : null}
            {!taskResolved && task.state !== "INFORMATION_REQUESTED" && allowedDecisionOutcomes.map((outcome) => (
              <button
                className={`button full ${["QUASHED", "PAID"].includes(outcome) ? "approve" : outcome === "REJECTED" ? "secondary" : "route-outcome"}`}
                disabled={working || !selectedWorkItem?.assignment?.ownedByCurrentReviewer}
                key={outcome}
                onClick={() => decide(outcome)}
                type="button"
              >
                {REVIEW_OUTCOMES[outcome]?.label || humanizeCode(outcome)}
                {["QUASHED", "PAID"].includes(outcome) && <CheckCircle size={18} />}
              </button>
            ))}
          </aside>
          </section>
        </section>
      ) : (
        <section className="authority-detail-empty">
          <ListChecks size={34} weight="duotone" />
          <div><strong>Select a case to inspect its packet</strong><p>The authority view loads one full evidence record at a time.</p></div>
        </section>
      )}
    </main>
  );
}

export function App() {
  const [section, setSection] = useState(() => {
    if (typeof window === "undefined") return "gateway";
    if (window.location.pathname.startsWith("/authority")) return "reviewer";
    if (window.location.pathname.startsWith("/challans/")) return "case";
    if (window.location.pathname === "/challans") return "challans";
    if (window.location.pathname === "/account") return "dashboard";
    if (window.location.pathname === "/services") return "services";
    if (window.location.pathname === "/") return "gateway";
    const requested = new URLSearchParams(window.location.search).get("demo");
    if (["case", "dashboard", "challans", "services", "reviewer"].includes(requested)) return requested;
    const saved = window.localStorage.getItem("challan-nyay-section");
    return ["case", "dashboard", "challans", "services"].includes(saved) ? saved : "gateway";
  });
  const [caseRecord, setCaseRecord] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [accountId, setAccountId] = useState(() => typeof window !== "undefined" ? window.localStorage.getItem("challan-nyay-account-id") || DEFAULT_ACCOUNT_ID : DEFAULT_ACCOUNT_ID);
  const [selectedVehicle, setSelectedVehicle] = useState("ALL");
  const [caseReturnSection, setCaseReturnSection] = useState("gateway");
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contestOpen, setContestOpen] = useState(false);
  const [contestGround, setContestGround] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [batchPaymentOpen, setBatchPaymentOpen] = useState(false);
  const [batchPaymentCases, setBatchPaymentCases] = useState([]);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountActive, setAccountActive] = useState(
    () => typeof window !== "undefined" && (
      window.localStorage.getItem("challan-nyay-demo-account") === "active" ||
      ["dashboard", "challans"].includes(section)
    ),
  );
  const [language, setLanguage] = useState(() => typeof window !== "undefined" ? window.localStorage.getItem("challan-nyay-language") || "en" : "en");
  const [fontScale, setFontScale] = useState(() => typeof window !== "undefined" ? Number(window.localStorage.getItem("challan-nyay-font-scale")) || 1 : 1);
  const [highContrast, setHighContrast] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("challan-nyay-contrast") === "true");
  const [lowData, setLowData] = useState(() => typeof window !== "undefined" && (
    window.localStorage.getItem("challan-nyay-low-data") === "true" || navigator.connection?.saveData === true
  ));
  const entryInitialized = useRef(false);
  useEffect(() => {
    const currentState = window.history.state || {};
    if (!currentState.challanNyayRoute) {
      window.history.replaceState({
        ...currentState,
        challanNyayRoute: { depth: 0, section, caseReturnSection },
      }, "", window.location.href);
    }
  }, []);
  useEffect(() => {
    if (entryInitialized.current) return;
    entryInitialized.current = true;
    async function initializeEntry() {
      const handoffToken = new URLSearchParams(window.location.search).get("channelHandoff");
      if (handoffToken) {
        setLoading(true);
        try {
          const response = await fetch("/api/channels/whatsapp/handoffs/exchange", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ token: handoffToken }),
          });
          const contentType = response.headers.get("content-type") || "";
          const result = contentType.includes("application/json") ? await response.json() : null;
          if (!response.ok || !result?.token) {
            throw new Error(result?.message || "This protected channel link is no longer available.");
          }
          window.localStorage.setItem(CITIZEN_SESSION_KEY, result.token);
          window.localStorage.setItem("challan-nyay-demo-account", "active");
          setAccountActive(true);
          window.history.replaceState({
            ...(window.history.state || {}),
            challanNyayRoute: {
              depth: window.history.state?.challanNyayRoute?.depth || 0,
              section: "case",
              caseReturnSection: "gateway",
            },
          }, "", result.destination);
          const record = await loadCase(result.scope?.caseIds?.[0] || CASE_ID);
          if (record) {
            setCaseReturnSection("gateway");
            setSection("case");
            if (result.purpose === "PAY_CASE") setPaymentOpen(true);
            if (["PAY_ALL_ELIGIBLE", "PAY_SELECTED"].includes(result.purpose)) {
              const selected = await Promise.all((result.scope?.caseIds || []).map(async (caseId) => {
                const detail = await request(`/api/cases/${caseId}`);
                return { ...detail.case, tracking: detail.tracking };
              }));
              setBatchPaymentCases(selected);
              setBatchPaymentOpen(true);
            }
            if (result.purpose === "RAISE_GRIEVANCE") {
              setContestGround(result.scope?.ground || null);
              setContestOpen(true);
            }
          }
        } catch (reason) {
          setError(reason.message);
          window.history.replaceState({
            ...(window.history.state || {}),
            challanNyayRoute: {
              depth: window.history.state?.challanNyayRoute?.depth || 0,
              section: "gateway",
              caseReturnSection: "gateway",
            },
          }, "", "/");
          setSection("gateway");
        } finally {
          setLoading(false);
        }
        return;
      }
      const routeCaseId = window.location.pathname.startsWith("/challans/")
        ? decodeURIComponent(window.location.pathname.slice("/challans/".length))
        : CASE_ID;
      if (["case", "dashboard", "challans"].includes(section) && !caseRecord) await loadCase(routeCaseId);
      if (accountActive && ["dashboard", "challans"].includes(section) && !portfolio) await loadPortfolio(accountId);
    }
    initializeEntry();
  }, []);
  useEffect(() => {
    const onPopState = (event) => {
      const path = window.location.pathname;
      const routeState = event.state?.challanNyayRoute;
      if (routeState?.caseReturnSection) setCaseReturnSection(routeState.caseReturnSection);
      if (path.startsWith("/authority")) setSection("reviewer");
      else if (path.startsWith("/challans/")) {
        const caseId = decodeURIComponent(path.slice("/challans/".length));
        setSection("case");
        loadCase(caseId);
      }
      else if (path === "/challans") setSection("challans");
      else if (path === "/account") setSection("dashboard");
      else if (path === "/services") setSection("services");
      else setSection("gateway");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  useEffect(() => {
    if (section === "case") {
      const pathCaseId = window.location.pathname.startsWith("/challans/")
        ? decodeURIComponent(window.location.pathname.slice("/challans/".length))
        : null;
      if (!caseRecord || (pathCaseId && pathCaseId !== caseRecord.id)) return;
    }
    const nextPath = section === "reviewer"
      ? "/authority"
      : section === "case" && caseRecord
        ? `/challans/${encodeURIComponent(caseRecord.id)}`
        : section === "challans"
          ? "/challans"
          : section === "dashboard"
            ? "/account"
            : section === "services"
              ? "/services"
              : "/";
    const currentState = window.history.state || {};
    const currentRoute = currentState.challanNyayRoute;
    if (window.location.pathname !== nextPath) {
      window.history.pushState({
        ...currentState,
        challanNyayRoute: {
          depth: (currentRoute?.depth || 0) + 1,
          section,
          caseReturnSection,
        },
      }, "", nextPath);
    } else if (
      !currentRoute ||
      currentRoute.section !== section ||
      currentRoute.caseReturnSection !== caseReturnSection
    ) {
      window.history.replaceState({
        ...currentState,
        challanNyayRoute: {
          depth: currentRoute?.depth || 0,
          section,
          caseReturnSection,
        },
      }, "", nextPath);
    }
  }, [section, caseRecord?.id, caseReturnSection]);
  useEffect(() => {
    window.localStorage.setItem("challan-nyay-section", section);
  }, [section]);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [section, caseRecord?.id]);
  useEffect(() => {
    window.localStorage.setItem("challan-nyay-language", language);
    window.localStorage.setItem("challan-nyay-font-scale", String(fontScale));
    window.localStorage.setItem("challan-nyay-contrast", String(highContrast));
    window.localStorage.setItem("challan-nyay-low-data", String(lowData));
  }, [language, fontScale, highContrast, lowData]);
  async function loadCase(caseId = CASE_ID) {
    setLoading(true);
    setError("");
    try {
      const result = await request(`/api/cases/${caseId}`);
      const record = { ...result.case, tracking: result.tracking };
      setCaseRecord(record);
      setAudit(result.audit);
      return record;
    } catch (reason) {
      setError(reason.message);
      return null;
    } finally {
      setLoading(false);
    }
  }
  async function loadPortfolio(nextAccountId = accountId) {
    setLoading(true);
    setError("");
    try {
      const result = await request("/api/demo/accounts/" + nextAccountId);
      setPortfolio(result);
      setAccountId(nextAccountId);
      window.localStorage.setItem("challan-nyay-account-id", nextAccountId);
      if (!caseRecord && result.cases[0]) {
        const detail = await request("/api/cases/" + result.cases[0].id);
        setCaseRecord({ ...detail.case, tracking: detail.tracking });
        setAudit(detail.audit);
      }
      return result;
    } catch (reason) {
      setError(reason.message);
      return null;
    } finally {
      setLoading(false);
    }
  }
  async function found(caseId) {
    setCaseReturnSection("gateway");
    const foundCase = await loadCase(caseId);
    if (foundCase) setSection("case");
  }
  async function openAccount() {
    if (!accountActive) {
      setAccountOpen(true);
      return;
    }
    const result = portfolio || (await loadPortfolio(accountId));
    if (result) setSection("dashboard");
  }
  async function createAccount() {
    window.localStorage.setItem("challan-nyay-demo-account", "active");
    setAccountActive(true);
    setAccountOpen(false);
    const result = await loadPortfolio(accountId);
    if (result) setSection("dashboard");
  }
  async function openChallans(vehicle = "ALL") {
    const result = portfolio || (await loadPortfolio(accountId));
    if (result) {
      setSelectedVehicle(vehicle || "ALL");
      setSection("challans");
    }
  }
  async function switchAccount(nextAccountId) {
    const result = await loadPortfolio(nextAccountId);
    if (result) {
      setCaseRecord(result.cases[0] || null);
      setSelectedVehicle("ALL");
      setSection("dashboard");
    }
  }
  async function viewCase(caseId, returnSection = "challans") {
    setCaseReturnSection(returnSection);
    const record = await loadCase(caseId);
    if (record) setSection("case");
  }
  function goBackWithinApp(fallback) {
    const routeDepth = window.history.state?.challanNyayRoute?.depth || 0;
    if (routeDepth > 0) {
      window.history.back();
      return;
    }
    fallback();
  }
  async function reset() {
    setError("");
    try {
      await request("/api/demo/reset", { method: "POST", body: "{}" });
      setCaseRecord(null);
      setPortfolio(null);
      setAudit([]);
      window.localStorage.removeItem("challan-nyay-demo-account");
      window.localStorage.removeItem("challan-nyay-section");
      setAccountActive(false);
      setSection("gateway");
    } catch (reason) {
      setError(reason.message);
    }
  }
  async function updateCase(nextCase, { stayInReviewer = false } = {}) {
    setCaseRecord(nextCase);
    setContestOpen(false);
    setPaymentOpen(false);
    await loadCase(nextCase.id);
    setPortfolio((current) => current ? { ...current, cases: current.cases.map((item) => item.id === nextCase.id ? nextCase : item) } : current);
    setSection(stayInReviewer ? "reviewer" : "case");
  }
  return (
    <div
      className={`app ${highContrast ? "high-contrast" : ""} ${lowData ? "low-data" : ""}`}
      style={{ "--font-scale": fontScale }}
    >
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <UtilityBar
        language={language}
        onLanguageChange={setLanguage}
        fontScale={fontScale}
        onFontScale={setFontScale}
        highContrast={highContrast}
        onContrast={() => setHighContrast((value) => !value)}
        lowData={lowData}
        onLowData={() => setLowData((value) => !value)}
      />
      <Header
        section={section}
        onCitizen={() => setSection("gateway")}
        onDashboard={openAccount}
        onChallans={accountActive ? () => openChallans() : () => setAccountOpen(true)}
        onServices={() => setSection("services")}
        onReviewer={() => setSection("reviewer")}
        accountActive={accountActive}
      />
      {error && (
        <div className="global-error" role="alert">
          {error}
        </div>
      )}
      {loading ? (
        <LoadingState />
      ) : section === "gateway" ? (
        <CitizenGateway language={language} onFound={found} lowData={lowData} />
      ) : section === "services" ? (
        <ServicesPage
          onLookup={() => setSection("gateway")}
          onChallans={accountActive ? () => openChallans() : () => setAccountOpen(true)}
          onDashboard={openAccount}
        />
      ) : section === "dashboard" && portfolio ? (
        <AccountDashboard
          portfolio={portfolio}
          onViewCase={(caseId) => viewCase(caseId, "dashboard")}
          onViewChallans={openChallans}
          onSwitchAccount={switchAccount}
        />
      ) : section === "challans" && portfolio ? (
        <ChallanList
          cases={portfolio.cases}
          vehicles={portfolio.account.vehicles}
          initialVehicle={selectedVehicle}
          onViewCase={(caseId) => viewCase(caseId, "challans")}
          onBack={() => goBackWithinApp(() => setSection(accountActive ? "dashboard" : "gateway"))}
        />
      ) : section === "reviewer" ? (
        <ReviewerDesk onCaseChanged={updateCase} onReset={reset} lowData={lowData} />
      ) : caseRecord ? (
        <CitizenCase
          caseRecord={caseRecord}
          auditCount={audit.length}
          onContest={() => {
            setContestGround(null);
            setContestOpen(true);
          }}
          onPay={() => setPaymentOpen(true)}
          onBack={() => {
            goBackWithinApp(() => {
              if (caseReturnSection === "dashboard") return openAccount();
              if (caseReturnSection === "challans") return openChallans(selectedVehicle);
              setSection("gateway");
            });
          }}
          backLabel={caseReturnSection === "dashboard" ? "Back to account" : caseReturnSection === "challans" ? "Back to my challans" : "Back to lookup"}
          onInformationResponded={updateCase}
          lowData={lowData}
        />
      ) : (
        <CitizenGateway language={language} onFound={found} />
      )}
      <footer>
        <div className="shell">
          <span>Challan Nyay · independent competition prototype</span>
          <span>English · हिन्दी · తెలుగు entry-flow pilot</span>
          <span>
            <Headphones size={15} /> Keyboard and screen-reader structured
          </span>
        </div>
      </footer>
      {contestOpen && (
        <ContestDialog
          caseRecord={caseRecord}
          initialGround={contestGround || "WRONG_VEHICLE"}
          onClose={() => {
            setContestOpen(false);
            setContestGround(null);
          }}
          onSubmitted={updateCase}
        />
      )}
      {paymentOpen && (
        <PaymentDialog
          caseRecord={caseRecord}
          onClose={() => setPaymentOpen(false)}
          onPaid={updateCase}
        />
      )}
      {batchPaymentOpen && batchPaymentCases.length > 0 && (
        <BatchPaymentDialog
          cases={batchPaymentCases}
          onClose={() => {
            setBatchPaymentOpen(false);
            setBatchPaymentCases([]);
          }}
          onPaid={async (result) => {
            setBatchPaymentOpen(false);
            setBatchPaymentCases([]);
            if (result.cases?.[0]) {
              setCaseRecord(result.cases[0]);
              await loadCase(result.cases[0].id);
            }
            if (accountActive) await loadPortfolio(accountId);
          }}
        />
      )}
      {accountOpen && (
        <AccountDialog onClose={() => setAccountOpen(false)} onReady={createAccount} />
      )}
    </div>
  );
}
