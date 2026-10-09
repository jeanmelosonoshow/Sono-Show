const crypto = require("node:crypto");
const {
  missingGatewayEnv,
  queryFirebirdGateway,
} = require("../lib/firebird-gateway");

const AUTH_SQL = `
  SELECT LOGIN
  FROM FUNCIONARIO
  WHERE LOGIN = ?
    AND SENHAWEB = ?
    AND STATUS = 'A'
`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  const usuario = typeof req.body?.usuario === "string" ? req.body.usuario.trim() : "";
  const senha = typeof req.body?.senha === "string" ? req.body.senha : "";
  if (!usuario || !senha) {
    return res.status(400).json({
      autorizado: false,
      mensagem: "Informe usuário e senha.",
    });
  }

  const missingEnv = missingGatewayEnv();
  if (missingEnv.length) {
    console.error("Variáveis do Gateway ausentes:", missingEnv.join(", "));
    return res.status(500).json({
      autorizado: false,
      erro: "A conexão com o ERP não está configurada.",
    });
  }

  const senhaHash = crypto.createHash("md5").update(senha).digest("hex").toLowerCase();

  try {
    const rows = await queryFirebirdGateway(AUTH_SQL, [usuario, senhaHash], {
      timeoutMs: 25000,
    });

    if (!rows.length) {
      return res.status(401).json({
        autorizado: false,
        mensagem: "Usuário ou senha inválidos ou inativos.",
      });
    }

    const row = rows[0];
    const loginField = Object.keys(row).find((name) => name.toUpperCase() === "LOGIN");
    return res.status(200).json({
      autorizado: true,
      nome: loginField ? row[loginField] : usuario,
    });
  } catch (error) {
    const status = error?.status === 504
      ? 504
      : error?.status === 503 || error?.status === 429
        ? 503
        : 502;
    console.error("Erro ao consultar autenticação pelo Gateway:", {
      code: error?.code,
      status,
      gatewayStatus: error?.gatewayStatus,
      message: error?.message,
    });
    if (status === 503) res.setHeader("Retry-After", "1");
    return res.status(status).json({
      autorizado: false,
      erro: status === 504
        ? "A consulta ao ERP excedeu o tempo limite."
        : "Não foi possível consultar o ERP no momento.",
    });
  }
}
