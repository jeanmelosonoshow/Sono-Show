
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
  if (window.self !== window.top) { document.documentElement.classList.add('is-iframe'); }
 

  const USER = "jeanmelosonoshow";
  const REPO = "Sono-Show";
  let currentSlide = 0, totalSlides = 0, allFiles = [];
  let allEncartes = [];
  let setoresDataGlobal = [];
  const loadedTabs = { home: false, treinamento: false, encartes: false, catalogo: false };

   // --- LÓGICA DE LOGIN E SESSÃO ---
const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 horas em milissegundos

  loadedTabs.rh = false;

async function checkLogin() {
  const usuario = document.getElementById('user-input').value;
  const senha = document.getElementById('pass-input').value;
  const errorMsg = document.getElementById('login-error');
  const btn = document.getElementById('btn-entrar');
  const overlay = document.getElementById('login-overlay'); // Referência do overlay

  if (!usuario || !senha) return alert("Preencha todos os campos");

  btn.disabled = true;
  btn.innerText = "Conectando...";
  errorMsg.classList.add('hidden');

  try {
    const API_URL = 'https://sono-show.vercel.app/api/auth';
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha })
    });
    const res = await response.json();

    if (response.ok && res.autorizado) {
      const now = new Date().getTime();
      localStorage.setItem('sono_logged', 'true');
      localStorage.setItem('sono_login_time', now.toString());
      
      overlay.classList.add('hidden');
      overlay.style.display = 'none'; 
      
      // Chame as funções aqui para garantir que carreguem após o login
      loadHomeData();
      carregarAniversariantes(); 
    } else {
      errorMsg.innerText = res.mensagem || "Falha na autenticação";
      errorMsg.classList.remove('hidden');
    }
  } catch (e) {
    errorMsg.innerText = "Erro de rede. Tente novamente.";
    errorMsg.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerText = "Entrar";
  }
}

function logout() {
  localStorage.removeItem('sono_logged');
  localStorage.removeItem('sono_login_time');
  location.reload(); // Recarrega para voltar à tela de login
}

function checkSession() {
  const logged = localStorage.getItem('sono_logged');
  const loginTime = localStorage.getItem('sono_login_time');
  const now = new Date().getTime();

  if (logged === 'true' && loginTime) {
    // Verifica se passou de 2 horas
    if (now - parseInt(loginTime) > SESSION_TIMEOUT) {
      alert("Sua sessão expirou. Por favor, faça login novamente.");
      logout();
      return false;
    }
    return true;
  }
  return false;
}

// Listener de Enter para o Login
document.addEventListener('keypress', (e) => {
    const overlay = document.getElementById('login-overlay');
    // Verifica se o overlay existe e se NÃO está escondido antes de tentar logar
    if(e.key === 'Enter' && overlay && overlay.style.display !== 'none' && !overlay.classList.contains('hidden')) {
        checkLogin();
       carregarAniversariantes();
    }
});


async function carregarAniversariantes() {
  try {
    const response = await fetch('aniversariantes/aniversariantes.json');
    const dados = await response.json();
    
    const hoje = new Date();
    const diaHoje = hoje.getDate();
    const mesAtual = hoje.getMonth() + 1;

    // 1. Filtra aniversariantes do mês e ordena por dia
    const todosDoMes = dados.filter(p => {
      if (!p.Nascimento) return false;
      const partes = p.Nascimento.split('-');
      return parseInt(partes[1]) === mesAtual;
    }).sort((a, b) => parseInt(a.Nascimento.split('-')[2]) - parseInt(b.Nascimento.split('-')[2]));

    // 2. Separa os "Próximos 10 dias" (Hoje até Hoje + 10)
    const proximos = todosDoMes.filter(p => {
      const dia = parseInt(p.Nascimento.split('-')[2]);
      return dia >= diaHoje && dia <= (diaHoje + 10);
    });

    const secao = document.getElementById('secao-aniversariantes');
    secao.classList.remove('hidden');

    // Renderiza a estrutura interna
    secao.innerHTML = `
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h3 class="text-xl font-black text-slate-700 italic flex items-center gap-2">
          <i class="fas fa-cake-candles text-pink-500"></i> PRÓXIMOS ANIVERSARIANTES
        </h3>
        
        <button onclick="toggleCortina()" class="group relative flex items-center gap-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-3 rounded-full font-bold text-xs tracking-widest shadow-lg hover:shadow-pink-500/20 transition-all hover:-translate-y-1 active:scale-95">
          <i class="fa-solid fa-champagne-glasses text-pink-500 group-hover:animate-ping text-[10px]"></i>
         <span><strong>CLIQUE E VEJA </strong></span> TODOS ANIVERSARIANTES DO MÊS
          <i class="fa-solid fa-champagne-glasses text-blue-500  group-hover:rotate-12 transition-transform"></i>
        </button>
      </div>

      <div id="lista-proximos" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        ${renderizarCards(proximos)}
      </div>

      <div id="cortina-aniversariantes" class="max-h-0 overflow-hidden transition-all duration-700 ease-in-out opacity-0">
        <div class="pt-8 mt-8 border-t border-slate-200">
           <h4 class="text-slate-400 font-bold text-[10px] tracking-[0.3em] mb-6 uppercase">Calendário Completo do Mês</h4>
           <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pb-10">
             ${renderizarCards(todosDoMes)}
           </div>
        </div>
      </div>
    `;

  } catch (error) {
    console.error("Erro:", error);
  }
}

// Função auxiliar para gerar os cards
function renderizarCards(lista) {
  return lista.map(p => {
    const dia = p.Nascimento.split('-')[2];
    const isFeminino = p.Sexo === 'Feminino' || p.Sexo === 'F';
    const corClass = isFeminino ? 'border-l-pink-400' : 'border-l-blue-400';
    const textClass = isFeminino ? 'text-pink-500' : 'text-blue-500';

    return `
      <div class="relative bg-white border border-slate-100 rounded-xl p-3 shadow-sm border-l-4 ${corClass} transition-all hover:shadow-md">
        <div class="absolute -top-2 -right-1 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
          Dia ${dia}
        </div>
        <div class="flex justify-between items-start mb-1 text-[12px]">
          <i class="fa-solid fa-gift ${textClass} opacity-60"  style="background:#FFC107;color:#C62828; padding:10px;   border-radius:5px;  font-size:11px; display:inline-flex; align-items:center; justify-content:center; "></i>
         
        </div>
        <h4 class="font-bold text-slate-700 text-[11px] uppercase truncate">${p["Nome do Funcionário"]}</h4>
        <p class="text-[9px] text-slate-400 font-medium">Setor: ${p["Setor"]}</p>
      </div>
    `;
  }).join('');
}


// Lógica de abrir/fechar cortina
function toggleCortina() {
  const cortina = document.getElementById('cortina-aniversariantes');
  if (cortina.classList.contains('max-h-0')) {
    cortina.classList.remove('max-h-0', 'opacity-0');
    cortina.classList.add('max-h-[2000px]', 'opacity-100');
  } else {
    cortina.classList.add('max-h-0', 'opacity-0');
    cortina.classList.remove('max-h-[2000px]', 'opacity-100');
  }
}


  // --- FUNÇÕES DE DADOS E ARQUIVOS (RESTAURADAS DO ORIGINAL) ---
  async function generatePdfThumb(url, canvasId) {
   try {
    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.4 });
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport: viewport }).promise;
   } catch (e) { console.error("Erro miniatura:", e); }
  }

  /*async function loadHomeData() {
   if(loadedTabs.home) return;
   try {
    const response = await fetch(`https://raw.githubusercontent.com/${USER}/${REPO}/main/comunicados.json?t=${Date.now()}`);
    const data = await response.json();
    const carousel = document.getElementById("carousel-slides");
    if (data.banners) {
     totalSlides = data.banners.length;
     carousel.innerHTML = data.banners.map(img => `<div class="min-w-full h-full flex items-center justify-center bg-slate-900 " style="background: #160b30"><img src="${img}" class="max-w-full max-h-full object-contain"></div>`).join("");
    }
    document.getElementById("grid-comunicados").innerHTML = data.avisos.map(c => `
     <div class="bg-white p-6 rounded-xl shadow-sm border-t-4 border-${c.cor}-500 card-zoom">
      <span class="text-[10px] font-bold text-${c.cor}-600 bg-${c.cor}-50 px-2 py-1 rounded uppercase">${c.categoria}</span>
      <h4 class="font-bold text-lg mt-3 text-slate-800 leading-tight">${c.titulo}</h4>
      <p class="text-gray-500 text-sm mt-2">${c.descricao}</p>
      <div class="mt-4 pt-4 border-t border-gray-50 text-[10px] text-gray-400 font-bold uppercase">${c.data}</div>
     </div>`).join("");
    loadedTabs.home = true;
   } catch (e) { console.error(e); }
  }*/

async function loadHomeData() {
  if (loadedTabs.home) return;
  try {
    const response = await fetch(`https://raw.githubusercontent.com/${USER}/${REPO}/main/comunicados.json?t=${Date.now()}`);
    const data = await response.json();
    const carousel = document.getElementById("carousel-slides");

    // 1. Lógica dos Banners
    if (data.banners) {
      totalSlides = data.banners.length;
      carousel.innerHTML = data.banners.map(img => `
        <div class="min-w-full h-full flex items-center justify-center bg-slate-900" style="background: #160b30">
          <img src="${img}" class="max-w-full max-h-full object-contain">
        </div>`).join("");
    }

    // 2. Lógica dos Avisos (Filtro e Ordenação)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const avisosValidos = data.avisos
      .filter(c => {
        if (!c.expira) return true;
        // Tratamento para evitar erro de fuso horário (converte AAAA-MM-DD corretamente)
        const partes = c.expira.split('-');
        const dataExpira = new Date(partes[0], partes[1] - 1, partes[2]);
        return dataExpira >= hoje;
      })
      .sort((a, b) => {
          const dataA = new Date(a.data_iso).getTime();
          const dataB = new Date(b.data_iso).getTime();
          return dataB - dataA; // Garante que o maior número (mais recente) venha primeiro
        });

    // --- OPÇÃO 2: MAPEAMENTO DE CORES PARA O TAILWIND ---
    // Adicione aqui as cores que você pretende usar no JSON
    const listaCores = {
      blue:   { border: 'border-blue-500',   text: 'text-blue-600',   bg: 'bg-blue-50' },
      red:    { border: 'border-red-500',    text: 'text-red-600',    bg: 'bg-red-50' },
      green:  { border: 'border-green-500',  text: 'text-green-600',  bg: 'bg-green-50' },
      orange: { border: 'border-orange-500', text: 'text-orange-600', bg: 'bg-orange-50' },
      purple: { border: 'border-purple-500', text: 'text-purple-600', bg: 'bg-purple-50' }
    };

    // 3. Renderização do HTML
    document.getElementById("grid-comunicados").innerHTML = avisosValidos.map(c => {
      // Busca as classes baseada na cor do JSON, ou usa azul como padrão
      const estilo = listaCores[c.cor] || listaCores.blue;

      return `
        <div class="bg-white p-6 rounded-xl shadow-sm border-t-4 ${estilo.border} card-zoom">
          <span class="text-[10px] font-bold ${estilo.text} ${estilo.bg} px-2 py-1 rounded uppercase">${c.categoria}</span>
          <h4 class="font-bold text-lg mt-3 text-slate-800 leading-tight">${c.titulo}</h4>
          <p class="text-gray-500 text-sm mt-2">${c.descricao}</p>
          <div class="mt-4 pt-4 border-t border-gray-50 text-[10px] text-gray-400 font-bold uppercase">${c.data}</div>
        </div>`;
    }).join("");

    loadedTabs.home = true;
  } catch (e) {
    console.error("Erro ao carregar dados:", e);
  }
}

async function loadEncartes(path) {
  if (loadedTabs.encartes) return;
  const container = document.getElementById("grid-encartes");
  container.innerHTML = '<p class="col-span-full text-center p-10 text-slate-400 animate-pulse">Carregando encartes...</p>';
  
  try {
    const res = await fetch(`https://api.github.com/repos/${USER}/${REPO}/contents/${path}`);
    const data = await res.json();
    
    // Filtra apenas PDFs
    let pdfs = data.filter(i => i.name.toLowerCase().endsWith(".pdf"));
    
    // MANTÉM SUA LÓGICA DE ORDENAÇÃO ORIGINAL (Mês e Ano)
    pdfs.sort((a, b) => {
      const getParts = (name) => {
        const parts = name.replace('.pdf', '').split('-');
        return { mes: parseInt(parts[0]) || 0, ano: parseInt(parts[1]) || 0 };
      };
      const dA = getParts(a.name), dB = getParts(b.name);
      return (dB.ano !== dA.ano) ? dB.ano - dA.ano : dB.mes - dA.mes;
    });

    // Salva no array global para a busca usar depois
    allEncartes = pdfs;

    // Chama a renderização
    renderEncartes(allEncartes);
    loadedTabs.encartes = true;
  } catch (e) { 
    container.innerHTML = "Erro ao carregar encartes."; 
    console.error(e);
  }
}

// FUNÇÃO DE RENDERIZAÇÃO (Mantém seu layout, badges e miniaturas)
function renderEncartes(listaParaExibir) {
  const container = document.getElementById("grid-encartes");
  
  if (listaParaExibir.length === 0) {
    container.innerHTML = '<p class="col-span-full text-center p-10 text-slate-400">Nenhum encarte encontrado para esta busca.</p>';
    return;
  }

  container.innerHTML = listaParaExibir.map((pdf, index) => {
    const canvasId = `pdf-canvas-${Math.random().toString(36).substr(2, 9)}`; // ID único para não conflitar na busca
    const isNew = index === 0; // O primeiro da lista atual ganha o destaque
    
    // Gera a miniatura
    setTimeout(() => generatePdfThumb(`https://${USER}.github.io/${REPO}/${pdf.path}`, canvasId), 400);
    
    return `
      <div onclick="window.open('https://${USER}.github.io/${REPO}/${pdf.path}', '_blank')" 
           class="relative cursor-pointer group bg-white rounded-xl shadow-md transition-all overflow-hidden border ${isNew ? 'border-amber-400 ring-2 ring-amber-50' : 'border-gray-100'} flex flex-col">
        
        ${isNew ? '<div class="absolute top-2 right-2 z-10 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">NOVO</div>' : ''}
        
        <div class="aspect-[3/4] bg-gray-100 flex items-center justify-center">
          <canvas id="${canvasId}" class="pdf-thumb-canvas"></canvas>
        </div>
        
        <div class="p-3 bg-white border-t">
          <p class="text-[10px] font-bold ${isNew ? 'text-amber-600' : 'text-gray-400'} uppercase">
            ${isNew ? 'Destaque' : 'Encarte Anterior'}
          </p>
          <p class="text-xs font-bold text-slate-700 truncate">${pdf.name.replace('.pdf','')}</p>
        </div>
      </div>`;
  }).join("");
}

// Ativando a busca para a aba de Encartes
document.getElementById('encarteSearch')?.addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  
  // Filtra sobre o array global que já está ordenado por data
  const filtered = allEncartes.filter(pdf => 
    pdf.name.toLowerCase().includes(term)
  );

  // Renderiza os resultados (o primeiro resultado do filtro será o novo "Destaque")
  renderEncartes(filtered);
});

  //async function loadFiles(path) {
   //try {
    //const res = await fetch(`https://api.github.com/repos/${USER}/${REPO}/contents/${path}`);
    //allFiles = await res.json();
    //renderFileList(allFiles, path);
   /// if(path === "Manuais") loadedTabs.treinamento = true;
   ///} catch (e) { console.error(e); }
  ///}
      async function loadFiles(path) {
          const pastasContainer = document.getElementById("section-pastas");
          const videosContainer = document.getElementById("section-videos");
          const arquivosContainer = document.getElementById("section-arquivos");
          const breadcrumb = document.getElementById("breadcrumb");
      
          // Feedback visual de carregamento
          pastasContainer.innerHTML = '<p class="col-span-full text-gray-400 animate-pulse">Carregando...</p>';
          
          try {
              const res = await fetch(`https://api.github.com/repos/${USER}/${REPO}/contents/${path}`);
              allFiles = await res.json();
              
              // Atualiza Breadcrumb
              breadcrumb.innerHTML = path.split('/').map((p, i, arr) => {
                  const fullPath = arr.slice(0, i + 1).join('/');
                  return `<span class="cursor-pointer hover:underline" onclick="loadFiles('${fullPath}')">${p}</span>`;
              }).join(' <i class="fas fa-chevron-right text-[8px] mx-1 text-gray-300"></i> ');
      
              renderExplorer(allFiles, path);
          } catch (e) {
              console.error(e);
              pastasContainer.innerHTML = "Erro ao carregar arquivos.";
          }
      }

   ////organizacao dos arquivos

   function renderExplorer(files, currentPath) {
    const secPastas = document.getElementById("section-pastas");
    const secVideos = document.getElementById("section-videos");
    const secArquivos = document.getElementById("section-arquivos");
    
    secPastas.innerHTML = "";
    secVideos.innerHTML = "";
    secArquivos.innerHTML = "";

    // O Botão Voltar foi removido conforme solicitado, 
    // pois agora você utiliza o menu de navegação (breadcrumbs).

    files.forEach(item => {
        const nomeLimpo = item.name.replace(/\.[^/.]+$/, "");
        const urlRaw = `https://${USER}.github.io/${REPO}/${item.path}`;

        // 1. TRATAMENTO DE PASTAS
        if (item.type === 'dir') {
            secPastas.innerHTML += `
                <div onclick="loadFiles('${item.path}')" class="flex flex-col items-center gap-2 group cursor-pointer text-center">
                    <div class="w-full aspect-square bg-amber-50 rounded-xl flex items-center justify-center border-2 border-transparent group-hover:border-amber-400 transition shadow-sm">
                        <i class="fas fa-folder text-amber-400 text-4xl"></i>
                    </div>
                    <p class="text-[11px] font-bold text-slate-700 leading-tight">${item.name}</p>
                </div>`;
        } 
        // 2. TRATAMENTO DE VÍDEOS
        else if (item.name.toLowerCase().match(/\.(mp4|webm|mov)$/)) {
            const id = `thumb-video-${Math.random().toString(36).substr(2, 9)}`;
            secVideos.innerHTML += `
                <div onclick="window.open('${urlRaw}', '_blank')" class="flex flex-col gap-2 group cursor-pointer">
                    <div class="aspect-video bg-black rounded-xl overflow-hidden relative border-2 border-transparent group-hover:border-blue-500 transition shadow-md">
                        <video id="${id}" src="${urlRaw}#t=1" class="w-full h-full object-cover opacity-80" muted preload="metadata"></video>
                        <div class="absolute inset-0 flex items-center justify-center text-white text-3xl opacity-30 group-hover:opacity-100 transition">
                            <i class="fas fa-play-circle"></i>
                        </div>
                    </div>
                    <p class="text-xs font-medium text-gray-700 text-center truncate px-2">${nomeLimpo}</p>
                </div>`;
        } 
        // 3. TRATAMENTO DE ARQUIVOS HTML (MINIATURA VIA IFRAME)
        else if (item.name.toLowerCase().endsWith('.html')) {
            secArquivos.innerHTML += `
                <div onclick="window.open('${urlRaw}', '_blank')" class="flex flex-col gap-2 group cursor-pointer">
                    <div class="aspect-[3/4] bg-white rounded-xl overflow-hidden border border-gray-200 group-hover:border-emerald-400 transition shadow-sm flex items-center justify-center relative">
                        <iframe src="${urlRaw}" class="pointer-events-none absolute" style="width: 100%; height: 100%;   transform-origin: top left; border: none; overflow: hidden;"></iframe> 
                    </div>
                    <p class="text-xs font-medium text-gray-700 text-center truncate px-2">${nomeLimpo}</p>
                </div>`;
        }
        // 4. TRATAMENTO DE OUTROS ARQUIVOS (PDF E GERAIS)   transform: scale(0.9);
        else {
            const canvasId = `thumb-pdf-${Math.random().toString(36).substr(2, 9)}`;
            secArquivos.innerHTML += `
                <div onclick="window.open('${urlRaw}', '_blank')" class="flex flex-col gap-2 group cursor-pointer">
                    <div class="aspect-[3/4] bg-white rounded-xl overflow-hidden border border-gray-200 group-hover:border-red-400 transition shadow-sm flex items-center justify-center">
                        <canvas id="${canvasId}" class="w-full h-full object-cover"></canvas>
                    </div>
                    <p class="text-xs font-medium text-gray-700 text-center truncate px-2">${nomeLimpo}</p>
                </div>`;
            
            if (item.name.toLowerCase().endsWith('.pdf')) {
                setTimeout(() => generatePdfThumb(urlRaw, canvasId), 200);
            }
        }
    });

    // Mostrar ou esconder seções se estiverem vazias
    document.getElementById("wrapper-videos").classList.toggle("hidden", secVideos.innerHTML === "");
    document.getElementById("wrapper-arquivos").classList.toggle("hidden", secArquivos.innerHTML === "");
}

// funcao pdf para Tab RH - Down

async function loadRHData() {
  if (loadedTabs.rh) return;
  const container = document.getElementById("grid-rh-pdfs");
  
  // Lista dos seus arquivos PDF na pasta RH
  const arquivosRH = [
    { nome: "código de Vestimenta", path: "rh/CÓDIGO DE VESTIMENTA - RH_2-2025.pdf" },
    { nome: "Benefícios", path: "RH/beneficios.pdf" },
    { nome: "Cargos e Salários", path: "RH/cargos.pdf" },
    { nome: "Calendário 2024", path: "RH/calendario.pdf" },
    { nome: "Segurança do Trabalho", path: "RH/seguranca.pdf" },
    { nome: "Checklist Onboarding", path: "RH/checklist.pdf" },
    { nome: "Teste", path: "RH/teste.pdf" }
  ];

  container.innerHTML = arquivosRH.map((doc, index) => {
    const canvasId = `rh-pdf-canvas-${index}`;
    const urlRaw = `https://${USER}.github.io/${REPO}/${doc.path}`;
    
    // Chama a SUA função existente generatePdfThumb
    setTimeout(() => generatePdfThumb(urlRaw, canvasId), 500);

    return `
      <div onclick="window.open('${urlRaw}', '_blank')" class="group cursor-pointer bg-white p-4 rounded-xl shadow-md hover:shadow-2xl transition-all border border-transparent hover:border-blue-500">
        <div class="aspect-[1/1.41] bg-gray-100 rounded-lg overflow-hidden mb-4 shadow-inner">
          <canvas id="${canvasId}" class="w-full h-full object-cover"></canvas>
        </div>
        <h4 class="font-bold text-slate-700 truncate text-sm uppercase">${doc.nome}</h4>
        <p class="text-[10px] text-blue-500 font-bold mt-1">CLIQUE PARA ABRIR</p>
      </div>`;
  }).join("");

  loadedTabs.rh = true;
}



  
// funcao pdf para Tab RH - UP
function switchTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach(el => el.classList.remove("active"));
  document.getElementById("tab-" + tabId).classList.add("active");
  document.getElementById("btn-" + tabId).classList.add("active");

  if (tabId === "home") loadHomeData();
  if (tabId === "treinamento") loadFiles("Manuais");
  if (tabId === "encartes") loadEncartes("Encartes");
  if (tabId === "rh") loadRHData(); 
  if (tabId === "contatos") { loadContatosData(); 
                              loadSetoresData();
                            }
  if (tabId === "catalogo" && !loadedTabs.catalogo) {
    document.getElementById('catalogo-wrapper').innerHTML = `<iframe src="https://catalogo.sonoshowmoveis.com.br/" class="w-full h-full border-none"></iframe>`;
    loadedTabs.catalogo = true;
  }
}


  function moveSlide(direction) {
   const slides = document.getElementById("carousel-slides");
   if (totalSlides === 0) return;
   currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
   slides.style.transform = `translateX(-${currentSlide * 100}%)`;
  }

// Adicione 'contatos: false' ao seu objeto loadedTabs no topo do script
// loadedTabs = { home: false, treinamento: false, encartes: false, catalogo: false, contatos: false };

/*async function loadContatosData() {
    if (loadedTabs.contatos) return;
    const container = document.getElementById("container-equipe");

    try {
        // Certifique-se que o arquivo equipe.json está na mesma pasta
        const response = await fetch('equipe.json');
        if (!response.ok) throw new Error('Erro ao carregar JSON');
        
        const data = await response.json();

        container.innerHTML = data.supervisores.map(sup => `
            <div class="space-y-8">
                <div class="text-center">
                    <div class="relative inline-block">
                     
                    <img src="${sup.foto}"   onclick="openImageModal('${sup.foto}')"
                         class="w-32 h-32 aspect-square rounded-full border-4 border-blue-600 object-cover object-center shadow-xl mx-auto mb-4 cursor-pointer hover:scale-105 transition-transform"
                         onerror="this.src='https://ui-avatars.com/api/?name=${sup.nome}&background=0D8ABC&color=fff'">
                        <div class="absolute bottom-4 right-0 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-white">
                            <i class="fas fa-star text-[10px]"></i>
                        </div>
                    </div>
                    <h3 class="text-xl font-bold text-slate-800 uppercase leading-tight">${sup.nome}</h3>
                    <p class="text-blue-600 font-bold text-[10px] mb-2 tracking-widest"> ${sup.id === 1 ? ' SUPERVISOR GERAL' : ' SUPERVISOR REGIONAL' }</p>
                    <p class="text-sm text-slate-500 font-mono italic">
                        <i class="fab fa-whatsapp mr-1 text-green-500"></i> ${sup.contato}
                    </p>
                </div>

                <div class="space-y-4">
                    <h4 class="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase border-b pb-2">Filiais Sob Gestão</h4>
                    ${sup.lojas.map(loja => `
                        <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex items-center gap-4">
                            
                          <img src="${loja.fotoGerente}"  onclick="openImageModal('${loja.fotoGerente}')"
                               class="w-14 h-14 aspect-square rounded-full border-2 border-slate-200 object-cover object-center bg-gray-50 cursor-pointer hover:opacity-80 transition-opacity"
                               onerror="this.src='https://ui-avatars.com/api/?name=${loja.gerente}&background=f1f5f9&color=64748b'">
                            <div class="flex-1 min-w-0">
                                <h5 class="font-bold text-slate-800 text-sm truncate uppercase">${loja.nome}</h5>
                                <p class="text-[10px] text-slate-500 truncate mb-1">${loja.endereco}</p>
                                <div class="flex justify-between items-end">
                                    <div>
                                        <p class="text-[9px] text-blue-600 font-bold uppercase">Gerente: <span class="text-slate-700">${loja.gerente}</span></p>
                                        <p class="text-[10px] font-mono text-slate-400 italic">${loja.telefone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        loadedTabs.contatos = true;
    } catch (e) {
        console.error("Erro:", e);
        container.innerHTML = "<p class='col-span-full text-center text-red-500 p-10'>Não foi possível carregar os dados. Verifique o arquivo equipe.json.</p>";
    }
}*/

async function loadContatosData() {
    if (loadedTabs.contatos) return;
    const container = document.getElementById("container-equipe");

    try {
        const response = await fetch('equipe.json');
        if (!response.ok) throw new Error('Erro ao carregar JSON');
        const data = await response.json();

        // Container principal como Grid de 2 colunas
        container.className = "grid grid-cols-1 md:grid-cols-2 gap-10";

        container.innerHTML = data.supervisores.map(sup => {
            const isGeral = sup.id === 1;

            return `
            <div class="${isGeral ? 'col-span-full glow-master bg-blue-50/30 p-8 rounded-[2.5rem] mb-6' : 'space-y-8 p-4'}">
                
                <div class="text-center mb-10">
                    <div class="relative inline-block">
                        <img src="${sup.foto}" onclick="openImageModal('${sup.foto}')"
                             class="${isGeral ? 'w-40 h-40' : 'w-32 h-32'} aspect-square rounded-full border-4 border-blue-600 object-cover shadow-xl mx-auto mb-4 cursor-pointer hover:scale-105 transition-transform"
                             onerror="this.src='https://ui-avatars.com/api/?name=${sup.nome}&background=0D8ABC&color=fff'">
                        
                        <div class="absolute bottom-4 right-0 ${isGeral ? 'bg-amber-500 w-12 h-12' : 'bg-blue-600 w-8 h-8'} text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                            <i class="fas ${isGeral ? 'fa-crown text-lg' : 'fa-star text-[10px]'}"></i>
                        </div>
                    </div>
                    
                    <h3 class="${isGeral ? 'text-3xl' : 'text-xl'} font-black text-slate-800 uppercase leading-tight">${sup.nome}</h3>
                    <p class="${isGeral ? 'bg-blue-600 text-white px-6 py-1 rounded-full inline-block mt-2' : 'text-blue-600'} font-bold text-[10px] mb-2 tracking-widest uppercase">
                        ${isGeral ? 'Supervisor Geral' : 'Supervisor Regional'}
                    </p>
                    <p class="text-md text-slate-500 font-mono italic mt-2">
                        <i class="fab fa-whatsapp mr-1 text-green-500"></i> ${sup.contato}
                    </p>
                </div>

                <div class="space-y-6">
                    <h4 class="text-[11px] font-black text-slate-400 tracking-[0.3em] uppercase border-b pb-2 flex items-center gap-2">
                        <i class="fas fa-map-marker-alt"></i> Filiais Sob Gestão
                    </h4>
                    
                    <div class="grid grid-cols-1 ${isGeral ? 'lg:grid-cols-2' : ''} gap-6">
                        ${sup.lojas.map(loja => `
                            <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all flex flex-col sm:flex-row items-center sm:items-start gap-5">
                                
                                <img src="${loja.fotoGerente}" onclick="openImageModal('${loja.fotoGerente}')"
                                     class="w-20 h-20 aspect-square rounded-2xl border-2 border-slate-100 object-cover bg-gray-50 cursor-pointer hover:opacity-90"
                                     onerror="this.src='https://ui-avatars.com/api/?name=${loja.gerente}&background=f1f5f9&color=64748b'">
                                
                                <div class="flex-1 min-w-0 text-center sm:text-left">
                                    <h5 class="font-black text-slate-800 text-base uppercase mb-1 leading-tight">${loja.nome}</h5>
                                    <p class="text-[11px] text-slate-400 mb-3 leading-relaxed">
                                        <i class="fas fa-location-dot mr-1"></i> ${loja.endereco}
                                    </p>
                                    
                                    <div class="bg-slate-50 rounded-2xl p-3 border border-slate-50">
                                        <p class="text-[10px] text-blue-600 font-black uppercase mb-1">
                                            Gerente: <span class="text-slate-700 font-bold">${loja.gerente}</span>
                                        </p>
                                        <p class="text-[11px] font-mono text-slate-500 flex items-center justify-center sm:justify-start gap-2">
                                            <i class="fas fa-phone-alt text-[9px]"></i> ${loja.telefone}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            `;
        }).join('');

        loadedTabs.contatos = true;
    } catch (e) {
        console.error("Erro:", e);
        container.innerHTML = "<p class='col-span-full text-center text-red-500 p-10'>Não foi possível carregar os dados.</p>";
    }
}

function openImageModal(src) {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    
    modalImg.src = src;
    modal.classList.remove('hidden');
    // Impede o scroll do fundo ao abrir o modal
    document.body.style.overflow = 'hidden';
}

function closeImageModal() {
    const modal = document.getElementById('image-modal');
    modal.classList.add('hidden');
    // Devolve o scroll ao fechar
    document.body.style.overflow = 'auto';
}

async function loadSetoresData() {
    const container = document.getElementById("lista-setores");
    const searchInput = document.getElementById("search-setores");
    
    try {
        const response = await fetch('setores.json');
        if (!response.ok) throw new Error('Erro ao carregar setores');
        const data = await response.json();
        setoresDataGlobal = data.Departamento;

        // Função interna para renderizar
        const renderSetores = (filtro = "") => {
            const termo = filtro.toLowerCase();
            
            const html = setoresDataGlobal.map(depto => {
                // Filtra a equipe dentro do departamento
                const equipeFiltrada = depto.Equipe.filter(membro => 
                    depto.nomedepartamento.toLowerCase().includes(termo) ||
                    membro.nome.toLowerCase().includes(termo) ||
                    membro.Cargo.toLowerCase().includes(termo)
                );

                if (equipeFiltrada.length === 0) return "";

                return `
                <div class="depto-group mb-6">
                    <h4 class="text-blue-600 font-black text-[11px] tracking-widest uppercase mb-4 flex items-center gap-2">
                        <span class="w-2 h-2 bg-blue-600 rounded-full"></span>
                        ${depto.nomedepartamento}
                    </h4>
                    <div class="space-y-4 pl-4 border-l-2 border-slate-100 ml-1">
                        ${equipeFiltrada.map(membro => `
                            <div class="group">
                                <p class="text-slate-800 font-bold text-sm uppercase leading-tight group-hover:text-blue-600 transition-colors">
                                    ${membro.nome}
                                </p>
                                <p class="text-slate-500 text-[10px] uppercase font-semibold mb-1 tracking-tight">
                                    ${membro.Cargo}
                                </p>
                                <a href="https://wa.me/55${membro.contato.replace(/\D/g,'')}" target="_blank" 
                                   class="text-blue-600 font-mono text-[11px] hover:underline flex items-center gap-1.5 mt-1">
                                    <i class="fab fa-whatsapp text-green-500 text-sm"></i> 
                                    <strong>${membro.contato}</strong>
                                </a>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
            }).join('<hr class="my-4 border-slate-50">');

            container.innerHTML = html || "<p class='text-center text-slate-400 text-xs py-10'>Nenhum contato encontrado.</p>";
        };

        // Renderização inicial
        renderSetores();

        // Listener para a busca
        searchInput.addEventListener("input", (e) => renderSetores(e.target.value));

    } catch (e) {
        console.error("Erro ao carregar setores:", e);
        container.innerHTML = "<p class='text-red-500 text-xs'>Erro ao carregar departamentos.</p>";
    }
}

// Opcional: Fechar ao clicar fora da imagem
document.getElementById('image-modal').addEventListener('click', function(e) {
    if (e.target === this) closeImageModal();
});

// --- INICIALIZAÇÃO E EVENTOS ---

window.onload = () => {
  // Auto-slide do banner (O código duplicado foi removido daqui)
  setInterval(() => {
    const homeTab = document.getElementById('tab-home');
    if(homeTab && homeTab.classList.contains('active')) moveSlide(1);
  }, 10000);
};

// Lógica de Busca de Manuais
document.getElementById('fileSearch')?.addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = allFiles.filter(file =>
    file.name.toLowerCase().includes(term)
  );
  // Nota: Verifique se sua função é renderExplorer ou renderFileList
  renderExplorer(filtered, "Manuais"); 
});

// Executa assim que o navegador carrega o DOM
document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.getElementById('login-overlay');
    
    if (checkSession()) {
        if (overlay) {
            overlay.classList.add("hidden");
            overlay.style.display = "none";
        }
        loadHomeData(); 
        
        // Pequeno atraso para garantir que a biblioteca XLSX carregou
        setTimeout(() => {
            if (typeof XLSX !== 'undefined') {
                carregarAniversariantes();
            } else {
                console.error("Biblioteca XLSX não carregada!");
            }
        }, 500);
        
    } else {
        if (overlay) {
            overlay.classList.remove("hidden");
            overlay.style.display = "flex"; 
        }
    }
});

// Listener de Enter para o Login
document.addEventListener('keypress', (e) => {
    const overlay = document.getElementById('login-overlay');
    if(e.key === 'Enter' && overlay && !overlay.classList.contains('hidden')) {
        checkLogin();
    }
});
