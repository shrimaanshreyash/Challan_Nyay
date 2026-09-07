const PAGE = { width: 595.28, height: 841.89 };

const COLORS = {
  navy: [17, 47, 109],
  navyDark: [7, 27, 65],
  blueSoft: [239, 246, 255],
  blueLine: [202, 217, 239],
  yellow: [255, 218, 66],
  green: [16, 124, 76],
  greenSoft: [232, 248, 239],
  ink: [18, 31, 54],
  muted: [82, 101, 132],
  white: [255, 255, 255],
};

const color = (rgb, pdfRgb) => pdfRgb(...rgb.map((channel) => channel / 255));

const money = (paise) =>
  `INR ${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(paise || 0) / 100)}`;

const dateTime = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
  }).format(new Date(value));

function wrapText(text, font, size, maxWidth) {
  const words = String(text || "-").split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawWrapped(page, text, { x, y, font, size, maxWidth, lineHeight, fill }) {
  const lines = wrapText(text, font, size, maxWidth);
  lines.forEach((line, index) => {
    page.drawText(line, { x, y: y - index * lineHeight, font, size, color: fill });
  });
  return y - lines.length * lineHeight;
}

function drawLabelValue(page, { label, value, x, y, width, regular, bold, pdfRgb }) {
  page.drawText(label.toUpperCase(), {
    x,
    y,
    font: bold,
    size: 7.5,
    characterSpacing: 0.9,
    color: color(COLORS.muted, pdfRgb),
  });
  return drawWrapped(page, value, {
    x,
    y: y - 17,
    font: regular,
    size: 10.5,
    maxWidth: width,
    lineHeight: 14,
    fill: color(COLORS.ink, pdfRgb),
  });
}

export async function createPaymentReceiptPdf({ caseRecord, paymentRoute }) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const document = await PDFDocument.create();
  const page = document.addPage([PAGE.width, PAGE.height]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const payment = caseRecord.payment;
  const vehicle = caseRecord.registeredVehicle;
  const allegation = caseRecord.allegation;

  document.setTitle(`Synthetic payment receipt ${payment.receiptId}`);
  document.setAuthor("Challan Nyay independent competition prototype");
  document.setSubject("Synthetic challan payment demonstration receipt");
  document.setKeywords(["synthetic", "demo", "challan", "receipt"]);
  document.setCreator("Challan Nyay");
  document.setProducer("Challan Nyay using pdf-lib");
  document.setCreationDate(new Date(payment.paidAt));

  page.drawRectangle({
    x: 0,
    y: PAGE.height - 122,
    width: PAGE.width,
    height: 122,
    color: color(COLORS.navyDark, rgb),
  });
  page.drawRectangle({
    x: 42,
    y: PAGE.height - 55,
    width: 34,
    height: 34,
    borderRadius: 8,
    color: color(COLORS.yellow, rgb),
  });
  page.drawText("CN", {
    x: 49,
    y: PAGE.height - 44,
    font: bold,
    size: 12,
    color: color(COLORS.navyDark, rgb),
  });
  page.drawText("CHALLAN NYAY", {
    x: 88,
    y: PAGE.height - 39,
    font: bold,
    size: 16,
    color: color(COLORS.white, rgb),
  });
  page.drawText("Independent citizen-service prototype", {
    x: 88,
    y: PAGE.height - 56,
    font: regular,
    size: 8.5,
    color: color([190, 205, 232], rgb),
  });
  page.drawRectangle({
    x: 42,
    y: PAGE.height - 101,
    width: 150,
    height: 24,
    borderRadius: 12,
    color: color(COLORS.yellow, rgb),
  });
  page.drawText("SYNTHETIC DEMO RECEIPT", {
    x: 54,
    y: PAGE.height - 93,
    font: bold,
    size: 8.5,
    color: color(COLORS.navyDark, rgb),
  });
  page.drawText("PAYMENT RECORDED", {
    x: 386,
    y: PAGE.height - 49,
    font: bold,
    size: 9,
    color: color([181, 240, 207], rgb),
  });
  page.drawText(money(payment.amountPaise), {
    x: 386,
    y: PAGE.height - 78,
    font: bold,
    size: 20,
    color: color(COLORS.white, rgb),
  });
  page.drawText("No money moved", {
    x: 386,
    y: PAGE.height - 98,
    font: regular,
    size: 8.5,
    color: color([190, 205, 232], rgb),
  });

  page.drawText("Payment confirmation", {
    x: 42,
    y: 684,
    font: bold,
    size: 22,
    color: color(COLORS.ink, rgb),
  });
  page.drawText("A durable record from the mock payment and challan ledgers", {
    x: 42,
    y: 662,
    font: regular,
    size: 10,
    color: color(COLORS.muted, rgb),
  });

  page.drawRectangle({
    x: 42,
    y: 570,
    width: 511,
    height: 68,
    borderRadius: 8,
    color: color(COLORS.greenSoft, rgb),
    borderColor: color([174, 224, 198], rgb),
    borderWidth: 1,
  });
  page.drawRectangle({
    x: 58,
    y: 589,
    width: 28,
    height: 28,
    borderRadius: 14,
    color: color(COLORS.green, rgb),
  });
  page.drawText("OK", {
    x: 64,
    y: 599,
    font: bold,
    size: 8,
    color: color(COLORS.white, rgb),
  });
  page.drawText("Payment and challan records posted", {
    x: 99,
    y: 606,
    font: bold,
    size: 11,
    color: color(COLORS.green, rgb),
  });
  page.drawText(`Provider: ${payment.providerStatus}    |    Challan ledger: ${payment.ledgerStatus}`, {
    x: 99,
    y: 587,
    font: regular,
    size: 9.5,
    color: color(COLORS.ink, rgb),
  });

  page.drawText("RECEIPT DETAILS", {
    x: 42,
    y: 538,
    font: bold,
    size: 8.5,
    characterSpacing: 1.2,
    color: color(COLORS.navy, rgb),
  });
  page.drawLine({ start: { x: 42, y: 526 }, end: { x: 553, y: 526 }, thickness: 1, color: color(COLORS.blueLine, rgb) });

  drawLabelValue(page, { label: "Receipt number", value: payment.receiptId, x: 42, y: 505, width: 228, regular, bold, pdfRgb: rgb });
  drawLabelValue(page, { label: "Recorded at", value: dateTime(payment.paidAt), x: 314, y: 505, width: 239, regular, bold, pdfRgb: rgb });
  drawLabelValue(page, { label: "Mock payment route", value: paymentRoute, x: 42, y: 453, width: 228, regular, bold, pdfRgb: rgb });
  drawLabelValue(page, { label: "Provider reference", value: payment.providerReference, x: 314, y: 453, width: 239, regular, bold, pdfRgb: rgb });
  drawLabelValue(page, { label: "Payment attempt", value: payment.attemptId, x: 42, y: 401, width: 228, regular, bold, pdfRgb: rgb });
  drawLabelValue(page, { label: "Record type", value: "Mock provider + challan-ledger posting", x: 314, y: 401, width: 239, regular, bold, pdfRgb: rgb });

  page.drawText("CHALLAN RECORDED", {
    x: 42,
    y: 350,
    font: bold,
    size: 8.5,
    characterSpacing: 1.2,
    color: color(COLORS.navy, rgb),
  });
  page.drawRectangle({
    x: 42,
    y: 214,
    width: 511,
    height: 120,
    borderRadius: 8,
    color: color(COLORS.blueSoft, rgb),
    borderColor: color(COLORS.blueLine, rgb),
    borderWidth: 1,
  });
  drawLabelValue(page, { label: "Challan ID", value: caseRecord.id, x: 58, y: 309, width: 218, regular, bold, pdfRgb: rgb });
  drawLabelValue(page, { label: "Vehicle", value: `${vehicle.registration} - ${vehicle.label || `${vehicle.make || ""} ${vehicle.model || ""}`.trim() || vehicle.type}`, x: 314, y: 309, width: 223, regular, bold, pdfRgb: rgb });
  drawLabelValue(page, { label: "Violation", value: allegation.offence, x: 58, y: 257, width: 218, regular, bold, pdfRgb: rgb });
  drawLabelValue(page, { label: "Recorded location", value: allegation.location, x: 314, y: 257, width: 223, regular, bold, pdfRgb: rgb });

  page.drawRectangle({
    x: 42,
    y: 112,
    width: 511,
    height: 78,
    borderRadius: 8,
    color: color([255, 249, 224], rgb),
    borderColor: color([236, 196, 55], rgb),
    borderWidth: 1,
  });
  page.drawText("IMPORTANT", {
    x: 58,
    y: 166,
    font: bold,
    size: 8,
    color: color([132, 85, 0], rgb),
  });
  drawWrapped(page, "This is a synthetic demonstration receipt, not a government or bank receipt. No real payment occurred. No UPI ID, PIN, OTP, card, bank account or financial credential was collected.", {
    x: 58,
    y: 147,
    font: regular,
    size: 9.2,
    maxWidth: 477,
    lineHeight: 13,
    fill: color(COLORS.ink, rgb),
  });

  page.drawLine({ start: { x: 42, y: 83 }, end: { x: 553, y: 83 }, thickness: 1, color: color(COLORS.blueLine, rgb) });
  page.drawText("Keep this file with the synthetic case record.", {
    x: 42,
    y: 61,
    font: regular,
    size: 8.5,
    color: color(COLORS.muted, rgb),
  });
  page.drawText(`Verification reference: ${payment.receiptId}`, {
    x: 309,
    y: 61,
    font: regular,
    size: 8.5,
    color: color(COLORS.muted, rgb),
  });
  page.drawText("challan-nyay.vercel.app", {
    x: 42,
    y: 43,
    font: bold,
    size: 8.5,
    color: color(COLORS.navy, rgb),
  });
  page.drawText("Independent competition prototype", {
    x: 409,
    y: 43,
    font: regular,
    size: 8.5,
    color: color(COLORS.muted, rgb),
  });

  return document.save();
}
