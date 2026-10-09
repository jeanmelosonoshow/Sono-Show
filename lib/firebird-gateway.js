const { createHash, createHmac, randomUUID } = require("node:crypto");

class FirebirdGatewayError extends Error {
  constructor(message, { code, status, gatewayStatus, cause } = {}) {
    super(message);
    this.name = "FirebirdGatewayError";
    this.code = code || "FIREBIRD_GATEWAY_ERROR";
    this.status = status || 502;
    this.gatewayStatus = gatewayStatus;
    this.cause = cause;
  }
}

function gatewayConfig() {
  return {
    url: String(process.env.FIREBIRD_GATEWAY_URL || "").trim().replace(/\/+$/, ""),
    tokenId: String(process.env.FIREBIRD_GATEWAY_TOKEN_ID || "").trim(),
    secret: String(process.env.FIREBIRD_GATEWAY_HMAC_SECRET || "").trim(),
  };
}

function missingGatewayEnv() {
  return [
    "FIREBIRD_GATEWAY_URL",
    "FIREBIRD_GATEWAY_TOKEN_ID",
    "FIREBIRD_GATEWAY_HMAC_SECRET",
  ].filter((name) => !String(process.env[name] || "").trim());
}

async function queryFirebirdGateway(sql, params = [], options = {}) {
  const { url, tokenId, secret } = gatewayConfig();
  const missing = missingGatewayEnv();
  if (missing.length) {
    throw new FirebirdGatewayError(`Configuracao incompleta: ${missing.join(", ")}`, {
      code: "FIREBIRD_GATEWAY_CONFIG_ERROR",
      status: 500,
    });
  }

  const path = "/query";
  const body = JSON.stringify({ sql, params });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomUUID();
  const bodyHash = createHash("sha256").update(body, "utf8").digest("hex");
  const canonical = [timestamp, nonce, "POST", path, bodyHash].join("\n");
  const signature = createHmac("sha256", secret).update(canonical, "utf8").digest("hex");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(options.timeoutMs) || 25000);
  const fetchImpl = options.fetchImpl || globalThis.fetch;

  try {
    const response = await fetchImpl(`${url}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenId}`,
        "Content-Type": "application/json",
        "X-Timestamp": timestamp,
        "X-Nonce": nonce,
        "X-Signature": signature,
      },
      body,
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const upstreamStatus = response.status;
      throw new FirebirdGatewayError(String(payload.detail || payload.error || "Falha no Gateway Firebird."), {
        code: `FIREBIRD_GATEWAY_${String(payload.error || upstreamStatus).toUpperCase()}`,
        status: upstreamStatus === 401 || upstreamStatus === 403 ? 502 : upstreamStatus,
        gatewayStatus: upstreamStatus,
      });
    }
    if (payload.success !== true || !Array.isArray(payload.rows)) {
      throw new FirebirdGatewayError("Resposta invalida do Gateway Firebird.", {
        code: "FIREBIRD_GATEWAY_INVALID_RESPONSE",
        status: 502,
      });
    }
    return payload.rows;
  } catch (error) {
    if (error instanceof FirebirdGatewayError) throw error;
    if (error?.name === "AbortError") {
      throw new FirebirdGatewayError("Tempo limite ao consultar o Gateway Firebird.", {
        code: "FIREBIRD_GATEWAY_TIMEOUT",
        status: 504,
        cause: error,
      });
    }
    throw new FirebirdGatewayError("Falha de comunicacao com o Gateway Firebird.", {
      code: "FIREBIRD_GATEWAY_UNREACHABLE",
      status: 503,
      cause: error,
    });
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  FirebirdGatewayError,
  gatewayConfig,
  missingGatewayEnv,
  queryFirebirdGateway,
};
