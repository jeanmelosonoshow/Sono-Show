const test = require("node:test");
const assert = require("node:assert/strict");
const { createHash, createHmac } = require("node:crypto");
const {
  missingGatewayEnv,
  queryFirebirdGateway,
} = require("../lib/firebird-gateway");

const ENV_NAMES = [
  "FIREBIRD_GATEWAY_URL",
  "FIREBIRD_GATEWAY_TOKEN_ID",
  "FIREBIRD_GATEWAY_HMAC_SECRET",
];

function saveEnv() {
  return Object.fromEntries(ENV_NAMES.map((name) => [name, process.env[name]]));
}

function restoreEnv(values) {
  for (const [name, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

test("informa todas as variáveis obrigatórias ausentes", () => {
  const previous = saveEnv();
  try {
    for (const name of ENV_NAMES) delete process.env[name];
    assert.deepEqual(missingGatewayEnv(), ENV_NAMES);
  } finally {
    restoreEnv(previous);
  }
});

test("assina o corpo exato com HMAC e devolve as linhas", async () => {
  const previous = saveEnv();
  const secret = "segredo-de-teste";
  process.env.FIREBIRD_GATEWAY_URL = "https://gateway.test/";
  process.env.FIREBIRD_GATEWAY_TOKEN_ID = "ssg_teste";
  process.env.FIREBIRD_GATEWAY_HMAC_SECRET = secret;
  let request;

  try {
    const rows = await queryFirebirdGateway("SELECT ? FROM RDB$DATABASE", [1], {
      fetchImpl: async (url, options) => {
        request = { url, options };
        return new Response(JSON.stringify({ success: true, rows: [{ OK: 1 }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    });

    assert.deepEqual(rows, [{ OK: 1 }]);
    assert.equal(request.url, "https://gateway.test/query");
    assert.equal(request.options.headers.Authorization, "Bearer ssg_teste");
    const bodyHash = createHash("sha256").update(request.options.body, "utf8").digest("hex");
    const canonical = [
      request.options.headers["X-Timestamp"],
      request.options.headers["X-Nonce"],
      "POST",
      "/query",
      bodyHash,
    ].join("\n");
    assert.equal(
      request.options.headers["X-Signature"],
      createHmac("sha256", secret).update(canonical, "utf8").digest("hex"),
    );
  } finally {
    restoreEnv(previous);
  }
});

test("credencial recusada pelo Gateway vira erro de integração", async () => {
  const previous = saveEnv();
  process.env.FIREBIRD_GATEWAY_URL = "https://gateway.test";
  process.env.FIREBIRD_GATEWAY_TOKEN_ID = "ssg_invalido";
  process.env.FIREBIRD_GATEWAY_HMAC_SECRET = "segredo-incorreto";

  try {
    await assert.rejects(
      queryFirebirdGateway("SELECT 1 FROM RDB$DATABASE", [], {
        fetchImpl: async () => new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      }),
      (error) => error.code === "FIREBIRD_GATEWAY_UNAUTHORIZED"
        && error.gatewayStatus === 401
        && error.status === 502,
    );
  } finally {
    restoreEnv(previous);
  }
});
