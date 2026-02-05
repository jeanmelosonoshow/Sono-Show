
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
  if (window.self !== window.top) { document.documentElement.classList.add('is-iframe'); }
 

  const USER = "jeanmelosonoshow";
  const REPO = "Sono-Show";
  let currentSlide = 0, totalSlides = 0, allFiles = [];
  const loadedTabs = { home: false, treinamento: false, encartes: false, catalogo: false };

   // --- LÓGICA DE LOGIN E SESSÃO ---
const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 horas em milissegundos

async function checkLogin() {
  const usuario = document.getElementById('user-input').value;
  const senha = document.getElementById('pass-input').value;
  const errorMsg = document.getElementById('login-error');
  const btn = document.getElementById('btn-entrar');

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
      localStorage.setItem('sono_login_time', now.toString()); // Salva o momento do login
     
      document.getElementById('login-overlay').style.display = 'none';
      loadHomeData();
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

  document.addEventListener('keypress', (e) => {
    if(e.key === 'Enter' && document.getElementById('login-overlay').style.display !== 'none') checkLogin();
  });

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

  async function loadHomeData() {
   if(loadedTabs.home) return;
   try {
    const response = await fetch(`https://raw.githubusercontent.com/${USER}/${REPO}/main/comunicados.json?t=${Date.now()}`);
    const data = await response.json();
    const carousel = document.getElementById("carousel-slides");
    if (data.banners) {
     totalSlides = data.banners.length;
     carousel.innerHTML = data.banners.map(img => `<div class="min-w-full h-full flex items-center justify-center bg-slate-900"><img src="${img}" class="max-w-full max-h-full object-contain"></div>`).join("");
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
  }

   async function loadEncartes(path) {
 if(loadedTabs.encartes) return;
 const container = document.getElementById("grid-encartes");
 container.innerHTML = '<p class="col-span-full text-center p-10 text-slate-400 animate-pulse">Carregando encartes...</p>';
 try {
  const res = await fetch(`https://api.github.com/repos/${USER}/${REPO}/contents/${path}`);
  const data = await res.json();
  let pdfs = data.filter(i => i.name.toLowerCase().endsWith(".pdf"));
  pdfs.sort((a, b) => {
   const getParts = (name) => {
    const parts = name.replace('.pdf', '').split('-');
    return { mes: parseInt(parts[0]) || 0, ano: parseInt(parts[1]) || 0 };
   };
   const dA = getParts(a.name), dB = getParts(b.name);
   return (dB.ano !== dA.ano) ? dB.ano - dA.ano : dB.mes - dA.mes;
  });
  container.innerHTML = pdfs.map((pdf, index) => {
  const canvasId = `pdf-canvas-${index}`;
  const isNew = index === 0;
  setTimeout(() => generatePdfThumb(`https://${USER}.github.io/${REPO}/${pdf.path}`, canvasId), 400);
  return `<div onclick="window.open('https://${USER}.github.io/${REPO}/${pdf.path}', '_blank')" class="relative cursor-pointer group bg-white rounded-xl shadow-md transition-all overflow-hidden border ${isNew ? 'border-amber-400 ring-2 ring-amber-50' : 'border-gray-100'} flex flex-col">
   ${isNew ? '<div class="absolute top-2 right-2 z-10 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">NOVO</div>' : ''}
   <div class="aspect-[3/4] bg-gray-100 flex items-center justify-center"><canvas id="${canvasId}" class="pdf-thumb-canvas"></canvas></div>
   <div class="p-3 bg-white border-t">
   <p class="text-[10px] font-bold ${isNew ? 'text-amber-600' : 'text-gray-400'} uppercase">${isNew ? 'Destaque' : 'Encarte Anterior'}</p>
   <p class="text-xs font-bold text-slate-700 truncate">${pdf.name.replace('.pdf','')}</p>
   </div>
  </div>`;
  }).join("");
  loadedTabs.encartes = true;
 } catch (e) { container.innerHTML = "Erro ao carregar encartes."; }
 }

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



  function renderFileList(files, currentPath) {
   const container = document.getElementById("explorer-content");
   let backBtn = currentPath !== "Manuais" ? `
    <div class="p-4 bg-blue-50 text-blue-600 font-bold cursor-pointer border-b flex items-center gap-2 hover:bg-blue-100 transition-colors" onclick="loadFiles('Manuais')">
     <i class="fas fa-arrow-left"></i> Voltar para Manuais
    </div>` : "";
  
   container.innerHTML = backBtn + files.map(item => `
    <div class="flex items-center justify-between py-4 px-6 hover:bg-slate-50 cursor-pointer border-b border-gray-50" onclick="${item.type==='dir' ? `loadFiles('${item.path}')` : `window.open('https://${USER}.github.io/${REPO}/${item.path}','_blank')`}">
     <div class="flex items-center gap-4"><i class="fas ${item.type==='dir'?'fa-folder text-yellow-500':'fa-file-pdf text-red-500'} text-xl"></i><span class="font-medium text-slate-700">${item.name}</span></div>
     <i class="fas fa-chevron-right text-slate-200 text-xs"></i>
    </div>`).join("");
  }

 ////ajuste de exibicao do arquivo
function renderExplorer(files, currentPath) {
    const secPastas = document.getElementById("section-pastas");
    const secVideos = document.getElementById("section-videos");
    const secArquivos = document.getElementById("section-arquivos");
    
    secPastas.innerHTML = "";
    secVideos.innerHTML = "";
    secArquivos.innerHTML = "";

    // Botão Voltar
    if (currentPath !== "Manuais") {
        const pai = currentPath.substring(0, currentPath.lastIndexOf('/')) || "Manuais";
        secPastas.innerHTML = `
            <div onclick="loadFiles('${pai}')" class="flex flex-col items-center gap-2 group cursor-pointer">
                <div class="w-full aspect-square bg-blue-50 rounded-xl flex items-center justify-center border-2 border-dashed border-blue-200 group-hover:bg-blue-100 transition">
                    <i class="fas fa-level-up-alt text-blue-400 text-2xl"></i>
                </div>
                <p class="text-xs font-bold text-blue-600 uppercase">Voltar</p>
            </div>`;
    }

    files.forEach(item => {
        const nomeLimpo = item.name.replace(/\.[^/.]+$/, "");
        const urlRaw = `https://${USER}.github.io/${REPO}/${item.path}`;

        if (item.type === 'dir') {
            secPastas.innerHTML += `
                <div onclick="loadFiles('${item.path}')" class="flex flex-col items-center gap-2 group cursor-pointer text-center">
                    <div class="w-full aspect-square bg-amber-50 rounded-xl flex items-center justify-center border-2 border-transparent group-hover:border-amber-400 transition shadow-sm">
                        <i class="fas fa-folder text-amber-400 text-4xl"></i>
                    </div>
                    <p class="text-[11px] font-bold text-slate-700 leading-tight">${item.name}</p>
                </div>`;
        } 
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

  function switchTab(tabId) {
   document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
   document.querySelectorAll(".nav-link").forEach(el => el.classList.remove("active"));
   document.getElementById("tab-" + tabId).classList.add("active");
   document.getElementById("btn-" + tabId).classList.add("active");

   if (tabId === "home") loadHomeData();
   if (tabId === "treinamento") loadFiles("Manuais");
   if (tabId === "encartes") loadEncartes("Encartes");
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

  window.onload = () => {
  // Verifica se a sessão é válida ao carregar/F5
  if (checkSession()) {
    document.getElementById('login-overlay').style.display = 'none';
    loadHomeData();
  } else {
    document.getElementById('login-overlay').style.display = 'flex';
  }
 
  // Auto-slide do banner
  setInterval(() => {
    if(document.getElementById('tab-home').classList.contains('active')) moveSlide(1);
  }, 6000);
}

// Lógica de Busca de Manuais
document.getElementById('fileSearch')?.addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = allFiles.filter(file =>
    file.name.toLowerCase().includes(term)
  );
  // Re-renderiza a lista apenas com os arquivos filtrados
  renderFileList(filtered, "Manuais");
});
