import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowsClockwise,
  Bank,
  Bell,
  Buildings,
  CalendarBlank,
  Camera,
  CaretDown,
  Car,
  Check,
  CheckCircle,
  Clock,
  CreditCard,
  DownloadSimple,
  FileText,
  Gavel,
  Globe,
  Headphones,
  House,
  Info,
  IdentificationCard,
  ListChecks,
  MagnifyingGlass,
  MapPin,
  PersonArmsSpread,
  Plus,
  Receipt,
  SquaresFour,
  ShieldCheck,
  SignIn,
  UserCircle,
  Wallet,
  WarningCircle,
  X,
} from "@phosphor-icons/react";

const CASE_ID = "CN-DEMO-WRONG-VEHICLE";
const DEMO_VALUES = {
  CHALLAN: CASE_ID,
  VEHICLE: "TS09CD5678",
  DL: "DL-DEMO-2026",
};

const DEFAULT_ACCOUNT_ID = "DEMO-CITIZEN-01";

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

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "content-type": "application/json", ...options.headers },
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(body.message || "The request could not be completed.");
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

function UtilityBar({
  language,
  onLanguageChange,
  fontScale,
  onFontScale,
  highContrast,
  onContrast,
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
            <PersonArmsSpread size={16} /> High contrast
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
      </div>
    </div>
  );
}

function Header({
  section,
  onCitizen,
  onReviewer,
  onDashboard,
  onChallans,
  onServices,
  accountActive,
}) {
  function goTo(id) {
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
          onClick={onCitizen}
          aria-label="Challan Nyay home"
        >
          <span className="brand-mark">
            <ShieldCheck size={22} weight="fill" />
          </span>
          <span>
            <strong>Challan Nyay</strong>
            <small>Independent citizen-service prototype</small>
          </span>
        </button>
        <nav className="primary-nav" aria-label="Primary navigation">
          <button
            className={section === "gateway" ? "active" : ""}
            onClick={onCitizen}
            type="button"
          >
            <House size={18} /> Home
          </button>
          <button
            className={["challans", "case"].includes(section) ? "active" : ""}
            onClick={onChallans}
            type="button"
          >
            <ListChecks size={18} /> My challans
          </button>
          <button
            className={section === "services" ? "active" : ""}
            onClick={onServices}
            type="button"
          >
            <SquaresFour size={18} /> Services
          </button>
          <button onClick={() => goTo("service-journey")} type="button">
            <Info size={18} /> How it works
          </button>
          <button onClick={() => goTo("citizen-help")} type="button">
            <Headphones size={18} /> Help
          </button>
        </nav>
        <div className="header-actions">
          <button className="account-entry" onClick={onDashboard} type="button">
            {accountActive ? <UserCircle size={19} /> : <SignIn size={19} />}
            {accountActive ? "Demo account" : "Create demo account"}
          </button>
          <button
            className="reviewer-entry compact"
            onClick={onReviewer}
            type="button"
            aria-label="Open reviewer demo"
            title="Reviewer demo"
          >
            <Gavel size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

function ServiceCard({ icon, title, copy, onClick }) {
  return (
    <button className="service-card" type="button" onClick={onClick}>
      <span className="service-icon">{icon}</span>
      <span>
        <strong>{title}</strong>
        <small>{copy}</small>
      </span>
      <ArrowRight size={18} />
    </button>
  );
}

function CitizenGateway({ language, onFound }) {
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
        <img
          className="gateway-hero-art"
          src="/assets/challan-nyay-road-hero-v2.png"
          alt="Illustration of cars and scooter riders travelling on a clear Indian urban road"
        />
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
        <div className="section-heading">
          <div>
            <h2>One clear path from notice to resolution</h2>
          </div>
          <p>
            Start with one protected lookup. Review the case before deciding what
            to do next.
          </p>
        </div>
        <div className="services-grid">
          <ServiceCard
            icon={<ListChecks size={23} />}
            title="Check challan status"
            copy="See case owner, deadline and evidence"
            onClick={() => lookupRef.current?.scrollIntoView()}
          />
          <ServiceCard
            icon={<CreditCard size={23} />}
            title="Pay challan"
            copy="Mock payment with receipt and ledger status"
            onClick={() => lookupRef.current?.scrollIntoView()}
          />
          <ServiceCard
            icon={<Gavel size={23} />}
            title="Raise a grievance"
            copy="Guided grounds and documentary evidence"
            onClick={() => lookupRef.current?.scrollIntoView()}
          />
          <ServiceCard
            icon={<Clock size={23} />}
            title="Track grievance"
            copy="Current owner, events and review target"
            onClick={() => lookupRef.current?.scrollIntoView()}
          />
        </div>
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

function ServicesPage({ onLookup, onChallans, onDashboard, onReviewer }) {
  const services = [
    { icon: <MagnifyingGlass size={25} />, title: "Check challan", copy: "Search by vehicle, challan or driving licence and review evidence before acting.", action: onLookup, label: "Start lookup" },
    { icon: <ListChecks size={25} />, title: "Manage challans", copy: "Filter every notice across saved vehicles, with status, amount, location and next action.", action: onChallans, label: "View challans" },
    { icon: <Gavel size={25} />, title: "Raise and track a grievance", copy: "Choose a reason, attach evidence, receive a receipt and follow the review decision.", action: onChallans, label: "Open cases" },
    { icon: <CreditCard size={25} />, title: "Payments and receipts", copy: "Use the safe mock payment flow and retain provider, ledger and receipt references.", action: onDashboard, label: "View payments" },
    { icon: <Car size={25} />, title: "Saved vehicles", copy: "See all authorized demo vehicles connected to a citizen or fleet account.", action: onDashboard, label: "Manage vehicles" },
    { icon: <Buildings size={25} />, title: "Reviewer operations", copy: "Demonstrate jurisdiction routing, evidence comparison and a reasoned human decision.", action: onReviewer, label: "Open reviewer desk" },
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
    closeRef.current?.focus();
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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

function ContestDialog({ caseRecord, onClose, onSubmitted }) {
  const [ground, setGround] = useState("WRONG_VEHICLE");
  const [statement, setStatement] = useState(
    "The vehicle shown in the enforcement image is a black scooter. My registered vehicle is a red motorcycle and the registration numbers do not match.",
  );
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
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
            ground,
            statement,
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
      onClose={onClose}
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
                <input type="radio" name="ground" value={value} checked={ground === value} onChange={() => setGround(value)} />
                <span className="reason-icon">{icon}</span>
                <span><strong>{title}</strong><small>{copy}</small></span>
                {ground === value && <CheckCircle size={18} weight="fill" />}
              </label>)}
            </div>
            <label className="field-label" htmlFor="statement">
              What should the reviewer know?
            </label>
            <textarea
              id="statement"
              value={statement}
              onChange={(event) => setStatement(event.target.value)}
              minLength={20}
              required
            />
            <div className="evidence-note">
              <FileText size={21} />
              <span>
                <strong>Evidence packet ready</strong>
                <small>Synthetic enforcement frame and registration profile</small>
              </span>
            </div>
            <label className="declaration">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
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
          <button className="button secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button primary"
            disabled={!accepted || submitting}
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
  const updates = cases.flatMap((item) => item.timeline.map((entry) => ({ ...entry, caseId: item.id }))).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 4);
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
              <option value="DEMO-CITIZEN-01">Amit Rao · 6 challans</option>
              <option value="DEMO-FLEET-02">Neha Logistics · 3 challans</option>
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
              {["Submitted", "Evidence received", "Under review", "Decision", "Resolved"].map((label, index) => {
                const reached = index <= (progressCase.state === "CONTEST_SUBMITTED" ? 1 : progressCase.state === "UNDER_REVIEW" ? 2 : ["QUASHED", "REJECTED"].includes(progressCase.state) ? 4 : 0);
                return <div className={reached ? "reached" : ""} key={label}><span>{reached ? <Check size={15} weight="bold" /> : index + 1}</span><strong>{label}</strong></div>;
              })}
            </div>
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
                  <span className="vehicle-avatar"><Car size={23} /></span>
                  <span><strong>{vehicle.registration}</strong><small>{vehicle.label} · {vehicle.type} · {vehicle.colour}{index === 0 ? " · Primary" : ""}</small></span>
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
                <span><strong>{item.id}</strong><small>{item.registeredVehicle.registration}</small></span>
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
      <span className="vehicle-label">{title}</span>
      <strong>{vehicle.registration}</strong>
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
    </div>
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
            <small>
              {formatDate(entry.at, true)} · {entry.actor}
            </small>
          </div>
        </li>
      ))}
    </ol>
  );
}

function CitizenCase({ caseRecord, auditCount, onContest, onPay, onBack, onReviewer }) {
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
  const captureSourceLabel = primaryEvidence.captureSource === "OFFICER_MOBILE"
    ? "Officer upload"
    : "Fixed camera";
  const hasVehicleMismatch = ["registration", "type", "colour"].some(
    (field) => caseRecord.detectedVehicle[field] !== caseRecord.registeredVehicle[field],
  );
  const submitted = ["CONTEST_SUBMITTED", "UNDER_REVIEW"].includes(
    caseRecord.state,
  );
  const decided = ["QUASHED", "REJECTED"].includes(caseRecord.state);
  const quashed = caseRecord.state === "QUASHED";
  const paid = caseRecord.state === "PAID";
  const closed = decided || paid;
  const alertClass =
    quashed || paid
      ? "success"
      : decided
        ? "neutral"
        : submitted
          ? "submitted"
          : "urgent";
  const alertTitle = paid
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
  const alertCopy = paid
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
          <ArrowLeft size={17} /> Back to my challans
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
            ) : submitted ? (
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
              {paid ? "Amount paid" : quashed ? "Amount cancelled" : "Amount due"}
            </span>
            <strong>
              {quashed ? formatMoney(0) : formatMoney(caseRecord.allegation.amountPaise)}
            </strong>
            <small>
              {paid
                ? "Synthetic receipt issued"
                : quashed
                  ? `${formatMoney(caseRecord.allegation.amountPaise)} challan ceased`
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
                {primaryEvidence.assetPath ? (
                  <img
                    src={primaryEvidence.assetPath}
                    alt={`Synthetic enforcement frame showing the detected ${caseRecord.detectedVehicle.colour.toLowerCase()} ${caseRecord.detectedVehicle.type.toLowerCase()}`}
                  />
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
                  {primaryEvidence.plateAssetPath ? (
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
                  <iframe
                    title={`Map showing ${mapLocation.label}`}
                    src={mapEmbed}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <div className="map-caption">
                    <span><strong>{mapLocation.label}</strong><small>Approx. {mapLocation.accuracyMetres} m accuracy · demo coordinates</small></span>
                    <a href={mapLink} target="_blank" rel="noreferrer">Open map <ArrowRight size={14} /></a>
                  </div>
                </section>
              </div>
            </div>
            <div className="comparison comparison-inline">
              <VehicleCard title="Detected in notice" vehicle={caseRecord.detectedVehicle} tone="detected" />
              <div className={`mismatch ${hasVehicleMismatch ? "" : "match"}`}>
                {hasVehicleMismatch ? <WarningCircle size={19} weight="fill" /> : <CheckCircle size={19} weight="fill" />}
                {hasVehicleMismatch ? "Registration, type or colour does not match" : "Evidence metadata matches this vehicle"}
              </div>
              <VehicleCard title="Your authorized vehicle" vehicle={caseRecord.registeredVehicle} tone="registered" />
            </div>
          </section>
          {caseRecord.decision && (
            <section
              className={`panel decision-panel ${quashed ? "approved" : "rejected"}`}
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
            <Timeline entries={caseRecord.timeline} />
          </section>
        </div>
        <aside className="side-column">
          <section className="case-explanation-card">
            <span className="eyebrow"><Info size={15} /> Understanding what happened</span>
            <h2>{hasVehicleMismatch ? "The evidence does not match your vehicle" : "What this record says"}</h2>
            <p>
              At {formatDate(caseRecord.allegation.eventAt, true)}, {captureSourceLabel.toLowerCase()} evidence recorded a {caseRecord.detectedVehicle.colour.toLowerCase()} {caseRecord.detectedVehicle.type.toLowerCase()} at {caseRecord.allegation.location}.{" "}
              {hasVehicleMismatch
                ? `Your authorized vehicle is a ${caseRecord.registeredVehicle.colour.toLowerCase()} ${caseRecord.registeredVehicle.type.toLowerCase()} with a different registration.`
                : "The recorded vehicle details match the authorized vehicle in this synthetic account."}
            </p>
            <div className="law-card">
              <ShieldCheck size={20} />
              <span><strong>Rule and review route</strong><small>{caseRecord.jurisdiction.ruleVersion} · configured demo rule version</small></span>
            </div>
          </section>
          <section className="next-action-card">
            <span className="eyebrow">Next action owner</span>
            <h2>{caseRecord.nextActionOwner}</h2>
            {!submitted && !closed && (
              <>
                <p>
                  Review the visible mismatch before choosing. Paying closes the
                  demo case; contesting sends it for human review.
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
                <p>
                  No extra action is needed now. A reviewer must record a
                  reasoned outcome by the service target.
                </p>
                <span className="receipt">
                  <CheckCircle size={18} weight="fill" /> Receipt{" "}
                  {caseRecord.contest.receiptId}
                </span>
                <span className="deadline">
                  <CalendarBlank size={17} /> Target{" "}
                  {formatDate(caseRecord.reviewDeadline)}
                </span>
                <button className="button light full" type="button" onClick={onReviewer}>
                  Open reviewer demo <Gavel size={18} />
                </button>
              </>
            )}
            {closed && (
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

function ReviewerDesk({ onCaseChanged, onReset }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  useEffect(() => {
    request("/api/review/tasks")
      .then((body) => setTasks(body.tasks))
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);
  const task = tasks.find((item) => item.id === selectedTaskId) || tasks[0];
  async function decide(outcome) {
    setWorking(true);
    setError("");
    try {
      const isQuash = outcome === "QUASHED";
      const mismatchGround = task.contest.ground === "WRONG_VEHICLE";
      const result = await request(`/api/review/tasks/${task.id}/decisions`, {
        method: "POST",
        headers: {
          "idempotency-key": `decision-${task.id}-${outcome}-v${task.version}`,
        },
        body: JSON.stringify({
          outcome,
          reasonCode: isQuash
            ? mismatchGround ? "VEHICLE_MISMATCH_CONFIRMED" : "CITIZEN_EVIDENCE_ACCEPTED"
            : "MISMATCH_NOT_ESTABLISHED",
          explanation: isQuash
            ? mismatchGround
              ? "The enforcement image shows a different registration and vehicle profile. The challan is quashed."
              : "The submitted evidence supports the selected grievance reason. The challan is quashed with a recorded order."
            : "The supplied evidence does not establish a mismatch. The contest is rejected with the right to use the applicable official remedy.",
        }),
      });
      setTasks((current) => current.filter((item) => item.id !== task.id));
      setSelectedTaskId(null);
      onCaseChanged(result.case);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setWorking(false);
    }
  }
  if (loading) return <LoadingState />;
  return (
    <main id="main-content" className="shell reviewer-page">
      <div className="reviewer-heading">
        <div>
          <span className="eyebrow">Human-in-the-loop operations</span>
          <h1>Reviewer desk</h1>
          <p>
            Every outcome requires evidence, a structured reason and a
            plain-language explanation.
          </p>
        </div>
        <button className="button secondary" onClick={onReset} type="button">
          Reset demo
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          <WarningCircle size={18} /> {error}
        </p>
      )}
      {!task ? (
        <section className="empty-state">
          <CheckCircle size={42} weight="duotone" />
          <h2>No case is waiting</h2>
          <p>
            Submit the wrong-vehicle contest from Citizen services, then return
            here to complete the loop.
          </p>
        </section>
      ) : (
        <>
        <section className="review-queue-strip" aria-label="Reviewer queue">
          <div><span className="eyebrow">Open queue</span><strong>{tasks.length} cases need a human decision</strong></div>
          <div className="review-queue-items">{tasks.map((item) => (
            <button className={item.id === task.id ? "selected" : ""} type="button" key={item.id} onClick={() => setSelectedTaskId(item.id)}>
              <span>{item.registeredVehicle.registration}</span><small>{item.id}</small><em>{item.stateLabel}</em>
            </button>
          ))}</div>
        </section>
        <section className="review-workspace">
          <div className="panel review-evidence">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Queue item · {task.id}</span>
                <h2>{task.contest.groundLabel}</h2>
              </div>
              <span className="status-pill">{task.stateLabel}</span>
            </div>
            <div className="statement">
              <FileText size={20} />
              <p>{task.contest.statement}</p>
            </div>
            <img
              src={task.evidence[0].assetPath}
              alt="Synthetic traffic enforcement frame for reviewer assessment"
            />
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
            <p>
              The visible identifiers conflict across all three fields. This is
              a high-confidence mismatch, but a human remains accountable for
              the decision.
            </p>
            <ul>
              <li>
                <Check size={16} /> Registration differs
              </li>
              <li>
                <Check size={16} /> Vehicle type differs
              </li>
              <li>
                <Check size={16} /> Colour differs
              </li>
            </ul>
            <button
              className="button approve full"
              disabled={working}
              onClick={() => decide("QUASHED")}
              type="button"
            >
              Quash with reasons <CheckCircle size={18} />
            </button>
            <button
              className="button secondary full"
              disabled={working}
              onClick={() => decide("REJECTED")}
              type="button"
            >
              Reject with reasons
            </button>
          </aside>
        </section>
        </>
      )}
    </main>
  );
}

export function App() {
  const [section, setSection] = useState(() => {
    if (typeof window === "undefined") return "gateway";
    const requested = new URLSearchParams(window.location.search).get("demo");
    if (["case", "dashboard", "challans", "services", "reviewer"].includes(requested)) return requested;
    const saved = window.localStorage.getItem("challan-nyay-section");
    return ["case", "dashboard", "challans", "services"].includes(saved) ? saved : "gateway";
  });
  const [caseRecord, setCaseRecord] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [accountId, setAccountId] = useState(() => typeof window !== "undefined" ? window.localStorage.getItem("challan-nyay-account-id") || DEFAULT_ACCOUNT_ID : DEFAULT_ACCOUNT_ID);
  const [selectedVehicle, setSelectedVehicle] = useState("ALL");
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contestOpen, setContestOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
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
  useEffect(() => {
    if (["case", "dashboard", "challans"].includes(section) && !caseRecord) loadCase();
    if (accountActive && ["dashboard", "challans"].includes(section) && !portfolio) loadPortfolio(accountId);
  }, []);
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
  }, [language, fontScale, highContrast]);
  async function loadCase(caseId = CASE_ID) {
    setLoading(true);
    setError("");
    try {
      const result = await request(`/api/cases/${caseId}`);
      setCaseRecord(result.case);
      setAudit(result.audit);
      return result.case;
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
        setCaseRecord(detail.case);
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
  async function viewCase(caseId) {
    const record = await loadCase(caseId);
    if (record) setSection("case");
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
  async function updateCase(nextCase) {
    setCaseRecord(nextCase);
    setContestOpen(false);
    setPaymentOpen(false);
    await loadCase(nextCase.id);
    setPortfolio((current) => current ? { ...current, cases: current.cases.map((item) => item.id === nextCase.id ? nextCase : item) } : current);
    setSection("case");
  }
  function goReviewer() {
    setSection("reviewer");
  }
  return (
    <div
      className={`app ${highContrast ? "high-contrast" : ""}`}
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
      />
      <Header
        section={section}
        onCitizen={() => setSection("gateway")}
        onReviewer={goReviewer}
        onDashboard={openAccount}
        onChallans={accountActive ? () => openChallans() : () => setAccountOpen(true)}
        onServices={() => setSection("services")}
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
        <CitizenGateway language={language} onFound={found} />
      ) : section === "services" ? (
        <ServicesPage
          onLookup={() => setSection("gateway")}
          onChallans={accountActive ? () => openChallans() : () => setAccountOpen(true)}
          onDashboard={openAccount}
          onReviewer={goReviewer}
        />
      ) : section === "dashboard" && portfolio ? (
        <AccountDashboard
          portfolio={portfolio}
          onViewCase={viewCase}
          onViewChallans={openChallans}
          onSwitchAccount={switchAccount}
        />
      ) : section === "challans" && portfolio ? (
        <ChallanList
          cases={portfolio.cases}
          vehicles={portfolio.account.vehicles}
          initialVehicle={selectedVehicle}
          onViewCase={viewCase}
          onBack={() => setSection(accountActive ? "dashboard" : "gateway")}
        />
      ) : section === "reviewer" ? (
        <ReviewerDesk onCaseChanged={updateCase} onReset={reset} />
      ) : caseRecord ? (
        <CitizenCase
          caseRecord={caseRecord}
          auditCount={audit.length}
          onContest={() => setContestOpen(true)}
          onPay={() => setPaymentOpen(true)}
          onBack={() => setSection(accountActive ? "challans" : "gateway")}
          onReviewer={goReviewer}
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
          onClose={() => setContestOpen(false)}
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
      {accountOpen && (
        <AccountDialog onClose={() => setAccountOpen(false)} onReady={createAccount} />
      )}
    </div>
  );
}
