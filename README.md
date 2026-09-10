# Combinado

Ferramenta simples para o grupo ver **quem está fazendo o quê, até quando e em que estado**, sem depender de perguntar no WhatsApp. Feita para o Projeto A3 (Usabilidade, Desenvolvimento Web, Mobile e Jogos — UniSul).

> "Combinado" é um nome de trabalho. Troquem à vontade — inclusive no `<title>` do `index.html` e no `manifest.json`.

## Rodando localmente

Não tem build, não tem dependência. Duas formas de abrir:

1. **Mais simples:** dê duplo clique em `index.html` (funciona, mas alguns navegadores restringem LocalStorage em `file://`).
2. **Recomendado:** sirva a pasta com um servidor local, por exemplo:
   ```bash
   npx serve .
   # ou
   python3 -m http.server 8080
   ```
   depois abra `http://localhost:8080`.

## Publicando (Live Demo do A3)

O jeito mais rápido, direto do GitHub:

1. Suba esta pasta para um repositório público no GitHub.
2. Em **Settings → Pages**, escolha a branch `main` e a pasta raiz (`/`).
3. Em alguns minutos o GitHub gera uma URL pública (`https://usuario.github.io/repositorio/`) — é essa URL que vai no pacote final do A3.
4. Depois de publicar, edite as tags `og:image`, `og:url` e `twitter:image` no `<head>` do `index.html` com a URL completa — assim o preview aparece certo quando colarem o link no grupo.

A cada `push` na branch `main`, um GitHub Action (`.github/workflows/validate.yml`) valida o `index.html` automaticamente — vira evidência simples de qualidade de engenharia (Critério F).

## O que já está implementado

- **Onboarding** — criar grupo e integrantes, sem conta nem senha.
- **Painel** — lista de tarefas com responsável, prazo e status (a fazer / fazendo / pronto), alertas de prazo próximo e atraso, progresso geral do grupo e progresso individual de cada integrante (uma barra por pessoa, na mesma ordem do grupo — não é ranking).
- **Editar e excluir tarefa** — o mesmo diálogo de criar reabre preenchido para editar; excluir sempre pede confirmação num diálogo antes, e mesmo depois de confirmado ainda dá pra "Desfazer".
- **Conquistas do grupo** — selo "Squad em dia" quando não há nenhuma tarefa atrasada, e contagem de tarefas concluídas no prazo (nunca compara pessoas entre si).
- **Checklist de entrega** — revisão final item a item antes de entregar o trabalho.
- **Grupo** — adicionar integrantes depois e reiniciar os dados do zero.
- **Sincronização entre integrantes (opcional)** — com um código de grupo de 6 letras, cada pessoa vê as mesmas tarefas em tempo real, em qualquer aparelho. Veja a seção "Sincronização entre integrantes" abaixo.
- **Feedback do grupo** — aba própria para registrar o que funcionou ou travou no uso do app, com quadro de status (Novo / Em análise / Resolvido). Veja a seção "Feedback do grupo" abaixo.
- Tudo salvo em `localStorage` (chave `combinado:v1`) por padrão — sem backend, sem custo de hospedagem. A sincronização é 100% opcional e cai de volta pro LocalStorage sozinha se não for configurada.

## Como isso conecta com a rubrica do A3

| Heurística de Nielsen aplicada | Onde está no código | Critério da rubrica |
|---|---|---|
| **H1** Visibilidade do status | Barra de progresso, badges de status, toasts (`toast()` em `app.js`), alertas de prazo, e agora também uma barra de progresso por integrante (`renderProgressoIntegrantes`) — o status não é só do grupo, é de cada pessoa | B, mínimo técnico (feedback) |
| **H2** Correspondência com o mundo real | Status em português no vocabulário do grupo (`STATUS_LABEL`), datas em formato brasileiro (`formatarData`), "código de grupo" como o mesmo modelo mental de código de sala/convite de jogos e apps de chat | B |
| **H3** Controle e liberdade | Excluir tarefa com "Desfazer" (`excluirTarefaComDesfazer`), cancelar sempre disponível no diálogo | B |
| **H4** Consistência e padrões | Um único componente de badge/botão reaproveitado em todas as telas; diálogo de confirmação de exclusão (`#dialog-confirmar`) usa o mesmo estilo visual dos outros diálogos do app, não um `confirm()` nativo do navegador | B, D |
| **H5** Prevenção de erros | Validação do formulário antes de salvar; confirmação em duas etapas para reiniciar dados; **diálogo de confirmação antes de excluir qualquer tarefa** (`abrirConfirmacao`), com a ação ainda reversível por "Desfazer" depois — duas camadas de segurança pra uma ação destrutiva | B, **mínimo técnico (1º erro)** |
| **H6** Reconhecer, não lembrar | Integrantes viram chips visíveis; select de responsável em vez de digitar o nome; barra de progresso por pessoa usa a mesma cor de avatar de cada integrante em toda a tela (`paletaDe`) | B |
| **H7** Flexibilidade e eficiência de uso | Atalho de teclado "N" no Painel abre direto o diálogo de nova tarefa (dica no `title` do botão "+", invisível pra quem não usa) | B |
| **H8** Estética e design minimalista | Paleta de cores curta e reutilizada como tokens (`:root` em `style.css`), sem elemento decorativo que não carregue informação | B |
| **H9** Recuperação de erros | `try/catch` ao ler/gravar LocalStorage com aviso amigável em vez de tela quebrada | B, **mínimo técnico (2º erro)** |
| **H10** Ajuda e documentação | Dica no campo de prazo, mensagens de estado vazio explicando o próximo passo | B |

As 10 heurísticas de Nielsen estão cobertas. Isso cobre diretamente o mínimo técnico "prevenção e recuperação de ao menos dois erros relevantes" e boa parte do Critério B (1,5 pt). Guardem prints de **antes/depois** de cada linha da tabela — é a evidência que a rubrica pede.

Fora das heurísticas, três outros critérios já têm evidência pronta:

| Critério | O que já existe |
|---|---|
| **E** — Engajamento responsável (0,7 pt) | Selo "Squad em dia" e contagem de tarefas concluídas no prazo (`renderConquistas` em `app.js`) — reconhece o grupo como time, nunca ranqueia pessoas nem usa prazo como pressão. |
| **F** — Deploy, GitHub e qualidade (1,0 pt) | `LICENSE`, `.gitignore`, `CHANGELOG.md`, Open Graph/Twitter cards com imagem própria (`og-image.png`) e validação automática de HTML via GitHub Actions. |
| **D** — Mobile First (reforço do "PWA") | Service worker (`sw.js`) cacheando o app shell pra funcionar offline, e prompt de "Instalar app" na tela de Grupo. |

## Sincronização entre integrantes (opcional)

Por padrão, o Combinado salva tudo só no navegador de quem está usando — por isso o PC e o celular de uma mesma pessoa mostram coisas diferentes. Dá pra ligar uma sincronização real, sem login nem senha, usando um **código de grupo curto** (ex.: `A3K9QZ`) e o [Firebase](https://firebase.google.com/) (gratuito no plano usado aqui — Firestore no modo Spark).

**Por que código de grupo em vez de conta com senha?** Pro escopo deste projeto (grupo pequeno, sem dado sensível), pedir e-mail/senha de cada integrante é atrito desnecessário — o mesmo problema que o "sem conta, sem senha" do onboarding já resolve. O código funciona como uma chave compartilhada: quem tem o código, edita; é uma segurança por obscuridade, não por autenticação — suficiente aqui, mas documentem essa escolha se apresentarem o projeto (Critério de arquitetura/decisões técnicas).

### Como ativar (~5 minutos, uma pessoa do grupo faz isso uma vez)

1. Acesse o [Console do Firebase](https://console.firebase.google.com) e crie um projeto novo (pode usar qualquer conta Google).
2. Dentro do projeto, clique no ícone **"</>"** (Adicionar app da Web), dê um nome qualquer e **não** marque "Firebase Hosting" — não precisamos disso.
3. O Firebase mostra um objeto `firebaseConfig` — copie os valores para dentro de `js/firebase-config.js` (troque cada `"COLE_AQUI"` pelo valor correspondente).
4. No menu à esquerda, abra **Firestore Database → Criar banco de dados** → modo de produção → escolha a região mais próxima.
5. Na aba **Regras** do Firestore, cole:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /grupos/{codigo} {
         allow read, write: if true;
       }
     }
   }
   ```
   (Isso deixa qualquer pessoa com o código ler/escrever aquele grupo específico — coerente com a ideia de "código = chave", mas **não** use esse padrão de regra para dados sensíveis de verdade.)
6. Salve `js/firebase-config.js`, suba a mudança pro GitHub (ou recarregue localmente) — pronto: a tela inicial passa a mostrar "Já tem um código de grupo? Entrar", e ao criar um grupo novo, a tela de Grupo mostra um código pra compartilhar.

**Sem fazer nada disso**, o Combinado continua funcionando exatamente como sempre funcionou (LocalStorage, um navegador por vez) — nada quebra.

## Feedback do grupo (roadmap item 7)

Aba **Feedback**, ao lado de Grupo: qualquer integrante escolhe seu nome, escreve em uma frase o que aconteceu ("não achei onde editar o prazo", "o atalho N é ótimo") e registra. Cada feedback nasce com status **Novo** e pode ser movido para **Em análise** ou **Resolvido** pelo mesmo tipo de `<select>` colorido já usado no status das tarefas — de propósito, para reaproveitar um padrão visual que o grupo já reconhece (heurística 4, consistência) em vez de inventar um sistema novo.

**O que isso resolve:** antes, o `CHANGELOG.md` só crescia quando quem estava programando lembrava de escrever uma entrada — um processo invisível pro resto do grupo. Agora qualquer pessoa registra um problema ou um elogio no momento em que usa o app, sem precisar abrir o editor de código.

**O que isso não faz sozinho:** o Combinado é um site estático (sem servidor, sem banco de dados próprio) — o app não escreve no arquivo `CHANGELOG.md` automaticamente. Os feedbacks ficam guardados junto com o resto dos dados do grupo (LocalStorage, ou sincronizados via Firestore se o grupo estiver usando o código de grupo). De tempos em tempos, alguém do grupo revisa os itens marcados como **Resolvido** e transforma os relevantes em entradas de verdade no `CHANGELOG.md` — a aba de Feedback é a matéria-prima bruta, não o documento final. Isso também é evidência de processo pro M4/M5: dá pra mostrar print de "isso foi reportado aqui" ao lado da entrada correspondente no changelog.

## PWA — funciona offline e pode ser instalado

- `sw.js` guarda os arquivos do app (HTML/CSS/JS/ícones) em cache no primeiro acesso — depois disso, o Combinado abre mesmo sem internet (as tarefas continuam vindo do LocalStorage, que já era local).
- Se mudarem `index.html`, `style.css` ou `app.js`, **subam o número em `CACHE_NAME` no `sw.js`** (`v1` → `v2`) — sem isso, quem já visitou o site pode continuar vendo a versão antiga em cache por um tempo.
- Isso só funciona servido por `https://` ou `http://localhost` — não funciona abrindo o `index.html` direto do disco (`file://`). No GitHub Pages funciona automaticamente.
- O botão "Instalar app" (na tela de Grupo) só aparece quando o navegador dispara o evento `beforeinstallprompt` — hoje isso é Chrome/Edge no Android e desktop. No iPhone (Safari) não existe esse evento; a instalação lá continua sendo pelo menu de compartilhar → "Adicionar à Tela de Início", manualmente.

Este código nasceu a partir de dois documentos de planejamento do grupo (o guia de heurísticas e o brief de problema/persona/jornada) — vale linkar os dois no Way Hub junto com este repositório, para mostrar a trilha de decisão completa.

## Acessibilidade — o que já foi cuidado

- HTML semântico (`header`, `nav`, `main`, `dialog`, `label` associado a cada campo).
- Foco visível em todo elemento interativo (`:focus-visible`).
- `aria-live` na região de toasts e nos alertas de prazo.
- **Anúncio por voz ao mudar o status de uma tarefa** — trocar o status pelo `<select>` do card (item 6 do roadmap) atualiza uma região `aria-live="polite"` só para leitor de tela (`#sr-anuncio-status`, visualmente oculta com `.visually-hidden`), sem abrir um toast visual a cada clique. Quem enxerga já vê o badge mudar de cor; quem usa leitor de tela agora ouve "Nome da tarefa: status alterado para Fazendo/Pronto/A fazer".
- Alvo de toque de pelo menos 44×44px em todos os botões.
- Nada depende só de cor: todo badge de status também tem texto.
- `prefers-reduced-motion` respeitado.
- Suporte a tema claro/escuro pelo `prefers-color-scheme`.
- Verificação automatizada via árvore de acessibilidade do Chromium (Playwright `page.accessibility.snapshot()`): todos os botões e o `<select>` de status têm nome acessível; nenhum elemento interativo ficou sem rótulo.

**Ainda falta (não dá pra automatizar sozinho, precisa de gente do grupo):** navegar o app de ponta a ponta com um leitor de tela real — NVDA no Windows ou VoiceOver no Mac/iPhone — porque só uma pessoa usando o software de verdade percebe nuances (ordem de leitura estranha, texto confuso, foco perdido) que a árvore de acessibilidade não captura sozinha. Roteiro sugerido pra essa rodada (~15 min, vale gravar a tela pra virar evidência do M4/M5):

1. Ligue o leitor de tela (Windows: `Ctrl+Win+Enter` no NVDA; Mac: `Cmd+F5` no VoiceOver) e navegue só de teclado (`Tab`/`Shift+Tab`, sem mouse).
2. Onboarding: confirme que dá pra criar o grupo e adicionar integrantes sem enxergar a tela.
3. Painel: abra uma tarefa nova pelo atalho **N**, confirme que o diálogo é anunciado ao abrir, preencha e salve.
4. Mude o status de uma tarefa pelo `<select>` do card e confirme que o leitor de tela fala a frase de status alterado (é o item novo desta seção).
5. Exclua uma tarefa e confirme que o toast de "Desfazer" é lido em voz alta a tempo de reagir.
6. Anote qualquer trecho confuso ou silencioso — isso vira o próximo ajuste do roadmap.

Também falta: revisão de contraste com uma ferramenta tipo Lighthouse ou axe DevTools.

## Próximos passos (roadmap combinado com o grupo)

Numeração fixa — use pra pedir a próxima etapa sem precisar reexplicar o que é cada uma:

- [x] **1.** Sincronizar entre integrantes — código de grupo + Firestore (opcional, veja "Sincronização entre integrantes" acima). Sem configurar, continua 100% LocalStorage.
- [x] **2.** Engajamento responsável — selo "Squad em dia" + tarefas concluídas no prazo.
- [x] **3.** Qualidade de entrega — Open Graph, LICENSE, `.gitignore`, CHANGELOG, GitHub Action de validação.
- [x] **4.** Editar tarefa existente.
- [x] **5.** PWA offline de verdade — service worker + prompt de instalação.
- [x] **6a.** Anúncio por voz quando o status de uma tarefa muda (região `aria-live` dedicada, sem toast visual).
- [ ] **6b.** Teste de ponta a ponta com leitor de tela real (NVDA/VoiceOver) — precisa de uma pessoa do grupo rodando de verdade; roteiro sugerido na seção "Acessibilidade" acima.
- [x] **7.** Feedback/changelog contínuo — aba "Feedback" no app, com quadro de status (Novo / Em análise / Resolvido). Veja "Feedback do grupo" abaixo.

## Estrutura de pastas

```
combinado-app/
├── index.html
├── manifest.json
├── sw.js
├── og-image.png
├── LICENSE
├── CHANGELOG.md
├── .gitignore
├── .htmlvalidate.json
├── .github/
│   └── workflows/
│       └── validate.yml
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── firebase-config.js
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

## Créditos

Estrutura e primeira versão do código montadas com apoio do Claude a partir do documento-base do A3 2026/2 e das 10 heurísticas de usabilidade do Nielsen Norman Group. Ajustem, quebrem, reescrevam — é o ponto de partida do grupo, não a versão final.
