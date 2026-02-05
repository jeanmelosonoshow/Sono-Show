// api/auth.js
export default async function handler(req, res) {
    // Configuração de CORS para permitir que o site acesse a API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { usuario, senha } = req.body;

    try {
        // --- AQUI ENTRA A CONEXÃO COM SEU ERP ---
        const response = await fetch('URL_DO_SEU_ERP_AQUI', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                login: usuario, 
                password: senha 
            })
        });

        const data = await response.json();

        // Ajuste a condição abaixo conforme o que o seu ERP responde
        if (data.status === "Ativo") {
            return res.status(200).json({ autorizado: true, nome: data.nome });
        } else {
            return res.status(401).json({ autorizado: false, mensagem: "Acesso negado" });
        }

    } catch (error) {
        return res.status(500).json({ autorizado: false, erro: "Falha ao conectar no ERP" });
    }
}
