/* ==========================================================================
   ElevOS — persistencia da demo
   O "banco de dados" e o localStorage do navegador. Na primeira carga grava
   o seed; toda acao (abrir chamado, despachar, resolver) escreve de volta.
   E o que faz o chamado aberto no sos.html aparecer de verdade na fila.
   ========================================================================== */

const STORE_CHAVE = "elevos.db.v1";

const Store = (() => {
  let memoria = null; // usado se o localStorage nao estiver disponivel
  let usandoMemoria = false;

  function ler() {
    try {
      const cru = window.localStorage.getItem(STORE_CHAVE);
      return cru ? JSON.parse(cru) : null;
    } catch (e) {
      usandoMemoria = true;
      return memoria;
    }
  }

  function escrever(db) {
    memoria = db;
    try {
      window.localStorage.setItem(STORE_CHAVE, JSON.stringify(db));
    } catch (e) {
      usandoMemoria = true;
    }
    return db;
  }

  /** Garante que existe base. Chame no inicio de toda pagina. */
  function init() {
    let db = ler();
    if (!db || !db.ocorrencias || !db.ocorrencias.length) {
      db = escrever(construirSeed());
    } else {
      memoria = db;
    }
    return db;
  }

  const db = () => memoria || ler() || init();

  const elevadores = () => db().elevadores;
  const tecnicos = () => db().tecnicos;
  const ocorrencias = () => db().ocorrencias;

  const elevador = (id) => elevadores().find((e) => e.id === Number(id)) || null;
  const elevadorPorCodigo = (codigo) =>
    elevadores().find((e) => e.codigo.toUpperCase() === String(codigo || "").toUpperCase()) || null;
  const tecnico = (id) => tecnicos().find((t) => t.id === Number(id)) || null;
  const ocorrencia = (id) => ocorrencias().find((o) => o.id === Number(id)) || null;

  /** Ocorrencias de um elevador, da mais recente para a mais antiga. */
  const historicoDoElevador = (elevadorId, exceto) =>
    ocorrencias()
      .filter((o) => o.elevadorId === Number(elevadorId) && o.id !== Number(exceto))
      .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

  const predios = () => [...new Set(elevadores().map((e) => e.predio))].sort();

  /* ------------------------------------------------------------- escritas */

  /** Abre uma ocorrencia. A prioridade e derivada pela REGRA 1, nunca informada. */
  function criarOcorrencia(dados) {
    const base = db();
    const regra = classificarUrgencia(dados);
    const nova = {
      id: base.proximoId + 1,
      elevadorId: Number(dados.elevadorId),
      tipo: dados.tipo,
      origem: dados.origem || "qr",
      descricao: dados.descricao || "",
      pessoasPresas: Number(dados.pessoasPresas || 0),
      telefoneContato: dados.telefoneContato || null,
      prioridade: regra.prioridade,
      motivoPrioridade: regra.motivo,
      slaMinutos: regra.slaMinutos,
      status: "aberta",
      tecnicoId: null,
      criadoEm: new Date().toISOString(),
      despachadoEm: null,
      chegadaEm: null,
      resolvidoEm: null,
      laudo: null,
    };
    base.proximoId = nova.id;
    base.ocorrencias.push(nova);
    escrever(base);
    return nova;
  }

  /** Aplica uma alteracao em uma ocorrencia e persiste. */
  function atualizar(id, mudancas) {
    const base = db();
    const alvo = base.ocorrencias.find((o) => o.id === Number(id));
    if (!alvo) return null;
    Object.assign(alvo, mudancas);
    escrever(base);
    return alvo;
  }

  const despachar = (id, tecnicoId) =>
    atualizar(id, { tecnicoId: Number(tecnicoId), status: "despachada", despachadoEm: new Date().toISOString() });

  const registrarChegada = (id) =>
    atualizar(id, { status: "em_atendimento", chegadaEm: new Date().toISOString() });

  const resolver = (id, laudo) =>
    atualizar(id, { status: "resolvida", resolvidoEm: new Date().toISOString(), laudo: laudo || "Atendimento concluido." });

  function resetar() {
    try {
      window.localStorage.removeItem(STORE_CHAVE);
    } catch (e) {
      /* segue com memoria */
    }
    memoria = null;
    return init();
  }

  const emMemoria = () => usandoMemoria;

  return {
    init, db, resetar, emMemoria,
    elevadores, tecnicos, ocorrencias, predios,
    elevador, elevadorPorCodigo, tecnico, ocorrencia, historicoDoElevador,
    criarOcorrencia, atualizar, despachar, registrarChegada, resolver,
  };
})();
