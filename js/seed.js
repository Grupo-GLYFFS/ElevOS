/* ==========================================================================
   ElevOS — dados iniciais da demo (tudo ficticio)

   As datas sao geradas RELATIVAS ao momento em que o seed e criado, para que
   a demo pareca sempre "de agora". Por isso: aperte "Resetar demo" no
   index.html pouco antes de apresentar.

   Calibragem alvo do dashboard: resposta media ~4 min, SLA ~97%,
   3 equipamentos criticos (ELV-C-3303, ELV-A-1104, ELV-E-4402).
   ========================================================================== */

const SEED_DIA_MS = 24 * 60 * 60 * 1000;
const SEED_MIN_MS = 60 * 1000;

function construirSeed() {
  const agora = Date.now();
  const diasAtras = (d) => new Date(agora - d * SEED_DIA_MS).toISOString();
  const minutosAtras = (m) => agora - m * SEED_MIN_MS;

  /** timestamp de "d dias atras, no horario `hora`" (hora decimal: 9.5 = 09:30) */
  const emDia = (d, hora) => {
    const data = new Date(agora - d * SEED_DIA_MS);
    data.setHours(Math.floor(hora), Math.round((hora % 1) * 60), 0, 0);
    return data.getTime();
  };

  /* ---------------------------------------------------------------- predios */
  const P = {
    plaza: { predio: "Ed. Plaza Berrini", endereco: "Av. Eng. Luis Carlos Berrini, 1500 - Brooklin, Sao Paulo/SP" },
    norte: { predio: "Ed. Norte Corporate", endereco: "R. Verbo Divino, 340 - Chacara Santo Antonio, Sao Paulo/SP" },
    paulista: { predio: "Ed. Comercial Paulista", endereco: "Av. Paulista, 2200 - Bela Vista, Sao Paulo/SP" },
    vistaverde: { predio: "Residencial Vista Verde", endereco: "R. das Acacias, 87 - Vila Mariana, Sao Paulo/SP" },
    central: { predio: "Shopping Central Park", endereco: "Av. Roque Petroni Jr., 1089 - Jardim das Acacias, Sao Paulo/SP" },
    hospital: { predio: "Hospital Sao Lucas", endereco: "R. Dr. Alceu de Campos Rodrigues, 95 - Vila Nova Conceicao, Sao Paulo/SP" },
  };

  /* ------------------------------------------------------------- elevadores */
  const defsElevadores = [
    ["ELV-A-1101", P.plaza, 22, "2016-04-18", 25],
    ["ELV-A-1102", P.plaza, 22, "2016-04-18", 35],
    ["ELV-A-1103", P.plaza, 22, "2016-04-18", 50],
    ["ELV-A-1104", P.plaza, 22, "2007-09-02", 165],
    ["ELV-B-2201", P.norte, 14, "2012-11-20", 60],
    ["ELV-B-2202", P.norte, 14, "2012-11-20", 70],
    ["ELV-B-2203", P.norte, 14, "2012-11-20", 45],
    ["ELV-C-3301", P.paulista, 18, "2015-06-30", 40],
    ["ELV-C-3302", P.paulista, 18, "2015-06-30", 55],
    ["ELV-C-3303", P.paulista, 18, "2004-02-11", 190],
    ["ELV-C-3304", P.paulista, 18, "2019-08-14", 20],
    ["ELV-D-1818", P.vistaverde, 12, "2014-03-25", 95],
    ["ELV-D-1819", P.vistaverde, 12, "2014-03-25", 80],
    ["ELV-D-1820", P.vistaverde, 12, "2014-03-25", 88],
    ["ELV-E-4401", P.central, 5, "2018-01-09", 30],
    ["ELV-E-4402", P.central, 5, "2009-05-16", 150],
    ["ELV-E-4403", P.central, 5, "2018-01-09", 26],
    ["ELV-F-5501", P.hospital, 9, "2021-02-08", 18],
    ["ELV-F-5502", P.hospital, 9, "2021-02-08", 15],
    ["ELV-F-5503", P.hospital, 9, "2022-07-19", 12],
  ];

  const elevadores = defsElevadores.map((d, i) => ({
    id: i + 1,
    codigo: d[0],
    predio: d[1].predio,
    endereco: d[1].endereco,
    andares: d[2],
    dataInstalacao: d[3],
    ultimaManutencaoPreventiva: diasAtras(d[4]),
  }));

  const idPorCodigo = {};
  elevadores.forEach((e) => (idPorCodigo[e.codigo] = e.id));

  /* --------------------------------------------------------------- tecnicos */
  const tecnicos = [
    { id: 1, nome: "Marcos Ribeiro", telefone: "(11) 98123-4567", especialidade: "Tracao e cabos", disponivel: true },
    { id: 2, nome: "Juliana Alves", telefone: "(11) 98234-5678", especialidade: "Portas e sensores", disponivel: true },
    { id: 3, nome: "Rafael Nogueira", telefone: "(11) 98345-6789", especialidade: "Comando e eletronica", disponivel: true },
    { id: 4, nome: "Camila Duarte", telefone: "(11) 98456-7890", especialidade: "Hidraulico", disponivel: true },
    { id: 5, nome: "Bruno Tavares", telefone: "(11) 98567-8901", especialidade: "Resgate e emergencia", disponivel: true },
    { id: 6, nome: "Patricia Lemos", telefone: "(11) 98678-9012", especialidade: "Manutencao preventiva", disponivel: false },
  ];

  // tecnico preferencial por tipo de ocorrencia (deterministico)
  const TEC_POR_TIPO = { preso: 5, parado: 3, porta: 2, ruido: 1, outro: 6 };
  const TEC_ALTERNATIVO = { preso: 4, parado: 1, porta: 4, ruido: 3, outro: 4 };
  const escolherTecnico = (tipo, i) => (i % 3 === 2 ? TEC_ALTERNATIVO[tipo] : TEC_POR_TIPO[tipo]);

  const LAUDOS = {
    preso: [
      "Resgate realizado pela porta de pavimento. Cabine renivelada e liberada. Testes de subida e descida OK.",
      "Passageiros retirados em seguranca. Freio de emergencia reposicionado e comando rearmado.",
    ],
    parado: [
      "Fusivel do quadro de comando substituido. Elevador religado e testado em todos os pavimentos.",
      "Contator de forca com mau contato. Peca trocada e equipamento devolvido a operacao.",
      "Falha na alimentacao apos queda de energia. Sistema rearmado e testado.",
    ],
    porta: [
      "Cortina de luz recalibrada e roldana da porta de cabine substituida. Fechamento testado 20 vezes.",
      "Regua de porta de pavimento realinhada. Sensor de reversao dentro do padrao.",
    ],
    ruido: [
      "Guias lubrificadas e polia de tracao reapertada. Ruido eliminado, medicao dentro do padrao.",
      "Rolamento do limitador de velocidade substituido. Nova medicao sem ruido anormal.",
    ],
    outro: [
      "Item verificado e regularizado durante inspecao de rotina.",
      "Iluminacao da cabine substituida. Sem impacto operacional registrado.",
    ],
  };

  /* ------------------------------------------------------------ ocorrencias
     [codigo, tipo, origem, diasAtras, hora, respostaMin, resolucaoMin, presas, descricao]
     Todas abaixo estao RESOLVIDAS. As 4 em andamento vem depois.
     ---------------------------------------------------------------------- */
  const historico = [
    // ELV-C-3303 — critico (9 ocorrencias, equipamento de 2004, preventiva ha 190 dias)
    ["ELV-C-3303", "preso", "qr", 80, 8.5, 3, 14, 2, "Duas pessoas presas entre o 7o e o 8o andar."],
    ["ELV-C-3303", "parado", "telefone", 71, 14.25, 3, 105, 0, "Elevador travado no terreo com a porta fechada."],
    ["ELV-C-3303", "porta", "portaria", 63, 10.0, 4, 300, 0, "Porta do 3o andar demora para fechar."],
    ["ELV-C-3303", "parado", "telefone", 52, 19.5, 3, 140, 0, "Elevador parou apos oscilacao na rede."],
    ["ELV-C-3303", "ruido", "portaria", 41, 11.75, 5, 600, 0, "Barulho metalico forte na subida."],
    ["ELV-C-3303", "preso", "qr", 30, 17.0, 2, 13, 1, "Estou preso, o elevador parou entre andares."],
    ["ELV-C-3303", "parado", "telefone", 19, 9.25, 3, 110, 0, "Equipamento fora de operacao desde cedo."],
    ["ELV-C-3303", "porta", "qr", 9, 15.5, 3, 260, 0, "A porta reabre sozinha varias vezes."],
    ["ELV-C-3303", "parado", "portaria", 2, 8.0, 5, 95, 0, "Elevador nao responde a chamada nos andares."],

    // ELV-A-1104 — critico (2007, preventiva ha 165 dias)
    ["ELV-A-1104", "ruido", "portaria", 77, 13.5, 4, 420, 0, "Ruido de atrito ao passar do 10o andar."],
    ["ELV-A-1104", "parado", "telefone", 66, 9.0, 5, 100, 0, "Elevador parado no 5o andar."],
    ["ELV-A-1104", "porta", "qr", 55, 18.25, 3, 210, 0, "Porta fecha e reabre sem parar."],
    ["ELV-A-1104", "preso", "qr", 44, 12.5, 2, 12, 3, "Somos tres pessoas presas na cabine."],
    ["ELV-A-1104", "parado", "telefone", 33, 16.0, 3, 115, 0, "Queda de energia no predio, elevador nao voltou."],
    ["ELV-A-1104", "ruido", "portaria", 22, 10.5, 4, 700, 0, "Estalos na descida, moradores reclamando."],
    ["ELV-A-1104", "parado", "qr", 11, 20.0, 4, 118, 0, "Elevador desligou sozinho."],

    // ELV-E-4402 — critico (2009, preventiva ha 150 dias, shopping)
    ["ELV-E-4402", "parado", "portaria", 74, 15.0, 5, 108, 0, "Elevador da praca de alimentacao parado."],
    ["ELV-E-4402", "porta", "qr", 60, 19.75, 3, 240, 0, "Porta bate ao fechar."],
    ["ELV-E-4402", "preso", "qr", 47, 16.5, 3, 15, 4, "Quatro pessoas presas, muito calor aqui dentro."],
    ["ELV-E-4402", "ruido", "portaria", 36, 12.0, 4, 900, 0, "Zumbido constante durante o movimento."],
    ["ELV-E-4402", "parado", "telefone", 25, 18.5, 6, 130, 0, "Elevador fora de operacao no horario de pico."],
    ["ELV-E-4402", "porta", "qr", 13, 14.0, 4, 300, 0, "Sensor da porta falhando."],

    // ELV-D-1818 — atencao (predio da demo do QR)
    ["ELV-D-1818", "ruido", "portaria", 58, 9.75, 3, 480, 0, "Barulho no motor durante a noite."],
    ["ELV-D-1818", "porta", "qr", 39, 17.5, 4, 200, 0, "Porta do 4o andar raspando."],
    ["ELV-D-1818", "parado", "telefone", 17, 7.5, 5, 95, 0, "Elevador parado apos queda de luz."],

    // ELV-B-2202 — atencao
    ["ELV-B-2202", "porta", "qr", 69, 11.0, 4, 220, 0, "Porta abre com atraso no terreo."],
    ["ELV-B-2202", "parado", "telefone", 45, 15.25, 5, 90, 0, "Elevador parado, sem passageiros."],
    ["ELV-B-2202", "ruido", "portaria", 28, 13.0, 6, 520, 0, "Ruido agudo na descida."],

    // demais equipamentos
    ["ELV-A-1101", "ruido", "portaria", 76, 10.25, 5, 400, 0, "Ruido leve no ultimo trecho."],
    ["ELV-A-1101", "porta", "qr", 48, 16.75, 3, 160, 0, "Porta demora a abrir."],
    ["ELV-A-1101", "parado", "telefone", 15, 8.75, 4, 85, 0, "Elevador parado no 2o andar."],

    ["ELV-C-3301", "parado", "portaria", 72, 9.5, 2, 100, 0, "Elevador nao sai do terreo."],
    ["ELV-C-3301", "ruido", "qr", 43, 14.75, 4, 380, 0, "Barulho quando passa pelo 9o andar."],
    ["ELV-C-3301", "porta", "telefone", 12, 11.5, 3, 150, 0, "Porta com folga."],

    ["ELV-E-4401", "porta", "qr", 67, 13.25, 4, 175, 0, "Porta reabrindo sozinha."],
    ["ELV-E-4401", "outro", "portaria", 38, 10.0, 5, 900, 0, "Lampada da cabine queimada."],
    ["ELV-E-4401", "parado", "telefone", 10, 19.0, 5, 92, 0, "Elevador travado no subsolo."],

    ["ELV-A-1102", "ruido", "portaria", 59, 12.25, 3, 300, 0, "Ruido intermitente."],
    ["ELV-A-1102", "porta", "qr", 21, 17.75, 3, 140, 0, "Porta fechando devagar."],

    ["ELV-A-1103", "outro", "qr", 51, 15.75, 5, 1200, 0, "Espelho da cabine trincado."],
    ["ELV-A-1103", "parado", "telefone", 18, 8.25, 4, 88, 0, "Elevador parado apos manutencao."],

    ["ELV-B-2201", "porta", "portaria", 64, 14.5, 4, 210, 0, "Porta desalinhada no 8o andar."],
    ["ELV-B-2201", "ruido", "qr", 26, 9.0, 3, 450, 0, "Chiado ao iniciar o movimento."],

    ["ELV-B-2203", "parado", "telefone", 54, 16.25, 5, 98, 0, "Elevador fora de operacao."],
    ["ELV-B-2203", "outro", "portaria", 23, 11.25, 2, 1500, 0, "Iluminacao da cabine fraca."],

    ["ELV-C-3302", "ruido", "portaria", 70, 13.75, 5, 340, 0, "Ruido de rolamento."],
    ["ELV-C-3302", "porta", "qr", 31, 18.0, 4, 165, 0, "Porta com dificuldade para abrir."],

    ["ELV-C-3304", "porta", "qr", 49, 10.75, 3, 130, 0, "Sensor de porta sujo."],
    ["ELV-C-3304", "outro", "telefone", 16, 15.0, 6, 800, 0, "Painel da cabine arranhado."],

    ["ELV-D-1819", "porta", "qr", 57, 19.25, 4, 190, 0, "Porta batendo ao fechar."],
    ["ELV-D-1819", "ruido", "portaria", 27, 12.75, 6, 410, 0, "Barulho na casa de maquinas."],

    ["ELV-D-1820", "parado", "telefone", 34, 7.75, 5, 105, 0, "Elevador parado pela manha."],
    ["ELV-E-4403", "ruido", "qr", 40, 16.0, 5, 360, 0, "Ruido leve na subida."],
    ["ELV-F-5501", "porta", "portaria", 53, 9.25, 3, 120, 0, "Porta do 3o andar lenta."],
    ["ELV-F-5502", "outro", "telefone", 29, 14.0, 4, 700, 0, "Limpeza do fosso solicitada."],
    ["ELV-F-5503", "ruido", "qr", 20, 11.0, 5, 330, 0, "Pequeno ruido ao parar."],
  ];

  /* ---- ocorrencias em andamento (o que a fila mostra ao abrir a demo) ---- */
  const emAndamento = [
    {
      codigo: "ELV-A-1104", tipo: "preso", origem: "qr", minAtras: 4, presas: 2,
      descricao: "Estamos presos entre o 12o e o 13o andar, somos duas pessoas.",
      telefoneContato: "(11) 99871-2233", status: "aberta",
    },
    {
      codigo: "ELV-E-4402", tipo: "preso", origem: "qr", minAtras: 2, presas: 1,
      descricao: "Fiquei preso na cabine, a porta nao abre.",
      telefoneContato: "(11) 99655-8890", status: "aberta",
    },
    {
      codigo: "ELV-D-1818", tipo: "parado", origem: "telefone", minAtras: 25, presas: 0,
      descricao: "Elevador social parado no terreo, sem ninguem dentro.",
      telefoneContato: "(11) 99432-1177", status: "despachada", respostaMin: 4,
    },
    {
      codigo: "ELV-B-2202", tipo: "porta", origem: "portaria", minAtras: 55, presas: 0,
      descricao: "Porta do terreo nao fecha completamente.",
      telefoneContato: "(11) 99310-4402", status: "em_atendimento", respostaMin: 5,
    },
  ];

  /* --------------------------------------------------- montagem das ocorrencias */
  const ocorrencias = [];
  let proximoId = 1000;

  historico.forEach((h, i) => {
    const [codigo, tipo, origem, dias, hora, respostaMin, resolucaoMin, presas, descricao] = h;
    const criado = emDia(dias, hora);
    const regra = classificarUrgencia({ tipo, descricao, pessoasPresas: presas });
    const laudos = LAUDOS[tipo] || LAUDOS.outro;

    ocorrencias.push({
      id: ++proximoId,
      elevadorId: idPorCodigo[codigo],
      tipo,
      origem,
      descricao,
      pessoasPresas: presas,
      telefoneContato: null,
      prioridade: regra.prioridade,
      motivoPrioridade: regra.motivo,
      slaMinutos: regra.slaMinutos,
      status: "resolvida",
      tecnicoId: escolherTecnico(tipo, i),
      criadoEm: new Date(criado).toISOString(),
      despachadoEm: new Date(criado + respostaMin * SEED_MIN_MS).toISOString(),
      chegadaEm: new Date(criado + (respostaMin + Math.round(resolucaoMin * 0.35)) * SEED_MIN_MS).toISOString(),
      resolvidoEm: new Date(criado + resolucaoMin * SEED_MIN_MS).toISOString(),
      laudo: laudos[i % laudos.length],
    });
  });

  emAndamento.forEach((o, i) => {
    const criado = minutosAtras(o.minAtras);
    const regra = classificarUrgencia({ tipo: o.tipo, descricao: o.descricao, pessoasPresas: o.presas });
    const despachou = o.status === "despachada" || o.status === "em_atendimento";

    ocorrencias.push({
      id: ++proximoId,
      elevadorId: idPorCodigo[o.codigo],
      tipo: o.tipo,
      origem: o.origem,
      descricao: o.descricao,
      pessoasPresas: o.presas,
      telefoneContato: o.telefoneContato || null,
      prioridade: regra.prioridade,
      motivoPrioridade: regra.motivo,
      slaMinutos: regra.slaMinutos,
      status: o.status,
      tecnicoId: despachou ? escolherTecnico(o.tipo, i) : null,
      criadoEm: new Date(criado).toISOString(),
      despachadoEm: despachou ? new Date(criado + o.respostaMin * SEED_MIN_MS).toISOString() : null,
      chegadaEm: o.status === "em_atendimento" ? new Date(criado + (o.respostaMin + 18) * SEED_MIN_MS).toISOString() : null,
      resolvidoEm: null,
      laudo: null,
    });
  });

  return { versao: 1, criadoEm: new Date(agora).toISOString(), elevadores, tecnicos, ocorrencias, proximoId };
}
