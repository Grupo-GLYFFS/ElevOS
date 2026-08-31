# ElevOS

Plataforma de gestão de ocorrências em elevadores — demo navegável do Challenge OTIS
(FIAP, 1º ano de Engenharia de Software).

O sistema registra a ocorrência na origem (QR dentro da cabine), classifica a urgência por
regra determinística, organiza a fila de despacho por prioridade e SLA, envia a ordem de
serviço ao técnico por deep link de WhatsApp e devolve à gestão um **Risk Score** por
equipamento com o cálculo aberto.

---

## O ciclo que a demo prova

```
QR SOS  →  classificação automática de urgência  →  fila priorizada
        →  despacho via WhatsApp  →  técnico resolve  →  Risk Score + dashboard
```

Todas as etapas são clicáveis e escrevem na mesma base: o chamado aberto no `sos.html`
aparece de verdade na fila do `ocorrencias.html`, segundos depois.

---

## Como rodar localmente

**Opção 1 — duplo clique.** Abra `index.html` no navegador. Não precisa instalar nada.

**Opção 2 — servidor local (recomendado).** Alguns navegadores restringem o armazenamento
local em páginas abertas por `file://`. Se isso acontecer, a demo avisa no topo da tela.
Para evitar, sirva a pasta:

```bash
python -m http.server 5500
```

Depois abra <http://localhost:5500>.

Não há `npm install`, build, bundler nem backend. São arquivos estáticos.

---

## Como publicar no Vercel

1. Suba a pasta para um repositório no GitHub.
2. Em <https://vercel.com/new>, importe o repositório.
3. Em *Framework Preset*, escolha **Other**. Deixe *Build Command* e *Output Directory* vazios.
4. **Deploy.**

Vercel serve a pasta como site estático e o `index.html` vira a home. Nenhuma configuração
adicional é necessária — não existe `vercel.json` no projeto porque ele não é preciso.

---

## As seis telas

| Arquivo | Perfil | O que faz |
|---|---|---|
| `index.html` | — | Índice da demo: quatro cards de perfil e o botão **Resetar demo**. |
| `sos.html?codigo=ELV-D-1818` | Passageiro | Tela do QR dentro da cabine. Sem login, mobile-first. Abre o chamado e mostra prioridade e SLA na confirmação. |
| `ocorrencias.html` | Operação | Fila ordenada por prioridade e, dentro dela, por tempo de espera. Cronômetro de SLA correndo em cada card. Filtros por status, prioridade e prédio. |
| `ocorrencia.html?id=1057` | Operação | Detalhe, histórico do equipamento, **justificativa da prioridade**, seleção de técnico e despacho por WhatsApp. |
| `dashboard.html` | Gestão | Três KPIs, ocorrências por semana (barras em CSS puro) e ranking de Risk Score com modal de decomposição. |
| `tecnico.html?id=1057` | Técnico | O que abre ao clicar no link do WhatsApp. Ordem de serviço, kit sugerido, botões *Cheguei* e *Resolvido* com campo de laudo. |

Como não há roteamento dinâmico, a navegação usa query params lidos com `URLSearchParams`.

---

## As três regras

### 1. Classificação de urgência

Determinística e auditável. A função devolve `{ prioridade, motivo, slaMinutos }` — o
`motivo` é exibido na tela, então o sistema sempre mostra **por que** aquela prioridade foi
atribuída.

| Prioridade | Gatilho | SLA |
|---|---|---|
| **P1 Crítico** | Pessoas presas · porta aberta com o elevador em movimento | 15 min |
| **P2 Alto** | Elevador parado sem pessoas · falha de energia | 2 h |
| **P3 Médio** | Ruído anormal · botoeira · nivelamento · falha de porta | 24 h |
| **P4 Baixo** | Iluminação · estético · limpeza | 72 h |

### 2. Risk Score

De 0 a 100, **maior = mais saudável**. Média ponderada de cinco fatores, cada um
normalizado de 0 a 100:

| Fator | Peso |
|---|---|
| Frequência de ocorrências nos últimos 90 dias | 35% |
| Dias desde a última manutenção preventiva | 25% |
| Gravidade média das ocorrências | 20% |
| Idade do equipamento | 10% |
| Tempo médio de resolução (em relação ao SLA) | 10% |

Faixas: **0–40 crítico** · **41–70 atenção** · **71–100 saudável**.

O score não é campo salvo — é função pura, recalculada a partir do histórico. A função
devolve também o array de fatores, que alimenta o modal de decomposição no dashboard. É o
que transforma o número num argumento defensável.

### 3. Despacho por WhatsApp

Deep link `wa.me`, sem API paga. A mensagem gerada leva código do elevador, prioridade,
endereço, relato, resumo do histórico, kit sugerido e o link para `tecnico.html?id=`.
Antes de abrir o WhatsApp, a tela mostra a mensagem pronta num modal.

---

## Estrutura

```
/
├── index.html              seletor de perfil / índice da demo
├── sos.html                QR SOS          (?codigo=ELV-D-1818)
├── ocorrencias.html        fila priorizada
├── ocorrencia.html         detalhe e despacho  (?id=)
├── dashboard.html          gestão e Risk Score
├── tecnico.html            visão do técnico    (?id=)
├── css/
│   └── elevos.css          variáveis da marca + ajustes sobre o Bootstrap
├── js/
│   ├── seed.js             dados iniciais
│   ├── store.js            leitura/escrita no localStorage
│   ├── regras.js           urgência + Risk Score + mensagem do WhatsApp
│   └── ui.js               helpers de renderização compartilhados
└── README.md
```

A pasta `.claude/launch.json` só serve para subir o servidor local durante o
desenvolvimento; ela não afeta o deploy.

### Tecnologias

HTML5, CSS3, **Bootstrap 5.3 via CDN** e **JavaScript vanilla (ES6)**. Sem React, sem npm,
sem build step, sem backend e sem banco de dados. As fontes (Space Grotesk, Inter e
JetBrains Mono) vêm do Google Fonts.

### Estado

O "banco de dados" é o **`localStorage`**, na chave `elevos.db.v1`. Na primeira carga o
`store.js` grava o seed; toda ação escreve de volta.

---

## Dados da demo

Todos fictícios: 20 elevadores em 6 prédios, 6 técnicos e 60 ocorrências espalhadas nas
últimas 12 semanas. O seed é calibrado para o dashboard abrir com:

- tempo médio de resposta **~4 min**
- SLA cumprido **~97%**
- **3 equipamentos críticos** (`ELV-C-3303`, `ELV-A-1104`, `ELV-E-4402`)
- **2 chamados P1 abertos**, com o SLA já correndo na fila

---

Projeto acadêmico. Prédios, endereços, técnicos e telefones são fictícios.
