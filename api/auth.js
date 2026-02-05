const Firebird = require('node-firebird');
const crypto = require('crypto');

export default async function handler(req, res) {
    // 1. Headers de CORS para o GitHub Pages
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido' });

    const { usuario, senha } = req.body;

    // 2. Transforma a senha digitada em MD5 (Maiúsculo)
    const senhaHash = crypto.createHash('md5').update(senha).digest('hex').toLowerCase();

    // 3. Configurações usando suas variáveis da Vercel
    const options = {
        host: process.env.DB_HOST_FB,
        port: process.env.DB_PORT_FB,
        database: process.env.DB_PATH_FB,
        user: process.env.DB_USER_FB,
        password: process.env.DB_PASSWORD_FB,
        lowercase_keys: false,
        pageSize: 4096 // Padrão Firebird
    };

    // 4. Conexão e Consulta
    Firebird.attach(options, function(err, db) {
        if (err) {
            console.error("Erro de Conexão:", err.message);
            return res.status(500).json({ autorizado: false, erro: "Falha ao conectar no servidor remoto." });
        }

        const sql = "SELECT LOGIN FROM FUNCIONARIO WHERE LOGIN = '?' AND SENHAWEB = '?' AND STATUS = 'A'";
        
        db.query(sql, [usuario, senhaHash], function(err, result) {
            db.detach(); // Fecha a conexão imediatamente

            if (err) {
                console.error("Erro na Query:", err.message);
                return res.status(500).json({ autorizado: false, erro: "Erro ao consultar banco de dados." });
            }

            if (result && result.length > 0) {
                return res.status(200).json({ 
                    autorizado: true, 
                    nome: result[0].LOGIN 
                });
            } else {
                return res.status(401).json({ autorizado: false, mensagem: "Usuário ou senha inválidos ou inativos." });
            }
        });
    });
}
