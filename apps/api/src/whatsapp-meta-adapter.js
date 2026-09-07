function limit(value, maximum) {
  return Array.from(String(value || "")).slice(0, maximum).join("");
}

function base(to) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: String(to),
  };
}

export function toMetaOutboundPayload(to, message) {
  if (message.type === "text") {
    return {
      ...base(to),
      type: "text",
      text: { preview_url: false, body: limit(message.body, 4096) },
    };
  }
  if (message.type === "buttons") {
    return {
      ...base(to),
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: limit(message.body, 1024) },
        action: {
          buttons: message.buttons.slice(0, 3).map((button) => ({
            type: "reply",
            reply: { id: limit(button.id, 256), title: limit(button.title, 20) },
          })),
        },
      },
    };
  }
  if (message.type === "list") {
    return {
      ...base(to),
      type: "interactive",
      interactive: {
        type: "list",
        body: { text: limit(message.body, 1024) },
        action: {
          button: limit(message.button, 20),
          sections: [{
            title: "Challan Nyay",
            rows: message.rows.slice(0, 10).map((row) => ({
              id: limit(row.id, 200),
              title: limit(row.title, 24),
              description: limit(row.description, 72),
            })),
          }],
        },
      },
    };
  }
  if (message.type === "image") {
    const link = String(message.link || "");
    if (!/^https?:\/\//i.test(link)) {
      throw Object.assign(new Error("Meta image messages require an absolute HTTP(S) URL."), {
        code: "INVALID_CHANNEL_MEDIA_URL",
      });
    }
    return {
      ...base(to),
      type: "image",
      image: {
        link,
        ...(message.caption ? { caption: limit(message.caption, 1024) } : {}),
      },
    };
  }
  if (message.type === "location") {
    const latitude = Number(message.latitude);
    const longitude = Number(message.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
      || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw Object.assign(new Error("Meta location messages require valid coordinates."), {
        code: "INVALID_CHANNEL_LOCATION",
      });
    }
    return {
      ...base(to),
      type: "location",
      location: {
        latitude,
        longitude,
        ...(message.name ? { name: limit(message.name, 1000) } : {}),
        ...(message.address ? { address: limit(message.address, 1000) } : {}),
      },
    };
  }
  throw Object.assign(new Error("Unsupported normalized WhatsApp message type."), {
    code: "UNSUPPORTED_CHANNEL_MESSAGE",
  });
}

export function toMetaOutboundPayloads(to, messages) {
  return messages.map((message) => toMetaOutboundPayload(to, message));
}

function safeErrorCode(body, status) {
  const providerCode = body?.error?.code;
  return providerCode === undefined || providerCode === null
    ? `HTTP_${status}`
    : `META_${String(providerCode).replace(/[^A-Z0-9_-]/gi, "")}`;
}

function retryableStatus(status) {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

function networkErrorCode(cause) {
  const name = String(cause?.name || "").toUpperCase();
  const code = String(cause?.code || cause?.cause?.code || "").toUpperCase();
  return name.includes("TIMEOUT") || name === "ABORTERROR" || code.includes("TIMEOUT")
    ? "META_NETWORK_TIMEOUT"
    : "META_NETWORK_ERROR";
}

function retryDelay(attempt) {
  return new Promise((resolve) => setTimeout(resolve, 150 * attempt));
}

export function createMetaWhatsAppTransport({
  accessToken,
  phoneNumberId,
  apiVersion = "v23.0",
  fetchImpl = globalThis.fetch,
  requestTimeoutMs = 12_000,
  maxAttempts = 2,
} = {}) {
  const enabled = Boolean(accessToken && phoneNumberId);
  if (enabled && typeof fetchImpl !== "function") {
    throw new TypeError("A fetch implementation is required for Meta WhatsApp delivery.");
  }
  if (!/^v\d+\.\d+$/.test(apiVersion)) {
    throw new TypeError("The Meta Graph API version must look like v23.0.");
  }
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 3) {
    throw new TypeError("Meta delivery attempts must be an integer between 1 and 3.");
  }
  const endpoint = `https://graph.facebook.com/${apiVersion}/${encodeURIComponent(String(phoneNumberId || ""))}/messages`;

  return {
    enabled,
    mode: enabled ? "META_CLOUD_API" : "SIGNED_FIXTURE",
    async send(to, message) {
      if (!enabled) {
        const error = new Error("Meta WhatsApp delivery is not configured.");
        error.code = "META_TRANSPORT_DISABLED";
        error.retryable = false;
        throw error;
      }
      const payload = JSON.stringify(toMetaOutboundPayload(to, message));
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        let response;
        try {
          response = await fetchImpl(endpoint, {
            method: "POST",
            headers: {
              authorization: `Bearer ${accessToken}`,
              "content-type": "application/json",
            },
            body: payload,
            signal: AbortSignal.timeout(requestTimeoutMs),
          });
        } catch (cause) {
          if (attempt < maxAttempts) {
            await retryDelay(attempt);
            continue;
          }
          const error = new Error("Meta WhatsApp delivery could not reach the provider.", { cause });
          error.code = networkErrorCode(cause);
          error.retryable = true;
          throw error;
        }

        const body = await response.json().catch(() => null);
        if (!response.ok) {
          const error = new Error("Meta WhatsApp rejected the outbound message.");
          error.code = safeErrorCode(body, response.status);
          error.retryable = retryableStatus(response.status);
          error.httpStatus = response.status;
          if (error.retryable && attempt < maxAttempts) {
            await retryDelay(attempt);
            continue;
          }
          throw error;
        }
        const providerMessageId = body?.messages?.[0]?.id;
        if (!providerMessageId) {
          const error = new Error("Meta WhatsApp accepted the request without returning a message id.");
          error.code = "META_MESSAGE_ID_MISSING";
          error.retryable = true;
          throw error;
        }
        return { providerMessageId: String(providerMessageId) };
      }
      throw new Error("Meta WhatsApp delivery attempts were exhausted.");
    },
  };
}

export async function dispatchMetaOutbox({ repository, transport, providerEventId, recipient }) {
  if (!transport.enabled) return { mode: transport.mode, attempted: 0, sent: 0, failed: 0 };
  const claimed = await repository.claimChannelOutbox(providerEventId);
  const outcome = { mode: transport.mode, attempted: claimed.length, sent: 0, failed: 0 };
  for (const item of claimed.sort((left, right) => left.messageIndex - right.messageIndex)) {
    try {
      const sent = await transport.send(recipient, item.payload);
      await repository.markChannelOutboxSent({
        id: item.id,
        providerMessageId: sent.providerMessageId,
      });
      outcome.sent += 1;
    } catch (error) {
      await repository.markChannelOutboxFailed({
        id: item.id,
        errorCode: error.code || "META_DELIVERY_ERROR",
        retryable: error.retryable !== false,
      });
      outcome.failed += 1;
    }
  }
  return outcome;
}
