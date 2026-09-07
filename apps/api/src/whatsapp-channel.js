import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { DEMO_ACCOUNTS } from "./domain.js";
import { listDisputeGroundContracts } from "./dispute-contracts.js";
import { projectCitizenTracking } from "./citizen-tracking.js";

const PROVIDER = "WHATSAPP";
const ACTIONABLE_STATES = new Set(["VIEWED"]);

const COPY = {
  en: {
    language: "Choose your language. This is a synthetic Challan Nyay demo, not a government service.",
    menu: "What would you like to do?",
    lookup: "Enter a synthetic vehicle number or challan number. Example: TS09CD5678.",
    verify: "We found a synthetic demo profile. Confirm before any case details are shown.",
    noMatch: "No synthetic demo record matched that identifier. Try TS09CD5678 or use the menu.",
    verified: "Synthetic profile verified for this demo only.",
    invalid: "That reply cannot perform an action. Choose one of the available options.",
    handoff: "Open this protected link within 10 minutes. Payment credentials are never requested in WhatsApp.",
  },
  hi: {
    language: "अपनी भाषा चुनें। यह केवल सिंथेटिक Challan Nyay डेमो है, सरकारी सेवा नहीं।",
    menu: "आप क्या करना चाहते हैं?",
    lookup: "सिंथेटिक वाहन नंबर या चालान नंबर दर्ज करें। उदाहरण: TS09CD5678।",
    verify: "हमें सिंथेटिक डेमो प्रोफ़ाइल मिली। विवरण देखने से पहले पुष्टि करें।",
    noMatch: "इस पहचान से कोई सिंथेटिक डेमो रिकॉर्ड नहीं मिला। TS09CD5678 आज़माएँ।",
    verified: "केवल इस डेमो के लिए सिंथेटिक प्रोफ़ाइल सत्यापित हुई।",
    invalid: "यह उत्तर कोई कार्रवाई नहीं कर सकता। उपलब्ध विकल्पों में से चुनें।",
    handoff: "इस सुरक्षित लिंक को 10 मिनट में खोलें। WhatsApp में भुगतान जानकारी कभी नहीं मांगी जाती।",
  },
};

function safeEqual(received, expected) {
  const receivedBuffer = Buffer.from(String(received || ""));
  const expectedBuffer = Buffer.from(String(expected || ""));
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function verifyWhatsAppSignature(rawBody, signatureHeader, appSecret) {
  if (!appSecret || !signatureHeader?.startsWith("sha256=")) return false;
  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  return safeEqual(signatureHeader, expected);
}

export function pseudonymizeWhatsAppSender(sender, identitySecret) {
  return createHmac("sha256", identitySecret)
    .update(`${PROVIDER}:${String(sender || "")}`)
    .digest("base64url");
}

function normalizeInboundMessage(message) {
  if (!message?.id || !message?.from) return null;
  const interactive = message.interactive?.button_reply || message.interactive?.list_reply;
  const command = interactive?.id || null;
  const text = message.text?.body || interactive?.title || "";
  return {
    providerEventId: String(message.id),
    sender: String(message.from),
    payloadClass: command ? "interactive" : message.type === "text" ? "text" : "unsupported",
    command: command ? String(command) : null,
    text: String(text).trim(),
  };
}

export function extractWhatsAppMessages(payload) {
  const messages = [];
  for (const entry of payload?.entry || []) {
    for (const change of entry?.changes || []) {
      for (const message of change?.value?.messages || []) {
        const normalized = normalizeInboundMessage(message);
        if (normalized) messages.push(normalized);
      }
    }
  }
  return messages;
}

export function extractWhatsAppMessage(payload) {
  return extractWhatsAppMessages(payload)[0] || null;
}

export function extractWhatsAppDeliveryStatuses(payload) {
  const statuses = [];
  for (const entry of payload?.entry || []) {
    for (const change of entry?.changes || []) {
      for (const status of change?.value?.statuses || []) {
        if (!status?.id || !status?.status) continue;
        const normalizedStatus = String(status.status).toUpperCase();
        if (!["SENT", "DELIVERED", "READ", "FAILED"].includes(normalizedStatus)) continue;
        const providerTimestamp = /^\d+$/.test(String(status.timestamp || ""))
          ? new Date(Number(status.timestamp) * 1000).toISOString()
          : new Date().toISOString();
        statuses.push({
          providerMessageId: String(status.id),
          status: normalizedStatus,
          providerTimestamp,
          errorCode: status.errors?.[0]?.code ? `META_${status.errors[0].code}` : null,
        });
      }
    }
  }
  return statuses;
}

function text(body) {
  return { type: "text", body };
}

function buttons(body, items) {
  return {
    type: "buttons",
    body,
    buttons: items.slice(0, 3).map(([id, title]) => ({ id, title })),
  };
}

function list(body, button, rows) {
  return {
    type: "list",
    body,
    button,
    rows: rows.slice(0, 10).map(([id, title, description]) => ({ id, title, description })),
  };
}

function image(link, caption) {
  return { type: "image", link, caption };
}

function locationMessage(location) {
  return {
    type: "location",
    latitude: location.latitude,
    longitude: location.longitude,
    name: location.label,
    address: `${location.label} · approximate synthetic location`,
  };
}

function publicAssetUrl(publicWebBaseUrl, assetPath) {
  if (!assetPath) return null;
  try {
    return new URL(assetPath, publicWebBaseUrl).toString();
  } catch {
    return null;
  }
}

function rupees(amountPaise) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amountPaise || 0) / 100);
}

function compactCase(caseRecord) {
  return [
    `${caseRecord.id} · ${caseRecord.stateLabel}`,
    `${caseRecord.allegation.offence} · ${rupees(caseRecord.allegation.amountPaise)}`,
    `${caseRecord.allegation.location}`,
    `Next: ${caseRecord.nextActionOwner}`,
  ].join("\n");
}

function menu(locale, verified) {
  const copy = COPY[locale] || COPY.en;
  return list(copy.menu, locale === "hi" ? "विकल्प देखें" : "View options", [
    ["CHECK_CHALLAN", locale === "hi" ? "चालान देखें" : "Check challan", "Vehicle-first protected lookup"],
    ["TRACK_CASE", locale === "hi" ? "स्थिति देखें" : "Track a case", "Committed workflow status"],
    ["PAY_CHALLANS", locale === "hi" ? "चालान भुगतान" : "Pay challans", "Choose one, several or all eligible"],
    ["RAISE_GRIEVANCE", locale === "hi" ? "शिकायत उठाएँ" : "Raise grievance", "Issue-specific protected route"],
    ...(verified ? [
      ["VIEW_VEHICLES", locale === "hi" ? "मेरे वाहन" : "My vehicles", "Saved synthetic vehicles"],
      ["PAYMENT_HISTORY", locale === "hi" ? "भुगतान इतिहास" : "Payment history", "Receipts and ledger status"],
      ["PAYMENT_HELP", locale === "hi" ? "भुगतान सहायता" : "Payment help", "Pending or duplicate payment guidance"],
    ] : [["PAYMENT_HELP", locale === "hi" ? "भुगतान सहायता" : "Payment help", "Pending or duplicate payment guidance"]]),
  ]);
}

function withConversation(conversation, patch) {
  return {
    ...conversation,
    ...patch,
    context: { ...(conversation.context || {}), ...(patch.context || {}) },
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };
}

function normalizedIdentifier(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

function accountForCase(caseRecord) {
  return DEMO_ACCOUNTS.find((account) => account.caseIds.includes(caseRecord.id)) || null;
}

function accountForVehicle(registration) {
  return DEMO_ACCOUNTS.find((account) => account.vehicles.some((vehicle) => vehicle.registration === registration)) || null;
}

function accountCases(allCases, accountId) {
  const account = DEMO_ACCOUNTS.find((item) => item.id === accountId);
  return account ? account.caseIds.map((id) => allCases.find((item) => item.id === id)).filter(Boolean) : [];
}

function conversationCases(allCases, context = {}) {
  const scopedIds = Array.isArray(context.scopeCaseIds) ? new Set(context.scopeCaseIds) : null;
  const cases = context.accountId ? accountCases(allCases, context.accountId) : allCases;
  return scopedIds ? cases.filter((item) => scopedIds.has(item.id)) : cases;
}

function casesList(cases, locale) {
  return list(
    locale === "hi" ? "एक चालान चुनें।" : "Choose a challan.",
    locale === "hi" ? "चालान" : "Challans",
    cases.map((item) => [
      `CASE:${item.id}`,
      `${item.registeredVehicle.registration} · ${rupees(item.allegation.amountPaise)}`,
      `${item.stateLabel} · ${item.allegation.offence}`,
    ]),
  );
}

function trackingCasesList(cases, locale) {
  return list(
    locale === "hi" ? "जिस चालान की स्थिति देखनी है उसे चुनें।" : "Choose the challan you want to track.",
    locale === "hi" ? "स्थिति देखें" : "Track challan",
    cases.map((item) => [
      `TRACK:${item.id}`,
      `${item.registeredVehicle.registration} · ${rupees(item.allegation.amountPaise)}`,
      `${item.stateLabel} · ${item.allegation.offence}`,
    ]),
  );
}

function casesForVehicle(allCases, accountId, registration) {
  return accountCases(allCases, accountId)
    .filter((item) => item.registeredVehicle.registration === registration);
}

function eligibleCases(allCases, context) {
  return conversationCases(allCases, context).filter((item) => ACTIONABLE_STATES.has(item.state));
}

function paymentSelectionList(cases, selectedCaseIds, locale) {
  const selected = new Set(selectedCaseIds || []);
  const rows = cases.map((item) => [
    `TOGGLE_PAY:${item.id}`,
    `${selected.has(item.id) ? "✓ " : ""}${item.registeredVehicle.registration}`,
    `${rupees(item.allegation.amountPaise)} · ${item.allegation.offence}`,
  ]);
  if (selected.size) rows.push(["REVIEW_SELECTED", locale === "hi" ? "चयन की समीक्षा" : "Review selection", `${selected.size} challan selected`]);
  rows.push(["PAY_ALL", locale === "hi" ? "सभी योग्य चालान" : "Pay all eligible", `${cases.length} eligible challans`]);
  return list(
    locale === "hi" ? "भुगतान के लिए एक या अधिक चालान चुनें।" : "Choose one or more eligible challans to pay.",
    locale === "hi" ? "चालान चुनें" : "Select challans",
    rows,
  );
}

function paymentHistory(cases, locale) {
  const paid = cases.filter((item) => item.payment);
  if (!paid.length) {
    return text(locale === "hi" ? "इस प्रोफ़ाइल में कोई भुगतान रसीद नहीं है।" : "No payment receipts are available for this profile.");
  }
  return list(
    locale === "hi" ? "रसीद और लेजर स्थिति देखने के लिए भुगतान चुनें।" : "Choose a payment to view its receipt and ledger status.",
    locale === "hi" ? "रसीदें" : "Receipts",
    paid.map((item) => [
      `RECEIPT:${item.id}`,
      item.registeredVehicle.registration,
      `${rupees(item.payment.amountPaise)} · ${item.payment.ledgerStatus}`,
    ]),
  );
}

function paymentHelp(locale) {
  const body = locale === "hi"
    ? "यदि राशि कट गई है लेकिन चालान लंबित है, दोबारा भुगतान न करें। पहले रसीद और लेजर स्थिति जाँचें; जरूरत हो तो भुगतान-सुलह शिकायत चुनें।"
    : "If money was deducted but the challan is still pending, do not pay again. Check the receipt and ledger status first, then use the payment-reconciliation grievance if needed.";
  return buttons(body, [
    ["PAYMENT_HISTORY", locale === "hi" ? "रसीदें" : "View receipts"],
    ["PAY_CHALLANS", locale === "hi" ? "भुगतान" : "Pay challans"],
    ["RAISE_GRIEVANCE", locale === "hi" ? "शिकायत" : "Report issue"],
  ]);
}

function grievanceCaseList(cases, locale) {
  const actionable = cases.filter((item) => ACTIONABLE_STATES.has(item.state));
  if (!actionable.length) {
    return text(locale === "hi" ? "शिकायत के लिए कोई योग्य चालान नहीं है।" : "There are no challans currently eligible for a grievance.");
  }
  return list(
    locale === "hi" ? "जिस चालान पर शिकायत करनी है उसे चुनें।" : "Choose the challan you want to challenge.",
    locale === "hi" ? "चालान" : "Choose challan",
    actionable.map((item) => [
      `GRIEVANCE:${item.id}`,
      item.registeredVehicle.registration,
      `${rupees(item.allegation.amountPaise)} · ${item.allegation.offence}`,
    ]),
  );
}

function caseActions(caseRecord, locale) {
  const rows = [
    [`TRACK:${caseRecord.id}`, locale === "hi" ? "स्थिति देखें" : "Track status", "Read committed case events"],
  ];
  if (ACTIONABLE_STATES.has(caseRecord.state)) {
    rows.unshift(
      [`PAY:${caseRecord.id}`, locale === "hi" ? "भुगतान करें" : "Pay this challan", "Protected web handoff"],
      [`GRIEVANCE:${caseRecord.id}`, locale === "hi" ? "शिकायत उठाएँ" : "Raise grievance", "Issue-specific guidance"],
    );
  }
  rows.push(["MAIN_MENU", locale === "hi" ? "मुख्य मेनू" : "Main menu", "Return without changing anything"]);
  return list(compactCase(caseRecord), locale === "hi" ? "अगला कदम" : "Next action", rows);
}

function vehicleMessages(vehicle, locale, publicWebBaseUrl) {
  const assetUrl = publicAssetUrl(publicWebBaseUrl, vehicle.imageAssetPath);
  const profile = locale === "hi"
    ? `${vehicle.registration}\nपंजीकृत वाहन: ${vehicle.make} ${vehicle.model}\nरंग: ${vehicle.colour} · प्रकार: ${vehicle.type}`
    : `${vehicle.registration}\nRegistered vehicle: ${vehicle.make} ${vehicle.model}\nColour: ${vehicle.colour} · Type: ${vehicle.type}`;
  return [
    ...(assetUrl ? [image(assetUrl, `${vehicle.registration} · synthetic registered-vehicle profile`)] : []),
    text(profile),
  ];
}

function caseDetailMessages(caseRecord, locale, publicWebBaseUrl) {
  const evidence = caseRecord.evidence?.[0];
  const previewUrl = publicAssetUrl(publicWebBaseUrl, evidence?.previewAssetPath || evidence?.assetPath);
  const plateUrl = publicAssetUrl(publicWebBaseUrl, evidence?.plateAssetPath);
  const mismatch = caseRecord.detectedVehicle?.registryComparison === "BODY_MISMATCH"
    || caseRecord.detectedVehicle?.type !== caseRecord.registeredVehicle?.type
    || caseRecord.detectedVehicle?.colour !== caseRecord.registeredVehicle?.colour;
  const comparison = locale === "hi"
    ? `पंजीकरण: ${caseRecord.registeredVehicle.registration}\nरिकॉर्ड: ${caseRecord.registeredVehicle.colour} ${caseRecord.registeredVehicle.type}\nसाक्ष्य में: ${caseRecord.detectedVehicle.colour} ${caseRecord.detectedVehicle.type}\nमिलान: ${mismatch ? "संभावित वाहन असंगति — मानव समीक्षा आवश्यक" : "वाहन प्रोफ़ाइल मेल खाती है"}`
    : `Registration: ${caseRecord.registeredVehicle.registration}\nRegistry: ${caseRecord.registeredVehicle.colour} ${caseRecord.registeredVehicle.type}\nEvidence: ${caseRecord.detectedVehicle.colour} ${caseRecord.detectedVehicle.type}\nComparison: ${mismatch ? "possible vehicle mismatch — human review required" : "vehicle profile matches"}`;
  return [
    ...(previewUrl ? [image(previewUrl, `${caseRecord.id} · synthetic enforcement evidence`)] : []),
    ...(plateUrl ? [image(plateUrl, `${evidence.plateRegistration || caseRecord.detectedVehicle.registration} · derived synthetic plate crop`)] : []),
    text(comparison),
    ...(Number.isFinite(evidence?.location?.latitude) && Number.isFinite(evidence?.location?.longitude)
      ? [locationMessage(evidence.location)]
      : []),
    caseActions(caseRecord, locale),
  ];
}

function trackingMessage(caseRecord, events, locale) {
  const projection = projectCitizenTracking(caseRecord, events);
  const current = projection.stages?.find((stage) => stage.status === "CURRENT")
    || projection.stages?.filter((stage) => stage.status === "COMPLETE").at(-1);
  const currentLabel = current?.label || caseRecord.stateLabel;
  const body = locale === "hi"
    ? `${caseRecord.id}\nवर्तमान स्थिति: ${currentLabel}\nअगला कदम: ${caseRecord.nextActionOwner}`
    : `${caseRecord.id}\nCurrent stage: ${currentLabel}\nNext action: ${caseRecord.nextActionOwner}`;
  return buttons(body, [[`CASE:${caseRecord.id}`, locale === "hi" ? "विवरण" : "Case details"], ["MAIN_MENU", locale === "hi" ? "मेनू" : "Menu"]]);
}

function handoffHash(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function createWhatsAppChannel({
  repository,
  identitySecret,
  handoffSecret,
  publicWebBaseUrl,
  publicAssetBaseUrl = publicWebBaseUrl,
}) {
  async function makeHandoff(conversation, senderKey, purpose, scope) {
    const nonce = randomBytes(32).toString("base64url");
    const signature = createHmac("sha256", handoffSecret).update(nonce).digest("base64url");
    const token = `${nonce}.${signature}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await repository.createChannelHandoff({
      tokenHash: handoffHash(token),
      provider: PROVIDER,
      senderKey,
      workspaceSessionId: conversation.workspaceSessionId,
      purpose,
      scope,
      expiresAt,
    });
    const join = publicWebBaseUrl.includes("?") ? "&" : "?";
    return { token, url: `${publicWebBaseUrl}${join}channelHandoff=${encodeURIComponent(token)}`, expiresAt };
  }

  async function process(message, senderKey, conversation) {
    const locale = conversation.locale || "en";
    const copy = COPY[locale];
    const command = message.command || normalizedIdentifier(message.text);
    const allCases = await repository.listSessionCases(conversation.workspaceSessionId);

    if (["HI", "HII", "HELLO", "HEY", "START", "RESTART"].includes(command)) {
      return {
        next: {
          ...conversation,
          locale: null,
          step: "CHOOSE_LANGUAGE",
          selectedCaseId: null,
          context: {},
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
        responses: [buttons(COPY.en.language, [["LANG_EN", "English"], ["LANG_HI", "हिन्दी"]])],
      };
    }

    if (["MENU", "MAIN_MENU"].includes(command)) {
      if (!conversation.locale) {
        return {
          next: withConversation(conversation, { step: "CHOOSE_LANGUAGE" }),
          responses: [buttons(COPY.en.language, [["LANG_EN", "English"], ["LANG_HI", "हिन्दी"]])],
        };
      }
      return { next: withConversation(conversation, { step: "MAIN_MENU" }), responses: [menu(locale, conversation.context.verified)] };
    }

    if (command === "LANG_EN" || command === "LANG_HI") {
      const selectedLocale = command === "LANG_HI" ? "hi" : "en";
      return {
        next: withConversation(conversation, { locale: selectedLocale, step: "MAIN_MENU" }),
        responses: [menu(selectedLocale, conversation.context.verified)],
      };
    }

    const profileActions = ["CHECK_CHALLAN", "TRACK_CASE", "PAY_CHALLANS", "RAISE_GRIEVANCE", "PAYMENT_HISTORY", "PAYMENT_HELP"];
    if (profileActions.includes(command) && !conversation.context.verified) {
      return {
        next: withConversation(conversation, { step: "ASK_LOOKUP", context: { requestedAction: command } }),
        responses: [text(copy.lookup)],
      };
    }

    if (conversation.context.verified && command === "CHECK_CHALLAN") {
      return {
        next: withConversation(conversation, { step: "CASE_LIST" }),
        responses: [casesList(conversationCases(allCases, conversation.context), locale)],
      };
    }

    if (conversation.context.verified && command === "TRACK_CASE") {
      return {
        next: withConversation(conversation, { step: "TRACK_CASE_LIST" }),
        responses: [trackingCasesList(conversationCases(allCases, conversation.context), locale)],
      };
    }

    if (conversation.context.verified && command === "PAY_CHALLANS") {
      const eligible = eligibleCases(allCases, conversation.context);
      return {
        next: withConversation(conversation, { step: "PAYMENT_SELECTION", context: { selectedPaymentCaseIds: [] } }),
        responses: eligible.length
          ? [paymentSelectionList(eligible, [], locale)]
          : [text(locale === "hi" ? "कोई भुगतान योग्य सिंथेटिक चालान नहीं है।" : "There are no eligible synthetic challans to pay.")],
      };
    }

    if (conversation.context.verified && command === "RAISE_GRIEVANCE") {
      return {
        next: withConversation(conversation, { step: "GRIEVANCE_CASE_LIST" }),
        responses: [grievanceCaseList(conversationCases(allCases, conversation.context), locale)],
      };
    }

    if (conversation.context.verified && command === "PAYMENT_HISTORY") {
      return {
        next: withConversation(conversation, { step: "PAYMENT_HISTORY" }),
        responses: [paymentHistory(conversationCases(allCases, conversation.context), locale)],
      };
    }

    if (conversation.context.verified && command === "PAYMENT_HELP") {
      return {
        next: withConversation(conversation, { step: "PAYMENT_HELP" }),
        responses: [paymentHelp(locale)],
      };
    }

    if (conversation.step === "ASK_LOOKUP" && !message.command) {
      const query = normalizedIdentifier(message.text);
      const matchingCase = allCases.find((item) => item.id === query);
      const account = matchingCase ? accountForCase(matchingCase) : accountForVehicle(query);
      const vehicleCases = matchingCase
        ? []
        : allCases.filter((item) => item.registeredVehicle?.registration === query);
      if (!matchingCase && !vehicleCases.length) {
        return { next: withConversation(conversation, { step: "ASK_LOOKUP" }), responses: [text(copy.noMatch)] };
      }
      const scopeCaseIds = matchingCase
        ? [matchingCase.id]
        : vehicleCases
          .filter((item) => !account || account.caseIds.includes(item.id))
          .map((item) => item.id);
      return {
        next: withConversation(conversation, {
          step: "CONFIRM_LOOKUP",
          context: {
            accountId: account?.id || null,
            lookupQuery: query,
            lookupScope: matchingCase ? "CASE" : "VEHICLE",
            scopeCaseIds,
            verified: false,
          },
        }),
        responses: [buttons(`${copy.verify}\n${query}`, [["VERIFY_LOOKUP", locale === "hi" ? "पुष्टि करें" : "Confirm demo"], ["MAIN_MENU", locale === "hi" ? "रद्द करें" : "Cancel"]])],
      };
    }

    if (command === "VERIFY_LOOKUP" && conversation.step === "CONFIRM_LOOKUP") {
      const account = DEMO_ACCOUNTS.find((item) => item.id === conversation.context.accountId);
      const cases = conversationCases(allCases, conversation.context);
      const requestedAction = conversation.context.requestedAction || "CHECK_CHALLAN";
      const accountName = account?.name || "Guest lookup";
      const vehicleCount = new Set(cases.map((item) => item.registeredVehicle.registration)).size;
      let step = "ACCOUNT_MENU";
      let destination = list(copy.menu, locale === "hi" ? "रिकॉर्ड देखें" : "View records", [
        ["VIEW_CHALLANS", locale === "hi" ? "मिले चालान" : "Matched challans", `${cases.length} synthetic records`],
        ["PAY_CHALLANS", locale === "hi" ? "चालान भुगतान" : "Pay challans", "Choose one, several or all eligible"],
        ["PAYMENT_HISTORY", locale === "hi" ? "भुगतान इतिहास" : "Payment history", "Receipts and ledger state"],
        ["MAIN_MENU", locale === "hi" ? "मुख्य मेनू" : "Main menu", "No action taken"],
      ]);
      if (["CHECK_CHALLAN", "TRACK_CASE"].includes(requestedAction)) {
        step = requestedAction === "TRACK_CASE" ? "TRACK_CASE_LIST" : "CASE_LIST";
        destination = requestedAction === "TRACK_CASE"
          ? trackingCasesList(cases, locale)
          : casesList(cases, locale);
      } else if (requestedAction === "PAY_CHALLANS") {
        const eligible = cases.filter((item) => ACTIONABLE_STATES.has(item.state));
        step = "PAYMENT_SELECTION";
        destination = eligible.length ? paymentSelectionList(eligible, [], locale) : text(locale === "hi" ? "कोई भुगतान योग्य चालान नहीं है।" : "There are no eligible challans to pay.");
      } else if (requestedAction === "RAISE_GRIEVANCE") {
        step = "GRIEVANCE_CASE_LIST";
        destination = grievanceCaseList(cases, locale);
      } else if (requestedAction === "PAYMENT_HISTORY") {
        step = "PAYMENT_HISTORY";
        destination = paymentHistory(cases, locale);
      } else if (requestedAction === "PAYMENT_HELP") {
        step = "PAYMENT_HELP";
        destination = paymentHelp(locale);
      }
      return {
        next: withConversation(conversation, { step, context: { verified: true, selectedPaymentCaseIds: [] } }),
        responses: [
          text(`${copy.verified}\n${accountName} · ${vehicleCount} vehicle${vehicleCount === 1 ? "" : "s"} · ${cases.length} challan${cases.length === 1 ? "" : "s"}`),
          destination,
        ],
      };
    }

    if (!conversation.context.verified && ["VIEW_VEHICLES", "VIEW_CHALLANS"].includes(command)) {
      return { next: withConversation(conversation, { step: "ASK_LOOKUP" }), responses: [text(copy.lookup)] };
    }

    if (command === "VIEW_VEHICLES") {
      const account = DEMO_ACCOUNTS.find((item) => item.id === conversation.context.accountId);
      const visibleRegistrations = new Set(conversationCases(allCases, conversation.context).map((item) => item.registeredVehicle.registration));
      const vehicles = (account?.vehicles || []).filter((vehicle) => visibleRegistrations.has(vehicle.registration));
      if (!vehicles.length) {
        return { next: withConversation(conversation, { step: "MAIN_MENU" }), responses: [text(copy.invalid)] };
      }
      return {
        next: withConversation(conversation, { step: "VEHICLE_LIST" }),
        responses: [list(
          locale === "hi" ? "एक पंजीकृत वाहन चुनें।" : "Choose a registered vehicle.",
          locale === "hi" ? "वाहन" : "Vehicles",
          vehicles.map((vehicle) => [
            `VEHICLE:${vehicle.registration}`,
            vehicle.registration,
            `${vehicle.make} ${vehicle.model} · ${vehicle.colour} ${vehicle.type}`,
          ]),
        )],
      };
    }

    if (command === "VIEW_CHALLANS") {
      return {
        next: withConversation(conversation, { step: "CASE_LIST" }),
        responses: [casesList(conversationCases(allCases, conversation.context), locale)],
      };
    }

    if (command.startsWith("TOGGLE_PAY:") && conversation.context.verified) {
      const caseId = command.slice("TOGGLE_PAY:".length);
      const eligible = eligibleCases(allCases, conversation.context);
      if (!eligible.some((item) => item.id === caseId)) {
        return { next: withConversation(conversation, { step: "PAYMENT_SELECTION" }), responses: [text(copy.invalid)] };
      }
      const selected = new Set(conversation.context.selectedPaymentCaseIds || []);
      if (selected.has(caseId)) selected.delete(caseId);
      else selected.add(caseId);
      const selectedCaseIds = [...selected];
      return {
        next: withConversation(conversation, { step: "PAYMENT_SELECTION", context: { selectedPaymentCaseIds: selectedCaseIds } }),
        responses: [paymentSelectionList(eligible, selectedCaseIds, locale)],
      };
    }

    if (command === "ADD_MORE" && conversation.context.verified) {
      const eligible = eligibleCases(allCases, conversation.context);
      return {
        next: withConversation(conversation, { step: "PAYMENT_SELECTION" }),
        responses: [paymentSelectionList(eligible, conversation.context.selectedPaymentCaseIds || [], locale)],
      };
    }

    if (command === "REVIEW_SELECTED" && conversation.context.verified) {
      const eligible = eligibleCases(allCases, conversation.context);
      const selected = eligible.filter((item) => (conversation.context.selectedPaymentCaseIds || []).includes(item.id));
      if (!selected.length) {
        return { next: withConversation(conversation, { step: "PAYMENT_SELECTION" }), responses: [paymentSelectionList(eligible, [], locale)] };
      }
      const total = selected.reduce((sum, item) => sum + item.allegation.amountPaise, 0);
      const summary = selected.map((item) => `${item.registeredVehicle.registration} · ${rupees(item.allegation.amountPaise)}`).join("\n");
      return {
        next: withConversation(conversation, { step: "CONFIRM_SELECTED_PAYMENT" }),
        responses: [buttons(
          `${summary}\nTotal: ${rupees(total)}\nReview on the protected mock-payment page?`,
          [["CONFIRM_SELECTED_PAY", locale === "hi" ? "जारी रखें" : "Continue"], ["ADD_MORE", locale === "hi" ? "चयन बदलें" : "Change selection"], ["MAIN_MENU", locale === "hi" ? "रद्द करें" : "Cancel"]],
        )],
      };
    }

    if (command === "CONFIRM_SELECTED_PAY" && conversation.step === "CONFIRM_SELECTED_PAYMENT") {
      const eligibleIds = new Set(eligibleCases(allCases, conversation.context).map((item) => item.id));
      const caseIds = (conversation.context.selectedPaymentCaseIds || []).filter((id) => eligibleIds.has(id));
      if (!caseIds.length) return { next: withConversation(conversation, { step: "PAYMENT_SELECTION" }), responses: [text(copy.invalid)] };
      const handoff = await makeHandoff(conversation, senderKey, "PAY_SELECTED", { caseIds });
      return {
        next: withConversation(conversation, { step: "HANDOFF_CREATED" }),
        responses: [text(`${copy.handoff}\n${handoff.url}`), menu(locale, true)],
      };
    }

    if (command === "PAY_ALL") {
      const eligible = eligibleCases(allCases, conversation.context);
      if (!eligible.length) {
        return { next: withConversation(conversation, { step: "ACCOUNT_MENU" }), responses: [text(locale === "hi" ? "कोई भुगतान योग्य सिंथेटिक चालान नहीं है।" : "There are no eligible synthetic challans to pay.")] };
      }
      const total = eligible.reduce((sum, item) => sum + item.allegation.amountPaise, 0);
      return {
        next: withConversation(conversation, { step: "CONFIRM_PAY_ALL", context: { payAllCaseIds: eligible.map((item) => item.id) } }),
        responses: [buttons(
          `${eligible.length} eligible challans · ${rupees(total)}\nContinue to review them on the protected mock-payment page?`,
          [["CONFIRM_PAY_ALL", locale === "hi" ? "जारी रखें" : "Continue"], ["VIEW_CHALLANS", locale === "hi" ? "चालान देखें" : "Review cases"]],
        )],
      };
    }

    if (command === "CONFIRM_PAY_ALL" && conversation.step === "CONFIRM_PAY_ALL") {
      const caseIds = conversation.context.payAllCaseIds || [];
      if (!caseIds.length) return { next: withConversation(conversation, { step: "MAIN_MENU" }), responses: [text(copy.invalid)] };
      const handoff = await makeHandoff(conversation, senderKey, "PAY_ALL_ELIGIBLE", { caseIds });
      return {
        next: withConversation(conversation, { step: "HANDOFF_CREATED" }),
        responses: [text(`${copy.handoff}\n${handoff.url}`), menu(locale, true)],
      };
    }

    if (command.startsWith("VEHICLE:")) {
      const registration = command.slice("VEHICLE:".length);
      const account = DEMO_ACCOUNTS.find((item) => item.id === conversation.context.accountId);
      const vehicle = account?.vehicles.find((item) => item.registration === registration);
      const cases = casesForVehicle(allCases, conversation.context.accountId, registration);
      if (!vehicle) return { next: withConversation(conversation, { step: "MAIN_MENU" }), responses: [text(copy.invalid)] };
      return {
        next: withConversation(conversation, { step: "CASE_LIST" }),
        responses: [...vehicleMessages(vehicle, locale, publicAssetBaseUrl), casesList(cases, locale)],
      };
    }

    if (command.startsWith("CASE:")) {
      const caseId = command.slice("CASE:".length);
      const caseRecord = conversationCases(allCases, conversation.context).find((item) => item.id === caseId);
      if (!caseRecord) return { next: withConversation(conversation, { step: "MAIN_MENU" }), responses: [text(copy.invalid), menu(locale, true)] };
      return {
        next: withConversation(conversation, { step: "CASE_DETAIL", selectedCaseId: caseId }),
        responses: caseDetailMessages(caseRecord, locale, publicAssetBaseUrl),
      };
    }

    if (command.startsWith("RECEIPT:") && conversation.context.verified) {
      const caseId = command.slice("RECEIPT:".length);
      const caseRecord = conversationCases(allCases, conversation.context).find((item) => item.id === caseId);
      if (!caseRecord?.payment) return { next: withConversation(conversation, { step: "PAYMENT_HISTORY" }), responses: [text(copy.invalid)] };
      const payment = caseRecord.payment;
      const body = locale === "hi"
        ? `${payment.receiptId}\nराशि: ${rupees(payment.amountPaise)}\nप्रदाता: ${payment.providerStatus}\nलेजर: ${payment.ledgerStatus}\nसंदर्भ: ${payment.providerReference}`
        : `${payment.receiptId}\nAmount: ${rupees(payment.amountPaise)}\nProvider: ${payment.providerStatus}\nLedger: ${payment.ledgerStatus}\nReference: ${payment.providerReference}`;
      return {
        next: withConversation(conversation, { step: "PAYMENT_RECEIPT", selectedCaseId: caseId }),
        responses: [buttons(body, [[`TRACK:${caseId}`, locale === "hi" ? "स्थिति" : "Track case"], ["PAYMENT_HISTORY", locale === "hi" ? "सभी रसीदें" : "All receipts"], ["MAIN_MENU", locale === "hi" ? "मेनू" : "Menu"]])],
      };
    }

    if (command.startsWith("TRACK:")) {
      const caseId = command.slice("TRACK:".length);
      const caseRecord = conversationCases(allCases, conversation.context).find((item) => item.id === caseId);
      if (!caseRecord) return { next: withConversation(conversation, { step: "MAIN_MENU" }), responses: [text(copy.invalid)] };
      const events = await repository.listSessionWorkflowEvents(conversation.workspaceSessionId, caseId);
      return { next: withConversation(conversation, { step: "CASE_DETAIL", selectedCaseId: caseId }), responses: [trackingMessage(caseRecord, events, locale)] };
    }

    if (command.startsWith("PAY:")) {
      const caseId = command.slice("PAY:".length);
      const caseRecord = conversationCases(allCases, conversation.context).find((item) => item.id === caseId);
      if (!caseRecord || !ACTIONABLE_STATES.has(caseRecord.state)) {
        return { next: withConversation(conversation, { step: "CASE_DETAIL" }), responses: [text(copy.invalid)] };
      }
      return {
        next: withConversation(conversation, { step: "CONFIRM_PAYMENT", selectedCaseId: caseId }),
        responses: [buttons(
          `${caseRecord.id}\nAmount: ${rupees(caseRecord.allegation.amountPaise)}\nContinue to the protected mock-payment page?`,
          [[`CONFIRM_PAY:${caseId}`, locale === "hi" ? "जारी रखें" : "Continue"], [`CASE:${caseId}`, locale === "hi" ? "वापस" : "Go back"]],
        )],
      };
    }

    if (command.startsWith("CONFIRM_PAY:") && conversation.step === "CONFIRM_PAYMENT") {
      const caseId = command.slice("CONFIRM_PAY:".length);
      if (caseId !== conversation.selectedCaseId) {
        return { next: withConversation(conversation, { step: "MAIN_MENU" }), responses: [text(copy.invalid)] };
      }
      const handoff = await makeHandoff(conversation, senderKey, "PAY_CASE", { caseIds: [caseId] });
      return {
        next: withConversation(conversation, { step: "HANDOFF_CREATED" }),
        responses: [text(`${copy.handoff}\n${handoff.url}`), buttons(copy.menu, [[`TRACK:${caseId}`, locale === "hi" ? "स्थिति देखें" : "Track case"], ["MAIN_MENU", locale === "hi" ? "मेनू" : "Menu"]])],
      };
    }

    if (command.startsWith("GRIEVANCE:")) {
      const caseId = command.slice("GRIEVANCE:".length);
      const caseRecord = conversationCases(allCases, conversation.context).find((item) => item.id === caseId);
      if (!caseRecord || !ACTIONABLE_STATES.has(caseRecord.state)) {
        return { next: withConversation(conversation, { step: "CASE_DETAIL" }), responses: [text(copy.invalid)] };
      }
      const contracts = listDisputeGroundContracts();
      return {
        next: withConversation(conversation, { step: "CHOOSE_GROUND", selectedCaseId: caseId }),
        responses: [list(
          locale === "hi" ? "अपनी समस्या चुनें। हर समस्या के लिए अलग प्रमाण मांगा जाता है।" : "Choose the issue. Each path requests different supporting proof.",
          locale === "hi" ? "समस्याएँ" : "Issues",
          contracts.map((contract) => [`GROUND:${contract.code}`, contract.label, contract.routingTag]),
        )],
      };
    }

    if (command.startsWith("GROUND:") && conversation.step === "CHOOSE_GROUND") {
      const ground = command.slice("GROUND:".length);
      const contract = listDisputeGroundContracts().find((item) => item.code === ground);
      if (!contract) return { next: withConversation(conversation, { step: "CHOOSE_GROUND" }), responses: [text(copy.invalid)] };
      const evidence = [...contract.requiredEvidence, ...contract.recommendedEvidence]
        .map((item) => `• ${item}${contract.requiredEvidence.includes(item) ? " (required)" : ""}`)
        .join("\n");
      return {
        next: withConversation(conversation, { step: "GROUND_GUIDANCE", context: { ground } }),
        responses: [buttons(
          `${contract.label}\n${contract.citizenPrompt}\n\nSupporting items:\n${evidence}`,
          [["CONTINUE_GRIEVANCE", locale === "hi" ? "वेब पर जारी रखें" : "Continue on web"], [`CASE:${conversation.selectedCaseId}`, locale === "hi" ? "वापस" : "Go back"]],
        )],
      };
    }

    if (command === "CONTINUE_GRIEVANCE" && conversation.step === "GROUND_GUIDANCE") {
      const handoff = await makeHandoff(conversation, senderKey, "RAISE_GRIEVANCE", {
        caseIds: [conversation.selectedCaseId],
        ground: conversation.context.ground,
      });
      return {
        next: withConversation(conversation, { step: "HANDOFF_CREATED" }),
        responses: [text(`${copy.handoff}\n${handoff.url}`), menu(locale, true)],
      };
    }

    return { next: withConversation(conversation, { step: "MAIN_MENU" }), responses: [text(copy.invalid), menu(locale, conversation.context.verified)] };
  }

  return {
    async handle(message, correlationId) {
      const senderKey = pseudonymizeWhatsAppSender(message.sender, identitySecret);
      const replay = await repository.getChannelInboxOutcome(message.providerEventId);
      if (replay) return { responses: replay, idempotentReplay: true, senderKey };
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const workspaceId = randomUUID();
      const conversation = await repository.ensureChannelConversation({
        provider: PROVIDER,
        senderKey,
        workspaceSession: {
          id: workspaceId,
          accountId: "DEMO-CITIZEN-01",
          expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        },
        expiresAt,
      });
      const { next, responses } = await process(message, senderKey, conversation);
      return {
        ...(await repository.commitChannelExchange({
          provider: PROVIDER,
          senderKey,
          providerEventId: message.providerEventId,
          correlationId,
          payloadClass: message.payloadClass,
          expectedVersion: conversation.version,
          nextConversation: next,
          responses,
        })),
        senderKey,
      };
    },
    consumeHandoff(token) {
      const [nonce, signature, extra] = String(token || "").split(".");
      if (!nonce || !signature || extra) return null;
      const expected = createHmac("sha256", handoffSecret).update(nonce).digest("base64url");
      if (!safeEqual(signature, expected)) return null;
      return repository.consumeChannelHandoff(handoffHash(token));
    },
  };
}
