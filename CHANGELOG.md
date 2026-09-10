# Changelog

Registro de decisões e iterações do Combinado — serve como evidência de processo pro M4/M5 do A3. Adicione uma entrada nova a cada rodada de teste ou ajuste importante (não precisa ser a cada commit pequeno).

## [1.5.4] — progresso por integrante + confirmação antes de excluir tarefa
- **Adicionado:** no Painel, uma barra de progresso por integrante (`renderProgressoIntegrantes`) logo abaixo das conquistas — mesma barra visual do cabeçalho, uma por pessoa, mostrando "X de Y tarefas prontas". Só aparece quem já tem tarefa atribuída; a cor da barra é a mesma cor de avatar da pessoa em toda a tela (H6, H1).
- **Decisão registrada:** a lista de integrantes segue sempre a ordem do grupo, nunca ordenada por %. Não é um ranking — é a mesma lógica já documentada em "Conquistas do grupo" (Critério E: engajamento responsável, nunca compara pessoas entre si).
- **Adicionado:** diálogo de confirmação (`#dialog-confirmar`, `abrirConfirmacao()`) antes de excluir qualquer tarefa — pergunta "Excluir tarefa?" com o título da tarefa, Cancelar/Excluir. É genérico de propósito, pra poder ser reaproveitado em outras exclusões do app no futuro (ex.: feedback). O "Desfazer" que já existia continua depois de confirmar — duas camadas de segurança pra uma ação destrutiva (H5 + H3).
- **Testado:** roteiro Playwright cobrindo progresso calculado corretamente por pessoa, integrante sem tarefa não aparece na lista, ordem fixa (não por %), diálogo de confirmação abre/cancela/confirma corretamente, e o "Desfazer" continua funcionando depois da confirmação.
- **Atualizado:** `CACHE_NAME` do service worker (`v4` → `v5`).

## [1.5.3] — feedback contínuo do grupo (roadmap item 7)
- **Adicionado:** aba "Feedback" — qualquer integrante registra o que funcionou ou travou (autor via `<select>`, texto curto via `<textarea>`) e acompanha um quadro de status Novo / Em análise / Resolvido, reaproveitando o mesmo componente de badge + `<select>` colorido já usado nas tarefas (H4 — consistência) e o anúncio por voz de troca de status introduzido em 1.5.2 (H4 de novo: um único mecanismo de anúncio pro app inteiro).
- **Adicionado:** excluir feedback com "Desfazer" (H3), igual ao padrão já usado para excluir tarefa.
- **Decisão registrada:** o app não escreve sozinho no `CHANGELOG.md` (é site estático, sem backend) — a aba de Feedback junta os recados num lugar só; alguém do grupo ainda precisa revisar os itens "Resolvido" e transformar os relevantes em entradas formais aqui neste arquivo. Documentado na seção "Feedback do grupo" do README.
- **Testado:** roteiro Playwright cobrindo criação com validação de campo obrigatório, badge inicial "Novo", troca de status com anúncio por voz correspondente, ordenação (mais recente primeiro), excluir com desfazer, e persistência após recarregar a página.
- **Atualizado:** `CACHE_NAME` do service worker (`v3` → `v4`), já que `index.html`/`app.js`/`style.css` mudaram.

## [1.5.2] — acessibilidade: anúncio por voz na troca de status (roadmap item 6a)
- **Adicionado:** região `#sr-anuncio-status` (`aria-live="polite"`, visualmente oculta com `.visually-hidden`) que anuncia pra leitor de tela quando o status de uma tarefa muda pelo `<select>` do card — ex.: "Revisar relatório: status alterado para Fazendo." Separada da região de toasts de propósito, pra não abrir um toast visual a cada troca de status (que já é visível pelo badge mudando de cor).
- **Testado:** roteiro Playwright confirmando que (1) a região existe e começa vazia, (2) o texto muda corretamente a cada troca de status, (3) o elemento é de fato visualmente oculto (`position:absolute; width:1px; height:1px`), e (4) nenhum toast visual extra é disparado só pela troca de status. Também rodada uma verificação da árvore de acessibilidade do Chromium confirmando que todo botão e o `<select>` de status têm nome acessível.
- **Documentado:** roteiro manual de ~15 min pra teste de ponta a ponta com NVDA/VoiceOver na seção "Acessibilidade" do README (item 6b do roadmap) — isso depende de uma pessoa do grupo rodando o leitor de tela de verdade, não dá pra automatizar sozinho.

## [1.5.1] — cobertura completa das 10 heurísticas
- **Adicionado:** atalho de teclado "N" no Painel abre direto o diálogo de nova tarefa (H7 — flexibilidade e eficiência de uso), com dica discreta no `title` do botão "+".
- **Documentado:** comentários no código e novas linhas na tabela do README pra H2 (correspondência com o mundo real) e H8 (estética minimalista) — já estavam implementadas, só faltava a evidência formal pra rubrica. As 10 heurísticas de Nielsen agora estão documentadas.

## [1.5] — identidade visual (logo)
- **Adicionado:** logo própria do Combinado — um "C" (de Combinado) com um checkmark dentro, substituindo o emoji 🤝 usado até então. Aplicada no favicon, no ícone do cabeçalho, no selo do onboarding, nos ícones do PWA (`icons/icon-192.png` e `icons/icon-512.png`), num ícone dedicado pra tela inicial do iPhone (`icons/apple-touch-icon.png`, novo) e na imagem de preview ao colar o link (`og-image.png`).
- **Atualizado:** `sw.js` — cache subiu pra `v2` (arquivos novos/alterados) e passou a guardar também `js/firebase-config.js` e o ícone do iPhone.

## [1.4] — sincronização entre integrantes
- **Adicionado:** sincronização entre integrantes via código de grupo (6 letras) + Firestore — item 1 do roadmap, o maior furo funcional que faltava. Totalmente opcional: sem configurar `js/firebase-config.js`, o app continua 100% LocalStorage, exatamente como antes.
- **Adicionado:** "Já tem um código de grupo? Entrar" no onboarding, e um card com o código + botão "Copiar" na tela de Grupo (só aparecem em modo nuvem).
- **Adicionado:** reconexão automática — quem já sincronizou uma vez neste aparelho volta direto pro grupo ao reabrir o app, sem digitar o código de novo.
- **Adicionado:** "Sair deste grupo" (substitui "Reiniciar dados" em modo nuvem) — esquece o código só neste aparelho, sem apagar os dados de mais ninguém; zona de risco muda de vermelho pra neutro nesse modo, já que deixou de ser destrutivo.
- **Documentado:** passo a passo de configuração do Firebase e as regras de segurança do Firestore no README, seção "Sincronização entre integrantes".

## [1.3] — PWA offline
- **Adicionado:** service worker (`sw.js`) cacheando o app shell — o Combinado abre mesmo sem internet depois da primeira visita.
- **Adicionado:** botão "Instalar app" na tela de Grupo, usando `beforeinstallprompt` (só aparece quando o navegador confirma que dá pra instalar — Chrome/Edge/Android; o Safari do iPhone não tem esse gatilho, então lá a instalação continua sendo manual pelo menu de compartilhar).
- **Adicionado:** selo de versão discreto no canto inferior direito, pra saber de relance qual build está rodando.
- **Corrigido:** ícones de editar/excluir trocados de emoji pra SVG — o emoji de lixeira renderizava sem cor em alguns sistemas e ignorava o hover.

## [1.2] — ajustes de rubrica
- **Adicionado:** selo "Squad em dia" e métrica de tarefas concluídas no prazo (Critério E — engajamento responsável, sem comparar pessoas entre si).
- **Adicionado:** edição de tarefa existente (título, responsável e prazo) — antes só dava pra criar ou excluir.
- **Adicionado:** Open Graph/Twitter cards com imagem de preview, `LICENSE` (MIT) e workflow de validação de HTML no GitHub Actions (Critério F — qualidade de entrega).

## [1.1] — layout
- Cabeçalho do app virou uma faixa sólida na cor de marca com o percentual de progresso em destaque.
- Onboarding ganhou fundo decorativo e um selo de ícone.
- Cards de tarefa passaram a ter uma barra colorida à esquerda por status.
- Cada pessoa do grupo ganhou uma cor de avatar fixa (reconhecimento visual, heurística 6).

## [1.0] — MVP inicial
- Onboarding de grupo (nome + integrantes), sem conta/senha.
- Painel de tarefas com responsável, prazo, status e alertas de prazo/atraso.
- Checklist final de revisão antes da entrega.
- Tela de grupo com adicionar integrante e reiniciar dados (confirmação em duas etapas).
- Dados em LocalStorage; nenhuma dependência externa de JS.

<!--
Próxima entrada sugerida: item 6b do roadmap — depois que alguém do grupo rodar o
roteiro de teste com NVDA/VoiceOver (seção "Acessibilidade" do README), registrar aqui
o que foi encontrado (mesmo que "nada quebrou").
-->
