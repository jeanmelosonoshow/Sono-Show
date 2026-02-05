// api/auth.js
export default async function handler(req, res) {
  // 1. Configurar Headers para evitar erros de acesso (CORS)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Pegar os dados enviados pelo seu formulário
  const { usuario, senha } = req.body;

  try {
    // 3. Chamar o seu ERP (Ajuste a URL e o formato conforme seu ERP)
    const response = await fetch('URL_DO_SEU_ERP_AQUI', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        codigo: usuario, 
        password: senha 
      })
    });

    const data = await response.json();

    // 4. Lógica de validação baseada no seu ERP
    // Exemplo: se o ERP retornar { ativo: true }
    if (data.status === "Ativo" || data.ativo === true) {
      return res.status(200).json({ 
        autorizado: true, 
        nome: data.nome_funcionario || "Colaborador" 
      });
    } else {
      return res.status(401).json({ autorizado: false, mensagem: "Usuário ou senha inválidos" });
    }

  } catch (error) {
    return res.status(500).json({ autorizado: false, erro: "Erro ao conectar no ERP" });
  }
}
