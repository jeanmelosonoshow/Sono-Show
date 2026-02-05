const Firebird = require('node-firebird');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { usuario, senha } = req.body;

    // Configurações do Banco vindas das Variáveis de Ambiente da Vercel
    const options = {
        host: process.env.DB_HOST_FB,
        port: process.env.DB_PORT_FB,
        database: process.env.DB_PATH_FB, // Caminho exato no servidor (ex: C:\Dados\ERP.FDB)
        user: process.env.DB_USER_FB,
        password: process.env.DB_PASSWORD_DB,
        lowercase_keys: false
    };

    Firebird.attach(options, function(err, db) {
        if (err) {
            return res.status(500).json({ autorizado: false, erro: "Erro de conexão: " + err.message });
        }

        // Query para Firebird 3.0 (Ajuste os nomes das colunas)
        const sql = 'SELECT NOME_FUNC FROM FUNCIONARIOS WHERE CODIGO = ? AND SENHA = ? AND ATIVO = "S"';
        
        db.query(sql, [usuario, senha], function(err, result) {
            db.detach(); // Fecha a conexão sempre!

            if (err) {
                return res.status(500).json({ autorizado: false, erro: "Erro na consulta" });
            }

            if (result.length > 0) {
                return res.status(200).json({ 
                    autorizado: true, 
                    nome: result[0].NOME_FUNC 
                });
            } else {
                return res.status(401).json({ autorizado: false, mensagem: "Login ou senha incorretos" });
            }
        });
    });
}
