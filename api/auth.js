const Firebird = require('node-firebird');
const crypto = require('crypto');

export default async function handler(req, res) {
    // Headers de CORS... (mantenha os mesmos do passo anterior)
    
    const { usuario, senha } = req.body;

    // --- LÓGICA DE CRIPTOGRAFIA ---
    // Exemplo: transformando a senha digitada em MD5 para comparar com o banco
    const senhaCriptografada = crypto.createHash('md5').update(senha).digest('hex').toUpperCase();

    const options = {
        host: process.env.DB_HOST_FB,
        port: process.env.DB_PORT_FB,
        database: process.env.DB_PATH_FB,
        user: process.env.DB_USER_FB,
        password: process.env.DB_PASSWORD_FB
    };

    Firebird.attach(options, function(err, db) {
        if (err) return res.status(500).json({ autorizado: false, erro: "Conexão falhou" });

        // Query exata com seus nomes de campos
        const sql = 'SELECT LOGIN FROM FUNCIONARIO WHERE LOGIN = ? AND SENHAWEB = ? AND STATUS = "A"';
        
        db.query(sql, [usuario, senhaCriptografada], function(err, result) {
            db.detach();

            if (result && result.length > 0) {
                return res.status(200).json({ autorizado: true, nome: result[0].LOGIN });
            } else {
                return res.status(401).json({ autorizado: false, mensagem: "Usuário ou senha inválidos" });
            }
        });
    });
}
