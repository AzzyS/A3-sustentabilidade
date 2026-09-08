# Changelog

Registro de decisões e iterações do Combinado — serve como evidência de processo pro M4/M5 do A3. Adicione uma entrada nova a cada rodada de teste ou ajuste importante (não precisa ser a cada commit pequeno).

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
Próximas entradas sugeridas: item 6 (acessibilidade mais a fundo — teste com leitor de
tela real) e item 7 (feedback/changelog contínuo) do roadmap.
-->
