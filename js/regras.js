/* ==========================================================================
   ElevOS — regras de negocio
   Tres regras, todas deterministicas e auditaveis (sem IA, sem caixa-preta):
     1. classificarUrgencia  -> prioridade P1..P4 + motivo + SLA
     2. calcularRiskScore    -> 0..100 (maior = mais saudavel) + fatores
     3. montarMensagemWhats  -> texto do despacho via deep link wa.me
   ========================================================================== */

const MINUTO_MS = 60 * 1000;
const DIA_MS = 24 * 60 * MINUTO_MS;

/* --------------------------------------------------------------------------
   Tabela de prioridades
   -------------------------------------------------------------------------- */
const PRIORIDADES = {
  P1: { rotulo: "P1 Critico", curto: "P1", slaMinutos: 15, gravidade: 100, classe: "p1" },
  P2: { rotulo: "P2 Alto", curto: "P2", slaMinutos: 120, gravidade: 70, classe: "p2" },
  P3: { rotulo: "P3 Medio", curto: "P3", slaMinutos: 1440, gravidade: 40, classe: "p3" },
  P4: { rotulo: "P4 Baixo", curto: "P4", slaMinutos: 4320, gravidade: 15, classe: "p4" },
};

const ORDEM_PRIORIDADE = { P1: 0, P2: 1, P3: 2, P4: 3 };

const TIPOS = {
  preso: { rotulo: "Estou preso", rotuloOperacao: "Passageiro preso", icone: "!" },
  parado: { rotulo: "Elevador parado", rotuloOperacao: "Elevador parado", icone: "II" },
  porta: { rotulo: "Porta com problema", rotuloOperacao: "Falha na porta", icone: "[]" },
  ruido: { rotulo: "Ruido estranho", rotuloOperacao: "Ruido anormal", icone: "~" },
  outro: { rotulo: "Outro", rotuloOperacao: "Outro", icone: "?" },
};

const ORIGENS = { qr: "QR SOS na cabine", telefone: "Central telefonica", portaria: "Portaria do predio" };

const STATUS = {
  aberta: "Aberta",
  despachada: "Despachada",
  em_atendimento: "Em atendimento",
  resolvida: "Resolvida",
};

/* --------------------------------------------------------------------------
   REGRA 1 — Classificacao de urgencia
   Devolve sempre { prioridade, motivo, slaMinutos } para que a tela consiga
   mostrar POR QUE aquela prioridade foi atribuida.
   -------------------------------------------------------------------------- */
function classificarUrgencia(dados) {
  const tipo = dados.tipo || "outro";
  const texto = (dados.descricao || "").toLowerCase();
  const presas = Number(dados.pessoasPresas || 0);

  const resposta = (prioridade, motivo) => ({
    prioridade,
    motivo,
    slaMinutos: PRIORIDADES[prioridade].slaMinutos,
  });

  // P1 — risco a vida
  if (tipo === "preso" || presas > 0) {
    const quantas = presas > 0 ? `${presas} pessoa(s) presa(s)` : "pessoas presas";
    return resposta("P1", `P1 porque ha ${quantas} na cabine. Risco a integridade fisica: atendimento imediato.`);
  }
  if (tipo === "porta" && /movimento|andando|subindo|descendo|em marcha/.test(texto)) {
    return resposta("P1", "P1 porque a porta abriu com o elevador em movimento. Falha de intertravamento e risco de queda.");
  }

  // P2 — equipamento fora de operacao
  if (/energia|queda de luz|falta de luz|apagou|blackout|sem luz/.test(texto)) {
    return resposta("P2", "P2 porque ha falha de energia afetando o equipamento. Sem pessoas presas, mas o elevador esta fora de operacao.");
  }
  if (tipo === "parado") {
    return resposta("P2", "P2 porque o elevador esta parado sem pessoas presas. Equipamento fora de operacao.");
  }

  // P4 — sem impacto operacional (checado antes de P3 para pegar itens esteticos)
  if (/ilumina|lampada|lampadas|espelho|limpeza|estetic|pintura|painel arranhado|sujeira/.test(texto)) {
    return resposta("P4", "P4 porque a ocorrencia e de iluminacao/estetica, sem impacto na operacao nem na seguranca.");
  }

  // P3 — degradacao com o elevador operando
  if (tipo === "porta") {
    return resposta("P3", "P3 porque ha falha de porta com o elevador ainda operando. Degradacao sem risco imediato.");
  }
  if (tipo === "ruido") {
    return resposta("P3", "P3 porque ha ruido anormal. Indicio de desgaste mecanico, sem parada do equipamento.");
  }
  if (/botao|botoes|nivelamento|desnivel|parou fora do andar/.test(texto)) {
    return resposta("P3", "P3 porque ha falha de botoeira ou nivelamento. Degradacao sem risco imediato.");
  }

  return resposta("P4", "P4 porque a ocorrencia nao tem impacto operacional imediato. Entra na fila de rotina.");
}

/* --------------------------------------------------------------------------
   REGRA 2 — Risk Score (0 a 100, maior = mais saudavel)
   Media ponderada de 5 fatores, cada um normalizado de 0 a 100.
   Devolve o score E o array de fatores, para o modal de decomposicao.
   -------------------------------------------------------------------------- */
const PESOS_RISCO = [
  { chave: "frequencia", nome: "Frequencia de ocorrencias (90 dias)", peso: 0.35 },
  { chave: "manutencao", nome: "Dias desde a ultima preventiva", peso: 0.25 },
  { chave: "gravidade", nome: "Gravidade media das ocorrencias", peso: 0.20 },
  { chave: "idade", nome: "Idade do equipamento", peso: 0.10 },
  { chave: "resolucao", nome: "Tempo medio de resolucao", peso: 0.10 },
];

const limitar = (n) => Math.max(0, Math.min(100, n));

function calcularRiskScore(elevador, ocorrenciasDoElevador, agora) {
  const ref = agora || Date.now();
  const noPeriodo = (ocorrenciasDoElevador || []).filter(
    (o) => ref - new Date(o.criadoEm).getTime() <= 90 * DIA_MS
  );

  // Fator 1 — frequencia: cada ocorrencia em 90 dias custa 12 pontos.
  const qtd = noPeriodo.length;
  const fFrequencia = limitar(100 - qtd * 12);

  // Fator 2 — preventiva: ate 30 dias e saudavel; a partir dai cai ate zerar em 180 dias.
  const diasManut = Math.floor((ref - new Date(elevador.ultimaManutencaoPreventiva).getTime()) / DIA_MS);
  const fManutencao = limitar(100 - Math.max(0, diasManut - 30) * (100 / 150));

  // Fator 3 — gravidade media: media do peso de gravidade das prioridades, invertida.
  const gravidadeMedia = qtd
    ? noPeriodo.reduce((soma, o) => soma + (PRIORIDADES[o.prioridade] || PRIORIDADES.P4).gravidade, 0) / qtd
    : 0;
  const fGravidade = limitar(100 - gravidadeMedia);

  // Fator 4 — idade: cada ano de uso custa 4 pontos (zera em 25 anos).
  const anos = (ref - new Date(elevador.dataInstalacao).getTime()) / (365.25 * DIA_MS);
  const fIdade = limitar(100 - anos * 4);

  // Fator 5 — resolucao: razao entre o tempo gasto e o SLA daquela prioridade.
  const resolvidas = noPeriodo.filter((o) => o.status === "resolvida" && o.resolvidoEm);
  const razaoMedia = resolvidas.length
    ? resolvidas.reduce((soma, o) => {
        const minutos = (new Date(o.resolvidoEm).getTime() - new Date(o.criadoEm).getTime()) / MINUTO_MS;
        return soma + minutos / (PRIORIDADES[o.prioridade] || PRIORIDADES.P4).slaMinutos;
      }, 0) / resolvidas.length
    : 0;
  const fResolucao = resolvidas.length ? limitar(100 - razaoMedia * 100) : 100;

  const brutos = {
    frequencia: { valor: fFrequencia, detalhe: `${qtd} ocorrencia(s) nos ultimos 90 dias` },
    manutencao: { valor: fManutencao, detalhe: `${diasManut} dias desde a ultima preventiva` },
    gravidade: { valor: fGravidade, detalhe: qtd ? `gravidade media ${gravidadeMedia.toFixed(0)}/100` : "sem ocorrencias no periodo" },
    idade: { valor: fIdade, detalhe: `${anos.toFixed(1)} anos de operacao` },
    resolucao: {
      valor: fResolucao,
      detalhe: resolvidas.length
        ? `usa em media ${(razaoMedia * 100).toFixed(0)}% do prazo de SLA`
        : "sem resolucoes no periodo",
    },
  };

  const fatores = PESOS_RISCO.map((f) => ({
    chave: f.chave,
    nome: f.nome,
    peso: f.peso,
    valor: brutos[f.chave].valor,
    detalhe: brutos[f.chave].detalhe,
    contribuicao: brutos[f.chave].valor * f.peso,
  }));

  const score = Math.round(fatores.reduce((soma, f) => soma + f.contribuicao, 0));
  return { score, ...faixaRisco(score), fatores, qtdOcorrencias: qtd, diasManutencao: diasManut };
}

function faixaRisco(score) {
  if (score <= 40) return { faixa: "critico", rotuloFaixa: "Critico", cor: "var(--elevos-vermelho)" };
  if (score <= 70) return { faixa: "atencao", rotuloFaixa: "Atencao", cor: "var(--elevos-amarelo)" };
  return { faixa: "saudavel", rotuloFaixa: "Saudavel", cor: "var(--elevos-verde)" };
}

/* --------------------------------------------------------------------------
   REGRA 3 — Kit sugerido (deriva do tipo da ocorrencia)
   -------------------------------------------------------------------------- */
const KITS = {
  preso: ["Chave de destravamento manual", "Kit de resgate / cunha", "Radio de comunicacao", "Lanterna"],
  parado: ["Multimetro", "Jogo de fusiveis", "Chave do quadro de comando", "Manual do equipamento"],
  porta: ["Cortina de luz (sensor)", "Roldanas e regua de porta", "Lubrificante de trilho", "Chave Allen"],
  ruido: ["Estetoscopio industrial", "Lubrificante de guias", "Chave de fenda isolada", "Nivel"],
  outro: ["Kit basico de inspecao", "Lanterna", "Multimetro"],
};

const kitSugerido = (tipo) => KITS[tipo] || KITS.outro;

/* --------------------------------------------------------------------------
   REGRA 3 — Mensagem de despacho para o WhatsApp
   -------------------------------------------------------------------------- */
function montarMensagemWhats(ocorrencia, elevador, historico, linkTecnico) {
  const p = PRIORIDADES[ocorrencia.prioridade];
  const tipo = (TIPOS[ocorrencia.tipo] || TIPOS.outro).rotuloOperacao;
  const resumoHistorico = historico && historico.length
    ? `${historico.length} ocorrencia(s) nos ultimos 90 dias (ultima: ${new Date(historico[0].criadoEm).toLocaleDateString("pt-BR")})`
    : "sem ocorrencias recentes";

  const linhas = [
    `*ELEVOS - CHAMADO #${ocorrencia.id}*`,
    `*${p.rotulo}* - SLA ${formatarDuracao(p.slaMinutos)}`,
    "",
    `*Equipamento:* ${elevador.codigo}`,
    `*Local:* ${elevador.predio}`,
    `*Endereco:* ${elevador.endereco}`,
    "",
    `*Ocorrencia:* ${tipo}`,
    ocorrencia.pessoasPresas > 0 ? `*Pessoas presas:* ${ocorrencia.pessoasPresas}` : null,
    ocorrencia.descricao ? `*Relato:* ${ocorrencia.descricao}` : null,
    "",
    `*Historico:* ${resumoHistorico}`,
    `*Kit sugerido:* ${kitSugerido(ocorrencia.tipo).join(", ")}`,
    "",
    `Abrir chamado: ${linkTecnico}`,
  ];

  return linhas.filter((l) => l !== null).join("\n");
}

/* --------------------------------------------------------------------------
   Helpers de SLA e tempo
   -------------------------------------------------------------------------- */
function formatarDuracao(minutos) {
  const m = Math.max(0, Math.round(minutos));
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  const resto = m % 60;
  if (h < 24) return resto ? `${h}h ${resto}min` : `${h}h`;
  const d = Math.floor(h / 24);
  const hr = h % 24;
  return hr ? `${d}d ${hr}h` : `${d}d`;
}

/**
 * Estado do SLA de uma ocorrencia.
 * Para ocorrencias abertas o prazo corre contra o relogio; para resolvidas,
 * congela no tempo que a resolucao levou.
 */
function estadoSla(ocorrencia, agora) {
  const ref = agora || Date.now();
  const sla = (PRIORIDADES[ocorrencia.prioridade] || PRIORIDADES.P4).slaMinutos;
  const criado = new Date(ocorrencia.criadoEm).getTime();

  if (ocorrencia.status === "resolvida" && ocorrencia.resolvidoEm) {
    const gasto = (new Date(ocorrencia.resolvidoEm).getTime() - criado) / MINUTO_MS;
    const dentro = gasto <= sla;
    return {
      encerrado: true,
      cumprido: dentro,
      minutos: gasto,
      classe: dentro ? "encerrado" : "estourado",
      texto: dentro ? `resolvido em ${formatarDuracao(gasto)}` : `estourou (${formatarDuracao(gasto)})`,
    };
  }

  const decorrido = (ref - criado) / MINUTO_MS;
  const restante = sla - decorrido;
  const estourado = restante < 0;
  const proporcao = decorrido / sla;

  return {
    encerrado: false,
    cumprido: !estourado,
    minutos: restante,
    classe: estourado ? "estourado" : proporcao > 0.66 ? "atencao" : "ok",
    texto: estourado ? `SLA estourado ha ${cronometro(-restante)}` : `${cronometro(restante)} restantes`,
  };
}

/** hh:mm:ss quando falta menos de 1 dia; senao "2d 4h". */
function cronometro(minutos) {
  const totalSeg = Math.max(0, Math.round(minutos * 60));
  if (totalSeg >= 24 * 3600) return formatarDuracao(minutos);
  const h = Math.floor(totalSeg / 3600);
  const m = Math.floor((totalSeg % 3600) / 60);
  const s = totalSeg % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
