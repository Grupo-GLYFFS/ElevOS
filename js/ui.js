/* ==========================================================================
   ElevOS — helpers de renderizacao compartilhados entre as paginas
   ========================================================================== */

/* ------------------------------------------------------------------ util */
const $ = (sel, raiz) => (raiz || document).querySelector(sel);
const $$ = (sel, raiz) => Array.from((raiz || document).querySelectorAll(sel));

const param = (nome) => new URLSearchParams(window.location.search).get(nome);

/** Escapa texto vindo do usuario antes de injetar em innerHTML. */
function esc(valor) {
  return String(valor === null || valor === undefined ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ------------------------------------------------------------------ marca */
function logoElevos(tamanho) {
  const t = tamanho || 34;
  return `<svg width="${t}" height="${t}" viewBox="0 0 40 40" role="img" aria-label="ElevOS" style="flex:0 0 ${t}px">
    <rect width="40" height="40" rx="11" fill="#00D4FF"/>
    <path d="M11 23.5 L20 14.5 L29 23.5" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M11 30 L20 21 L29 30" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
  </svg>`;
}

const LINKS_NAV = [
  { href: "ocorrencias.html", rotulo: "Fila", chave: "ocorrencias" },
  { href: "dashboard.html", rotulo: "Dashboard", chave: "dashboard" },
  { href: "sos.html?codigo=ELV-D-1818", rotulo: "QR SOS", chave: "sos" },
];

/** Navbar comum das telas internas. `ativo` = chave do item destacado. */
function montarNavbar(ativo) {
  const itens = LINKS_NAV.map(
    (l) => `<li class="nav-item"><a class="nav-link ${l.chave === ativo ? "ativo" : ""}" href="${l.href}">${l.rotulo}</a></li>`
  ).join("");

  return `<nav class="navbar navbar-expand-lg navbar-elevos sticky-top">
    <div class="container-xl">
      <a class="marca-elevos d-flex align-items-center gap-2" href="index.html">
        ${logoElevos(30)}<span>Elev<span class="marca-os">OS</span></span>
      </a>
      <button class="navbar-toggler border-0 ms-auto" type="button" data-bs-toggle="collapse" data-bs-target="#navElevos" aria-label="Menu">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navElevos">
        <ul class="navbar-nav ms-auto align-items-lg-center gap-1">${itens}</ul>
      </div>
    </div>
  </nav>`;
}

/** Injeta a navbar no elemento com id="navbar" e avisa se o storage falhou. */
function renderizarCasca(ativo) {
  const alvo = document.getElementById("navbar");
  if (alvo) alvo.innerHTML = montarNavbar(ativo);
  if (Store.emMemoria()) {
    const aviso = document.createElement("div");
    aviso.className = "aviso-armazenamento text-center small py-2 px-3";
    aviso.textContent =
      "O navegador bloqueou o armazenamento local: os dados nao vao persistir entre as telas. Abra a demo por um servidor local ou pelo link do Vercel.";
    document.body.prepend(aviso);
  }
}

/* ---------------------------------------------------------------- badges */
const badgePrioridade = (p) => {
  const info = PRIORIDADES[p] || PRIORIDADES.P4;
  return `<span class="badge-prio ${info.classe}">${info.rotulo}</span>`;
};

const badgeStatus = (s) => `<span class="badge-status ${s}">${STATUS[s] || s}</span>`;

const rotuloTipo = (t) => (TIPOS[t] || TIPOS.outro).rotuloOperacao;
const rotuloOrigem = (o) => ORIGENS[o] || o;

/* ------------------------------------------------------------------ icones */
function iconeTipo(tipo) {
  const traco = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  const corpo = {
    preso: `<circle cx="12" cy="6" r="2.6" ${traco}/><path d="M8.5 20v-4.5M15.5 20v-4.5M8.5 15.5h7M9 15.5l1-4.5h4l1 4.5" ${traco}/>`,
    parado: `<rect x="8" y="6" width="3" height="12" rx="1" ${traco}/><rect x="13" y="6" width="3" height="12" rx="1" ${traco}/>`,
    porta: `<rect x="4" y="4" width="16" height="16" rx="2" ${traco}/><path d="M12 4v16M9 12h.01M15 12h.01" ${traco}/>`,
    ruido: `<path d="M5 10v4M9 7v10M13 9.5v5M17 5.5v13M21 10v4" ${traco}/>`,
    outro: `<circle cx="12" cy="12" r="8.5" ${traco}/><path d="M9.7 9.5a2.4 2.4 0 1 1 3 2.3v1.4M12 16.5h.01" ${traco}/>`,
  };
  return `<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">${corpo[tipo] || corpo.outro}</svg>`;
}

/* ------------------------------------------------------------------ datas */
const fmtDataHora = (iso) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const fmtData = (iso) => new Date(iso).toLocaleDateString("pt-BR");

const fmtHora = (iso) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** "ha 3 min", "ha 2 h", "ha 4 d" */
function tempoRelativo(iso) {
  const min = (Date.now() - new Date(iso).getTime()) / 60000;
  if (min < 1) return "agora";
  if (min < 60) return `ha ${Math.floor(min)} min`;
  if (min < 1440) return `ha ${Math.floor(min / 60)} h`;
  return `ha ${Math.floor(min / 1440)} d`;
}

/** Ordena a fila: prioridade primeiro, depois quem espera ha mais tempo. */
const ordenarFila = (lista) =>
  [...lista].sort((a, b) => {
    const dp = ORDEM_PRIORIDADE[a.prioridade] - ORDEM_PRIORIDADE[b.prioridade];
    return dp !== 0 ? dp : new Date(a.criadoEm) - new Date(b.criadoEm);
  });

const emAberto = (o) => o.status !== "resolvida";

/* ------------------------------------------------------- link do tecnico */
/** URL absoluta de tecnico.html?id=N (funciona em file://, localhost e Vercel). */
const linkTecnico = (id) => new URL(`tecnico.html?id=${id}`, window.location.href).href;
