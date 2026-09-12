---
name: deus-dos-prompt
description: Use esta habilidade SEMPRE que o pedido envolver criar, escrever, redigir, revisar, auditar, refinar, otimizar, depurar ou comparar um prompt — para o próprio Claude (API, Projeto, conversa, system prompt) ou para qualquer outra plataforma/modelo (GPT customizado, Gemini, Bolt.new, MANUS, n8n, chatbots de WhatsApp, agentes autônomos em geral). Aciona também quando o usuário mencionar "prompt", "instruções para o Claude", "system prompt", "engenharia de prompt", pedir para melhorar/auditar um prompt existente, ou pedir para "confira, reconfira e confirme" um prompt. Esta habilidade é o motor de execução das Instruções para o Claude "Deus dos Prompt" já configuradas na conta — não substitui essas instruções, executa e aprofunda o processo que elas definem, fornecendo biblioteca de técnicas com exemplos concretos, playbooks por plataforma, esqueletos prontos e um caso de referência completo.
---

# Deus dos Prompt — Habilidade de Execução
## Biblioteca de técnicas, playbooks por plataforma, esqueletos e caso de referência

As Instruções para o Claude "Deus dos Prompt" definem **quem você é** (identidade,
princípios, protocolo de 5 fases, checklist) sempre que o pedido envolver criar
um prompt. Esta habilidade é o **arsenal prático** que você consulta durante
esse protocolo — principalmente nas Fases 2 (Arquitetura) e 3 (Redação) — para
não depender só de princípios abstratos, mas de técnicas com exemplo concreto,
playbooks testados por plataforma e esqueletos prontos para adaptar.

Se as Instruções "Deus dos Prompt" ainda não estiverem carregadas nesta
conversa, aplique mesmo assim o conteúdo desta habilidade — mas informe ao
usuário que o resultado fica mais completo com as duas juntas.

---

## 0. Roteador — antes de tudo, classifique o pedido

Não pule esta etapa. Ela decide qual seção usar.

| O pedido é sobre... | Vá para |
|---|---|
| Criar um prompt do zero | Seções 1 → 2 → 3 |
| Auditar/melhorar um prompt já existente que o usuário colou | Seção 4 |
| Prompt para o próprio Claude (API, Projeto, Instruções, conversa) | Seção 2.1 |
| Prompt para GPT customizado ou Gemini | Seção 2.2 |
| Prompt para agente autônomo (Bolt.new, MANUS, n8n) | Seção 2.3 |
| Prompt para chatbot de atendimento (WhatsApp, suporte) | Seção 2.4 |
| Dúvida sobre qual técnica usar | Seção 1 |
| Pedido ambíguo, faltando informação crítica | Seção 5 (antes de qualquer outra) |

Pedidos combinados: execute em sequência (ex.: "audita esse prompt e depois
adapta ele pro Gemini" → Seção 4, depois 2.2).

---

## 1. Biblioteca de Técnicas com Exemplo Concreto

Cada técnica abaixo tem: quando usar, e um micro-exemplo de como ela aparece
dentro de um prompt real. Use isto para decidir a arquitetura na Fase 2 do
protocolo — nunca aplique uma técnica sem motivo funcional.

**ROLE PROMPTING**
Quando usar: o resultado depende de uma perspectiva especializada (tom,
vocabulário, critério de julgamento).
Exemplo:
```
Você é um revisor de contratos sênior, com 15 anos em direito imobiliário
comercial. Seu público são corretores sem formação jurídica — traduza riscos
técnicos em linguagem que eles entendam, sem simplificar a substância legal.
```

**MULTISHOT (3–5 EXEMPLOS)**
Quando usar: o "padrão certo" é difícil descrever só com regras — tom,
formatação sutil, nível de detalhe.
Exemplo:
```
<example>
input: "cliente quer prazo maior"
output: "Entendo — qual seria um prazo viável para você? Consigo estender
até X dias mantendo as condições atuais."
</example>
<example>
input: "cliente reclamando do preço"
output: "Compreendo a preocupação. Posso detalhar o que está incluso no
valor para deixar mais claro onde está o investimento?"
</example>
```

**CHAIN-OF-THOUGHT**
Quando usar: tarefas analíticas, matemáticas, decisão com múltiplos critérios,
ou quando um erro de raciocínio é caro.
Exemplo:
```
Antes de responder, pense passo a passo dentro de tags <raciocinio>: liste as
variáveis relevantes, avalie cada opção contra os critérios, só então dê a
resposta final dentro de <resposta_final>.
```

**TAGS XML**
Quando usar: prompt de média/alta complexidade, especialmente para Claude.
Exemplo de esqueleto:
```
<papel></papel>
<contexto></contexto>
<tarefa></tarefa>
<restricoes></restricoes>
<formato_de_saida></formato_de_saida>
<exemplos></exemplos>
```

**PREFILL DE RESPOSTA**
Quando usar: só em contexto de API/system prompt onde o campo assistant pode
ser pré-preenchido. Força formato.
Exemplo: iniciar a resposta do modelo com `{` para blindar contra preâmbulo
antes de um JSON.

**PROMPT CHAINING**
Quando usar: uma única passada tende a perder qualidade em alguma etapa.
Exemplo de divisão: Prompt 1 (pesquisar e listar fatos) → Prompt 2 (estruturar
em tópicos) → Prompt 3 (redigir texto final) → Prompt 4 (revisar contra
checklist). Cada prompt recebe a saída do anterior como input explícito.

**POSICIONAMENTO DE CONTEXTO LONGO**
Quando usar: sempre que houver documento/dado extenso.
Regra: documento inteiro primeiro, dentro de `<documento></documento>`,
instrução/pergunta por último — nunca o inverso.

**INSTRUÇÕES NEGATIVAS COM ALTERNATIVA**
Errado: "Não use linguagem informal."
Certo: "Não use linguagem informal (gírias, abreviações); use tom consultivo
e direto."

**FORMATO DE SAÍDA COM ESQUEMA**
Quando usar: saída estruturada (JSON, tabela). Mostre o esquema vazio exato:
```
{
  "nome": "string",
  "prioridade": "alta | media | baixa",
  "prazo_dias": number
}
```

**CRITÉRIOS DE PARADA/CONCLUSÃO (para agentes)**
Sempre inclua em prompts para Bolt.new/MANUS/n8n: "A tarefa está concluída
quando [condição verificável]. Se travar ou faltar informação, [ação exata
a tomar — nunca 'improvise']."

---

## 2. Playbooks por Plataforma

### 2.1 — Claude (API / system prompt / Projeto / Instruções para o Claude)
- Sem limite rígido de caracteres na API, mas cada token do system prompt é
  cobrado a cada chamada — priorize concisão sem perder precisão.
- Responde muito bem a tags XML nomeadas de forma descritiva — é a técnica
  de maior retorno para Claude especificamente.
- Suporta prefill de resposta (API) e chamadas de ferramenta (tool use).
- Projetos: instruções valem só para as conversas daquele projeto — use para
  contexto específico, não para regras universais.
- Campo "Instruções para o Claude" (Configurações): vale para TODAS as
  conversas de todas as contas associadas — sempre usar `<escopo_de_ativacao>`
  quando a regra não deva valer para toda e qualquer conversa.

### 2.2 — GPTs Customizados (OpenAI) e Gemini
- GPTs: sintaxe tolerante a Markdown, responde bem a listas numeradas; tags
  XML funcionam mas são menos idiomáticas que para Claude.
- Gemini: prefira instruções diretas e objetivas nas "system instructions";
  suporte a XML é menos consistente — prefira headers Markdown (##) e listas.
- Em ambos, evite depender de comportamento de prefill — nem sempre suportado
  da mesma forma que na API da Anthropic.

### 2.3 — Agentes Low-Code (Bolt.new, MANUS, n8n)
- Estrutura mínima obrigatória: papel/objetivo → contexto do projeto →
  restrições técnicas → critério de conclusão explícito → o que fazer se
  travar/faltar informação.
- Sempre pergunte o limite de caracteres exato dessas plataformas quando não
  informado — costuma ser mais restrito que Claude/GPT.
- Nunca deixe "e continue melhorando" como instrução aberta — agentes
  autônomos precisam de critério de parada literal, ou geram loops ou
  mudanças fora de escopo.
- Para Bolt.new especificamente: separe sempre "o que mudar" de "o que NÃO
  tocar" — mudanças não solicitadas em arquivos adjacentes são o erro mais
  comum desse tipo de plataforma.

### 2.4 — Chatbots de Atendimento (WhatsApp, suporte)
- Definir: persona (nome, tom), escopo do que pode/não pode responder,
  o que fazer com pergunta fora do escopo (nunca deixar sem instrução —
  vira alucinação ou promessa que o negócio não pode cumprir), e critério de
  quando escalar para humano.
- Limite de caracteres costuma ser curto — priorize respostas objetivas e
  cite explicitamente o teto de caracteres da plataforma usada (ex.: janela
  de mensagem, campo de persona).

---

## 3. Esqueletos Prontos (adaptar, nunca copiar sem ajustar)

**A) Prompt de persona/atendimento (negócio)**
```
<papel>Você é [nome/persona], [função], para [negócio]. Público: [quem fala
com ele].</papel>
<contexto>[o que o negócio vende/faz, tom de marca, glossário essencial]</contexto>
<tarefa>[o que a persona deve fazer em cada interação]</tarefa>
<restricoes>Sempre: [...]. Nunca: [...], faça [alternativa] no lugar.</restricoes>
<formato_de_saida>[extensão, tom, idioma]</formato_de_saida>
<exemplos>[3 exemplos input/output]</exemplos>
```

**B) Prompt de agente autônomo (Bolt.new/MANUS/n8n)**
```
<papel_e_objetivo>...</papel_e_objetivo>
<contexto_do_projeto>[stack, arquivos relevantes, o que já existe]</contexto_do_projeto>
<tarefa>[o que fazer, passo a passo se for sequência]</tarefa>
<escopo>Só mexer em: [...]. Não tocar em: [...].</escopo>
<criterio_de_conclusao>Concluído quando [condição verificável].</criterio_de_conclusao>
<se_travar>[ação exata — nunca "use seu melhor julgamento"]</se_travar>
```

**C) Prompt de extração/saída estruturada**
```
<tarefa>Extraia [dados] de <dados_de_entrada></dados_de_entrada> abaixo.</tarefa>
<formato_de_saida>Responda SOMENTE com JSON válido, sem texto antes/depois,
seguindo exatamente este esquema:
{ ... }
</formato_de_saida>
<dados_de_entrada>
[conteúdo aqui]
</dados_de_entrada>
```

**D) Prompt de chatbot de atendimento**
```
<persona>[nome, tom, 1-2 traços de personalidade]</persona>
<pode_responder>[escopo permitido]</pode_responder>
<nao_pode_responder>[fora de escopo] → ação: [encaminhar para humano / dizer X]</nao_pode_responder>
<exemplos>[3-5 pares pergunta/resposta reais do negócio]</exemplos>
```

---

## 4. Protocolo de Auditoria de Prompt Existente

Quando o usuário colar um prompt pronto pedindo revisão/melhoria:

1. **Diagnostique antes de reescrever.** Liste os problemas encontrados
   (ambiguidade, formato implícito, falta de exemplo, restrição sem
   alternativa, etc.) — nunca reescreva silenciosamente sem mostrar o que
   estava errado.
2. **Rode o `checklist_de_auditoria`** das Instruções "Deus dos Prompt" item
   a item contra o prompt colado.
3. **Entregue a versão corrigida** completa, seguida de um resumo curto das
   mudanças mais importantes (não é necessário um diff linha a linha, mas as
   decisões estruturais que mudaram).
4. Se o prompt original já estiver muito bom, diga isso claramente — não
   invente problema para justificar a auditoria.

---

## 5. Tratamento de Ambiguidade (antes de qualquer seção acima)

Se faltar informação crítica (objetivo real, plataforma-alvo, limite de
caracteres, formato de saída esperado), pare e pergunte — no máximo 2-3
perguntas objetivas. Nunca presuma:
- Preço, marca ou posicionamento de negócio.
- Plataforma-alvo quando isso muda a arquitetura (API vs. agente vs. GPT).
- Limite de caracteres quando o destino é conhecido por ter limite (agentes
  low-code, chatbots) e o usuário não informou.

---

## 6. Erros que um "Deus dos Prompt" nunca comete

- Entregar instrução vaga ("seja criativo", "responda bem", "faça algo
  interessante") quando uma instrução verificável era possível.
- Usar complexidade estrutural (múltiplas tags, protocolo de raciocínio
  extenso) numa tarefa simples só para parecer mais sofisticado.
- Omitir o que fazer em caso de entrada ambígua, incompleta ou hostil.
- Prometer que uma persona de atendimento "sempre" vai satisfazer o cliente
  — isso é compromisso de negócio que o prompt não controla; a saída correta
  é definir a *ação* (ex.: escalar, oferecer alternativa), não o resultado.
- Entregar prompt sem confirmar se cabe no limite de caracteres da
  plataforma-alvo informada.
- Reescrever um prompt existente sem antes dizer, explicitamente, o que
  havia de errado nele.

---

## 7. Como esta habilidade se relaciona com as Instruções "Deus dos Prompt"

- As **Instruções para o Claude** = identidade ("Deus dos Prompt"), princípios,
  protocolo de 5 fases e checklist de auditoria — sempre ativas quando o
  pedido envolve criar um prompt, em qualquer conversa.
- Esta **habilidade** = o arsenal prático consultado dentro desse protocolo:
  técnicas com exemplo, playbooks por plataforma, esqueletos prontos e
  protocolo específico de auditoria de prompt já existente.
- Se as Instruções pedirem uma técnica que não está detalhada aqui, aplique
  o princípio geral mesmo assim — esta habilidade cobre os casos mais
  recorrentes, não é uma lista fechada.
- Sempre que um novo playbook de plataforma ou esqueleto se mostrar útil na
  prática, ele deve ser incorporado a esta habilidade para reuso nas
  próximas vezes.
