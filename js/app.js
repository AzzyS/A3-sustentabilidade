/* =========================================================
   Combinado — lógica da aplicação
   Vanilla JS, sem dependências. Dados ficam em LocalStorage,
   então o app funciona 100% offline depois do primeiro load.

   Os comentários marcados "H1".."H10" citam a heurística de
   Nielsen que aquele trecho coloca em prática — use isso como
   evidência (print + trecho de código) para o Way Hub.
   ========================================================= */

(function () {
  "use strict";

  var STORAGE_KEY = "combinado:v1";

  // H2 — correspondência com o mundo real: nomes de status no vocabulário
  // que o grupo já usa pra falar de tarefa em português (não "todo/doing/done"
  // nem termos técnicos de gestão de projeto), no modelo mental de quadro
  // Kanban que a maioria já reconhece de outros apps.
  var STATUS_LABEL = { afazer: "A fazer", fazendo: "Fazendo", pronto: "Pronto" };
  var STATUS_ORDEM = { afazer: 0, fazendo: 1, pronto: 2 };

  /* ---------------------------------------------------------
     Estado + persistência
     H1 (Consistência de dados) — um único ponto de leitura e
     escrita evita que uma tela fique "desatualizada" em relação à outra.
     --------------------------------------------------------- */
  var state = { grupo: null, tarefas: [] };

  function carregarEstadoLocal() {
    try {
      var bruto = localStorage.getItem(STORAGE_KEY);
      if (!bruto) return null;
      var dados = JSON.parse(bruto);
      if (!dados || !dados.grupo) return null;
      return dados;
    } catch (erro) {
      // H9 — se os dados salvos estiverem corrompidos, nunca travamos
      // o app: voltamos para o onboarding em vez de quebrar a tela.
      console.warn("Não foi possível ler os dados salvos:", erro);
      return null;
    }
  }

  function salvarEstadoLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (erro) {
      // H9 — recuperação de erro: avisa a pessoa em vez de falhar em silêncio
      // (acontece, por exemplo, com o navegador em modo privado sem espaço).
      toast("Não foi possível salvar agora. Verifique o espaço/armazenamento do navegador.", { tipo: "erro" });
      return false;
    }
  }

  /* ---------------------------------------------------------
     Sincronização entre integrantes (item 1 do roadmap)
     Totalmente opcional: só liga se js/firebase-config.js tiver
     valores reais (veja aquele arquivo). Sem isso, tudo continua
     funcionando exatamente como antes — só neste navegador.

     H1 (visibilidade do status) — o código do grupo fica sempre à
     mostra na tela de Grupo, nunca é uma sincronização "escondida".
     H2 (correspondência com o mundo real) — "código de grupo" de 6
     letras é o mesmo modelo mental de código de sala/convite que
     jogos e apps de chat já usam; não pedimos e-mail/senha, que
     seria um conceito mais técnico e menos familiar pra esse uso.
     H9 (recuperação de erros) — se a nuvem falhar (sem internet, por
     exemplo), o app avisa e continua funcionando com o último dado
     que já tinha, em vez de travar.
     --------------------------------------------------------- */
  var CODIGO_KEY = "combinado:codigo-grupo";
  var ALFABETO_CODIGO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sem O/0/I/1, pra não confundir na hora de digitar

  var modoNuvem = !!(
    window.firebase &&
    window.firebaseConfig &&
    window.firebaseConfig.apiKey &&
    window.firebaseConfig.apiKey !== "COLE_AQUI"
  );

  var db = null;
  var codigoGrupoAtual = null;
  var pararDeOuvirGrupo = null;

  if (modoNuvem) {
    try {
      firebase.initializeApp(window.firebaseConfig);
      db = firebase.firestore();
      db.enablePersistence({ synchronizeTabs: true }).catch(function (erro) {
        console.warn("Persistência offline do Firestore não disponível:", erro);
      });
    } catch (erro) {
      console.warn("Não foi possível iniciar a sincronização, seguindo só com este navegador:", erro);
      modoNuvem = false;
      db = null;
    }
  }

  function gerarCodigoGrupo() {
    var codigo = "";
    for (var i = 0; i < 6; i++) {
      codigo += ALFABETO_CODIGO[Math.floor(Math.random() * ALFABETO_CODIGO.length)];
    }
    return codigo;
  }

  // Ponto único de gravação (H1) — o resto do app só chama salvarEstado()
  // e nem precisa saber se isso vai pro LocalStorage ou pra nuvem.
  function salvarEstado() {
    if (modoNuvem && codigoGrupoAtual && db) {
      db.collection("grupos").doc(codigoGrupoAtual).set(state).catch(function (erro) {
        // Os dados continuam seguros no cache local do Firestore e reenviam
        // sozinhos quando a conexão voltar; a pessoa só recebe um aviso.
        console.warn("Não foi possível sincronizar agora:", erro);
        toast("Sem conexão — suas alterações sincronizam quando a internet voltar.", { tipo: "erro" });
      });
      return true;
    }
    return salvarEstadoLocal();
  }

  // Conecta (ou reconecta) neste grupo em tempo real: qualquer alteração
  // de qualquer integrante, em qualquer aparelho, chega aqui e atualiza a
  // tela sozinha — sem precisar recarregar a página.
  function conectarAoGrupo(codigo, aoConectar, aoFalhar) {
    if (pararDeOuvirGrupo) { pararDeOuvirGrupo(); pararDeOuvirGrupo = null; }
    var primeiraVez = true;
    pararDeOuvirGrupo = db.collection("grupos").doc(codigo).onSnapshot(
      function (doc) {
        if (!doc.exists) {
          if (primeiraVez) { primeiraVez = false; if (aoFalhar) aoFalhar(); }
          return;
        }
        state = doc.data();
        codigoGrupoAtual = codigo;
        if (primeiraVez) {
          primeiraVez = false;
          localStorage.setItem(CODIGO_KEY, codigo);
          if (aoConectar) aoConectar();
        }
        renderTudo();
      },
      function (erro) {
        console.warn("Erro ao sincronizar o grupo:", erro);
        if (primeiraVez) { primeiraVez = false; if (aoFalhar) aoFalhar(); }
      }
    );
  }

  /* ---------------------------------------------------------
     Utilidades
     --------------------------------------------------------- */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function hojeISO() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function paraData(iso) {
    if (!iso) return null;
    var partes = iso.split("-").map(Number);
    return new Date(partes[0], partes[1] - 1, partes[2]);
  }

  function formatarData(iso) {
    var d = paraData(iso);
    if (!d) return "sem prazo";
    // H2 — data em formato brasileiro (dd/mm), não o formato ISO
    // (aaaa-mm-dd) que só faz sentido pra quem programa.
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }

  function diasAteoPrazo(iso) {
    var d = paraData(iso);
    if (!d) return null;
    var diffMs = d.getTime() - hojeISO().getTime();
    return Math.round(diffMs / 86400000);
  }

  function tarefaAtrasada(tarefa) {
    if (tarefa.status === "pronto") return false;
    var dias = diasAteoPrazo(tarefa.prazo);
    return dias !== null && dias < 0;
  }

  function iniciais(nome) {
    return (nome || "?").trim().slice(0, 1).toUpperCase();
  }

  // Ícones em SVG (não emoji) — ficam nítidos em qualquer sistema e
  // herdam a cor do botão via currentColor, então o hover funciona de verdade.
  var ICONE_LAPIS =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M13.4 3.6l3 3L6.6 16.4H3.6v-3L13.4 3.6z"/></svg>';

  var ICONE_LIXEIRA =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 6h12M8 6V4.6c0-.9.7-1.6 1.6-1.6h.8c.9 0 1.6.7 1.6 1.6V6M6 6l.7 9.6c.1 1 .9 1.8 1.9 1.8h2.8c1 0 1.8-.8 1.9-1.8L14 6"/>' +
    '<path d="M8.3 9.2v4.6M11.7 9.2v4.6"/></svg>';

  // H6 — reconhecimento, não memorização: cada pessoa sempre pega a mesma
  // cor de avatar (hash simples do nome), então dá pra reconhecer "de quem
  // é" uma tarefa só pela cor, sem precisar ler o nome toda vez.
  var QTD_PALETAS = 6;
  function paletaDe(nome) {
    var soma = 0;
    for (var i = 0; i < (nome || "").length; i++) soma += nome.charCodeAt(i);
    return soma % QTD_PALETAS;
  }

  /* ---------------------------------------------------------
     Toasts — H1: visibilidade do status do sistema
     --------------------------------------------------------- */
  var regiaoToast = document.getElementById("toast-region");

  function toast(mensagem, opcoes) {
    opcoes = opcoes || {};
    var el = document.createElement("div");
    el.className = "toast" + (opcoes.tipo === "erro" ? " is-erro" : "");

    var texto = document.createElement("span");
    texto.textContent = mensagem;
    el.appendChild(texto);

    var tempo = setTimeout(remover, opcoes.duracao || 6000);

    if (opcoes.acaoLabel && typeof opcoes.acao === "function") {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = opcoes.acaoLabel;
      btn.addEventListener("click", function () {
        clearTimeout(tempo);
        opcoes.acao();
        remover();
      });
      el.appendChild(btn);
    }

    function remover() {
      if (el.parentNode) el.parentNode.removeChild(el);
    }

    regiaoToast.appendChild(el);
  }

  /* ---------------------------------------------------------
     Views (onboarding vs. app) e abas
     --------------------------------------------------------- */
  var elOnboarding = document.getElementById("view-onboarding");
  var elApp = document.getElementById("view-app");
  var elVersionTag = document.getElementById("version-tag");

  function mostrarOnboarding(carregando) {
    elOnboarding.hidden = false;
    elApp.hidden = true;
    elVersionTag.classList.remove("above-tabbar");
    elVersionTag.hidden = false;

    // "carregando" = reconectando a um grupo salvo neste aparelho: some
    // com o formulário por um instante em vez de deixar a pessoa preencher
    // tudo de novo enquanto o app já está buscando os dados dela.
    document.getElementById("carregando-grupo").hidden = !carregando;
    document.getElementById("form-grupo").hidden = !!carregando;
    document.getElementById("bloco-entrar-codigo").hidden = !!carregando || !modoNuvem;

    if (!carregando) document.getElementById("input-nome-grupo").focus();
  }

  function mostrarApp() {
    elOnboarding.hidden = true;
    elApp.hidden = false;
    elVersionTag.classList.add("above-tabbar");
    renderTudo();
  }

  var abas = ["painel", "checklist", "grupo"];
  function irParaAba(nome) {
    abas.forEach(function (a) {
      document.getElementById("view-" + a).hidden = a !== nome;
      var btn = document.querySelector('.tab-btn[data-view="' + a + '"]');
      btn.classList.toggle("is-active", a === nome);
      if (a === nome) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });
    document.getElementById("fab-nova-tarefa").hidden = nome !== "painel";
    // o selo de versão mora no mesmo cantinho do botão "+", então some
    // junto com ele pra nunca ficar um em cima do outro.
    elVersionTag.hidden = nome === "painel";
  }

  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      irParaAba(btn.getAttribute("data-view"));
    });
  });

  document.getElementById("btn-abrir-grupo").addEventListener("click", function () {
    irParaAba("grupo");
  });

  /* ---------------------------------------------------------
     Onboarding: criar grupo
     H5 (prevenção de erros) — valida antes de deixar prosseguir
     H6 (reconhecer, não lembrar) — integrantes viram chips visíveis
     --------------------------------------------------------- */
  var integrantesTemp = [];

  function renderChipsOnboarding() {
    var lista = document.getElementById("lista-integrantes");
    lista.innerHTML = "";
    integrantesTemp.forEach(function (nome, indice) {
      var li = document.createElement("li");
      li.className = "chip";
      var span = document.createElement("span");
      span.textContent = nome;
      var btnRemover = document.createElement("button");
      btnRemover.type = "button";
      btnRemover.setAttribute("aria-label", "Remover " + nome);
      btnRemover.textContent = "✕";
      btnRemover.addEventListener("click", function () {
        integrantesTemp.splice(indice, 1);
        renderChipsOnboarding();
      });
      li.appendChild(span);
      li.appendChild(btnRemover);
      lista.appendChild(li);
    });
  }

  function adicionarIntegranteTemp() {
    var input = document.getElementById("input-integrante");
    var nome = input.value.trim();
    if (!nome) return;
    if (integrantesTemp.indexOf(nome) === -1) integrantesTemp.push(nome);
    input.value = "";
    input.focus();
    renderChipsOnboarding();
  }

  document.getElementById("btn-add-integrante").addEventListener("click", adicionarIntegranteTemp);
  document.getElementById("input-integrante").addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
      evento.preventDefault();
      adicionarIntegranteTemp();
    }
  });

  document.getElementById("form-grupo").addEventListener("submit", function (evento) {
    evento.preventDefault();

    // se a pessoa esqueceu de clicar "Adicionar", aproveitamos o texto digitado
    var pendente = document.getElementById("input-integrante").value.trim();
    if (pendente && integrantesTemp.indexOf(pendente) === -1) integrantesTemp.push(pendente);

    var nomeGrupo = document.getElementById("input-nome-grupo").value.trim();
    var erroNome = document.getElementById("erro-nome-grupo");
    var erroIntegrantes = document.getElementById("erro-integrantes");

    var valido = true;
    if (!nomeGrupo) {
      erroNome.hidden = false;
      valido = false;
    } else {
      erroNome.hidden = true;
    }
    if (integrantesTemp.length === 0) {
      erroIntegrantes.hidden = false;
      valido = false;
    } else {
      erroIntegrantes.hidden = true;
    }
    if (!valido) return;

    state = {
      grupo: { nome: nomeGrupo, integrantes: integrantesTemp.slice() },
      tarefas: []
    };

    if (modoNuvem) {
      var codigoNovo = gerarCodigoGrupo();
      codigoGrupoAtual = codigoNovo;
      db.collection("grupos").doc(codigoNovo).set(state)
        .then(function () { conectarAoGrupo(codigoNovo); })
        .catch(function (erro) {
          // Mesmo sem internet agora, o Firestore guarda a escrita em cache
          // e reenvia sozinho depois — por isso ainda vale escutar o grupo.
          console.warn("Não foi possível criar o grupo na nuvem agora:", erro);
          toast("Sem conexão — o grupo sincroniza assim que a internet voltar.", { tipo: "erro" });
          conectarAoGrupo(codigoNovo);
        });
      toast("Grupo criado! Compartilhe o código com o resto da squad.");
      mostrarApp();
      irParaAba("painel");
      return;
    }

    salvarEstadoLocal();
    toast("Grupo criado! Bora criar a primeira tarefa.");
    mostrarApp();
    irParaAba("painel");
  });

  // "Já tem um código de grupo? Entrar" — só existe (e só fica visível) em modoNuvem.
  document.getElementById("bloco-entrar-codigo").hidden = !modoNuvem;
  if (modoNuvem) {
    var btnEntrarCodigo = document.getElementById("btn-entrar-codigo");
    var inputCodigoEntrar = document.getElementById("input-codigo-entrar");
    var erroCodigo = document.getElementById("erro-codigo");

    function mostrarErroCodigo(mensagem) {
      erroCodigo.textContent = mensagem;
      erroCodigo.hidden = false;
    }

    function tentarEntrarComCodigo() {
      var codigo = inputCodigoEntrar.value.trim().toUpperCase();
      erroCodigo.hidden = true;
      if (!codigo) return;
      btnEntrarCodigo.disabled = true;
      db.collection("grupos").doc(codigo).get().then(function (doc) {
        btnEntrarCodigo.disabled = false;
        if (!doc.exists) {
          mostrarErroCodigo("Não encontramos nenhum grupo com esse código.");
          return;
        }
        conectarAoGrupo(codigo, function () {
          toast("Grupo conectado!");
          mostrarApp();
          irParaAba("painel");
        });
      }).catch(function (erro) {
        btnEntrarCodigo.disabled = false;
        console.warn("Não foi possível procurar esse código agora:", erro);
        mostrarErroCodigo("Sem conexão — tente de novo em instantes.");
      });
    }

    btnEntrarCodigo.addEventListener("click", tentarEntrarComCodigo);
    inputCodigoEntrar.addEventListener("keydown", function (evento) {
      if (evento.key === "Enter") {
        evento.preventDefault();
        tentarEntrarComCodigo();
      }
    });
  }

  /* ---------------------------------------------------------
     Dialog de nova tarefa
     H5 — botão de salvar só habilita com formulário válido
     H3 (controle e liberdade) — cancelar sempre disponível
     --------------------------------------------------------- */
  var dialogTarefa = document.getElementById("dialog-tarefa");
  var formTarefa = document.getElementById("form-tarefa");
  var tituloDialog = document.getElementById("titulo-dialog-tarefa");
  var btnSalvarTarefa = document.getElementById("btn-salvar-tarefa");
  var tarefaEmEdicaoId = null; // H3 — controle e liberdade: reaproveita o mesmo diálogo pra criar e editar

  function abrirDialogTarefa(tarefaParaEditar) {
    formTarefa.reset();
    ["erro-titulo-tarefa", "erro-responsavel", "erro-prazo"].forEach(function (id) {
      document.getElementById(id).hidden = true;
    });

    var select = document.getElementById("select-responsavel");
    select.innerHTML = "";
    var optPadrao = document.createElement("option");
    optPadrao.value = "";
    optPadrao.textContent = "Selecione…";
    select.appendChild(optPadrao);
    state.grupo.integrantes.forEach(function (nome) {
      var opt = document.createElement("option");
      opt.value = nome;
      opt.textContent = nome;
      select.appendChild(opt);
    });

    if (tarefaParaEditar) {
      tarefaEmEdicaoId = tarefaParaEditar.id;
      tituloDialog.innerHTML = '<span aria-hidden="true">✏️</span> Editar tarefa';
      btnSalvarTarefa.textContent = "Salvar alterações";
      document.getElementById("input-titulo-tarefa").value = tarefaParaEditar.titulo;
      select.value = tarefaParaEditar.responsavel;
      document.getElementById("input-prazo").value = tarefaParaEditar.prazo || "";
    } else {
      tarefaEmEdicaoId = null;
      tituloDialog.innerHTML = '<span aria-hidden="true">🗒️</span> Nova tarefa';
      btnSalvarTarefa.textContent = "Criar tarefa";
    }

    dialogTarefa.showModal();
    document.getElementById("input-titulo-tarefa").focus();
  }

  document.querySelectorAll("[data-abrir-nova-tarefa]").forEach(function (btn) {
    btn.addEventListener("click", function () { abrirDialogTarefa(null); });
  });

  document.querySelectorAll("[data-fechar-dialog]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      dialogTarefa.close();
    });
  });

  formTarefa.addEventListener("submit", function (evento) {
    evento.preventDefault();

    var titulo = document.getElementById("input-titulo-tarefa").value.trim();
    var responsavel = document.getElementById("select-responsavel").value;
    var prazo = document.getElementById("input-prazo").value;

    var valido = true;
    function marcarErro(idCampo, mostra) {
      document.getElementById(idCampo).hidden = !mostra;
      if (mostra) valido = false;
    }
    marcarErro("erro-titulo-tarefa", !titulo);
    marcarErro("erro-responsavel", !responsavel);
    marcarErro("erro-prazo", !prazo);
    if (!valido) return;

    if (tarefaEmEdicaoId) {
      var existente = state.tarefas.find(function (t) { return t.id === tarefaEmEdicaoId; });
      if (existente) {
        existente.titulo = titulo;
        existente.responsavel = responsavel;
        existente.prazo = prazo;
        // se o novo prazo já passou, isso será refletido de novo no próximo render (atualizarFlagsAtraso)
      }
      salvarEstado();
      dialogTarefa.close();
      toast("Tarefa atualizada.");
    } else {
      state.tarefas.push({
        id: uid(),
        titulo: titulo,
        responsavel: responsavel,
        prazo: prazo,
        status: "afazer",
        revisado: false,
        foiAtrasada: false,
        criadoEm: Date.now()
      });
      salvarEstado();
      dialogTarefa.close();
      toast("Tarefa criada.");
    }
    tarefaEmEdicaoId = null;
    renderTudo();
  });

  /* ---------------------------------------------------------
     Atalho de teclado — H7 (flexibilidade e eficiência de uso)
     Fica invisível pra quem está começando (não aparece na tela,
     só numa dica no título do botão "+"), mas acelera quem já usa
     o Combinado com frequência: apertar "N" no Painel abre direto
     o diálogo de nova tarefa, sem precisar mirar no botão.
     --------------------------------------------------------- */
  document.addEventListener("keydown", function (evento) {
    if (evento.key !== "n" && evento.key !== "N") return;
    if (evento.metaKey || evento.ctrlKey || evento.altKey) return; // não atropela atalhos do navegador/SO
    if (elApp.hidden) return; // só depois de já estar dentro do app
    if (dialogTarefa.open) return; // já tem um diálogo aberto
    if (document.getElementById("view-painel").hidden) return; // só no Painel, onde o "+" também mora
    var alvo = document.activeElement;
    var tag = alvo && alvo.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return; // não atropela quem tá digitando
    evento.preventDefault();
    abrirDialogTarefa(null);
  });

  /* ---------------------------------------------------------
     Painel de tarefas
     H1 — estados de vazio/preenchido e feedback de progresso
     H4 (consistência) — mesmo badge de status em toda a lista
     --------------------------------------------------------- */
  function tarefasOrdenadas() {
    return state.tarefas.slice().sort(function (a, b) {
      var atrasoA = tarefaAtrasada(a) ? 0 : 1;
      var atrasoB = tarefaAtrasada(b) ? 0 : 1;
      if (atrasoA !== atrasoB) return atrasoA - atrasoB;
      if (a.prazo !== b.prazo) return (a.prazo || "9999-99-99") < (b.prazo || "9999-99-99") ? -1 : 1;
      return STATUS_ORDEM[a.status] - STATUS_ORDEM[b.status];
    });
  }

  function renderAlertas() {
    var container = document.getElementById("painel-alertas");
    container.innerHTML = "";

    var atrasadas = state.tarefas.filter(tarefaAtrasada).length;
    var venceLogo = state.tarefas.filter(function (t) {
      var dias = diasAteoPrazo(t.prazo);
      return t.status !== "pronto" && dias !== null && dias >= 0 && dias <= 2;
    }).length;

    if (atrasadas > 0) {
      var a1 = document.createElement("div");
      a1.className = "alert-item is-atrasado";
      a1.textContent = "⚠️ " + atrasadas + (atrasadas === 1 ? " tarefa está atrasada." : " tarefas estão atrasadas.");
      container.appendChild(a1);
    }
    if (venceLogo > 0) {
      var a2 = document.createElement("div");
      a2.className = "alert-item";
      a2.textContent = "⏰ " + venceLogo + (venceLogo === 1 ? " tarefa vence" : " tarefas vencem") + " nos próximos 2 dias.";
      container.appendChild(a2);
    }
  }

  /* ---------------------------------------------------------
     Conquistas do grupo — H2 do roadmap
     Gamificação ética: só reconhece o grupo como um todo, nunca
     compara pessoas entre si nem usa prazo como pressão negativa.
     --------------------------------------------------------- */
  function atualizarFlagsAtraso() {
    var mudou = false;
    state.tarefas.forEach(function (t) {
      if (tarefaAtrasada(t) && !t.foiAtrasada) {
        t.foiAtrasada = true;
        mudou = true;
      }
    });
    if (mudou) salvarEstado();
  }

  function renderConquistas() {
    var container = document.getElementById("painel-conquistas");
    container.innerHTML = "";
    var total = state.tarefas.length;
    if (total === 0) return;

    var atrasadasAgora = state.tarefas.filter(tarefaAtrasada).length;
    var prontasNoPrazo = state.tarefas.filter(function (t) {
      return t.status === "pronto" && !t.foiAtrasada;
    }).length;

    if (atrasadasAgora === 0) {
      var selo = document.createElement("span");
      selo.className = "conquista";
      selo.textContent = "🏅 Squad em dia — nenhuma tarefa atrasada";
      container.appendChild(selo);
    }

    if (prontasNoPrazo > 0) {
      var meta = document.createElement("span");
      meta.className = "conquista is-neutra";
      meta.textContent = "🎯 " + prontasNoPrazo + " de " + total + " concluídas no prazo";
      container.appendChild(meta);
    }
  }

  function excluirTarefaComDesfazer(id) {
    var indice = state.tarefas.findIndex(function (t) { return t.id === id; });
    if (indice === -1) return;
    var removida = state.tarefas[indice];
    state.tarefas.splice(indice, 1);
    salvarEstado();
    renderTudo();

    // H3 — controle e liberdade: dá pra desfazer por alguns segundos
    toast('Tarefa "' + removida.titulo + '" excluída.', {
      acaoLabel: "Desfazer",
      acao: function () {
        state.tarefas.splice(indice, 0, removida);
        salvarEstado();
        renderTudo();
        toast("Tarefa restaurada.");
      }
    });
  }

  function renderPainel() {
    renderAlertas();
    renderConquistas();

    var lista = document.getElementById("lista-tarefas");
    var vazio = document.getElementById("painel-vazio");
    lista.innerHTML = "";

    if (state.tarefas.length === 0) {
      vazio.hidden = false;
      return;
    }
    vazio.hidden = true;

    tarefasOrdenadas().forEach(function (tarefa) {
      var atrasada = tarefaAtrasada(tarefa);
      var li = document.createElement("li");
      li.className = "task-card status-" + tarefa.status + (atrasada ? " is-atrasado" : "");

      var top = document.createElement("div");
      top.className = "task-top";

      var titulo = document.createElement("p");
      titulo.className = "task-titulo";
      titulo.textContent = tarefa.titulo;

      var badge = document.createElement("span");
      var statusVisual = atrasada ? "atrasado" : tarefa.status;
      var rotulos = { afazer: "A fazer", fazendo: "Fazendo", pronto: "Pronto", atrasado: "Atrasada" };
      badge.className = "badge badge-" + statusVisual;
      badge.textContent = rotulos[statusVisual];

      top.appendChild(titulo);
      top.appendChild(badge);

      var meta = document.createElement("div");
      meta.className = "task-meta";

      var avatar = document.createElement("span");
      avatar.className = "task-avatar pal-" + paletaDe(tarefa.responsavel);
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = iniciais(tarefa.responsavel);
      var nomeResp = document.createElement("span");
      nomeResp.textContent = tarefa.responsavel;
      var prazoSpan = document.createElement("span");
      prazoSpan.textContent = "· prazo " + formatarData(tarefa.prazo);

      meta.appendChild(avatar);
      meta.appendChild(nomeResp);
      meta.appendChild(prazoSpan);

      var controles = document.createElement("div");
      controles.className = "task-controls";

      var select = document.createElement("select");
      select.className = "status-" + tarefa.status;
      select.setAttribute("aria-label", "Status de " + tarefa.titulo);
      ["afazer", "fazendo", "pronto"].forEach(function (chave) {
        var opt = document.createElement("option");
        opt.value = chave;
        opt.textContent = STATUS_LABEL[chave];
        if (chave === tarefa.status) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener("change", function () {
        tarefa.status = select.value;
        salvarEstado();
        renderTudo();
      });

      var btnEditar = document.createElement("button");
      btnEditar.type = "button";
      btnEditar.className = "task-icon-btn";
      btnEditar.setAttribute("aria-label", "Editar tarefa " + tarefa.titulo);
      btnEditar.innerHTML = ICONE_LAPIS;
      btnEditar.addEventListener("click", function () {
        abrirDialogTarefa(tarefa);
      });

      var btnExcluir = document.createElement("button");
      btnExcluir.type = "button";
      btnExcluir.className = "task-icon-btn is-perigo";
      btnExcluir.setAttribute("aria-label", "Excluir tarefa " + tarefa.titulo);
      btnExcluir.innerHTML = ICONE_LIXEIRA;
      btnExcluir.addEventListener("click", function () {
        excluirTarefaComDesfazer(tarefa.id);
      });

      controles.appendChild(select);
      controles.appendChild(btnEditar);
      controles.appendChild(btnExcluir);

      li.appendChild(top);
      li.appendChild(meta);
      li.appendChild(controles);
      lista.appendChild(li);
    });
  }

  /* ---------------------------------------------------------
     Checklist final de entrega
     H10 (ajuda e documentação) — resumo objetivo do que falta
     --------------------------------------------------------- */
  function renderChecklist() {
    var lista = document.getElementById("lista-checklist");
    var vazio = document.getElementById("checklist-vazio");
    var resumo = document.getElementById("checklist-resumo");
    lista.innerHTML = "";

    if (state.tarefas.length === 0) {
      vazio.hidden = false;
      resumo.textContent = "";
      return;
    }
    vazio.hidden = true;

    var revisadas = state.tarefas.filter(function (t) { return t.revisado; }).length;
    resumo.textContent = revisadas + " de " + state.tarefas.length + " itens revisados";

    state.tarefas.forEach(function (tarefa) {
      var li = document.createElement("li");
      li.className = "checklist-item" + (tarefa.revisado ? " is-revisado" : "");

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = !!tarefa.revisado;
      checkbox.id = "rev-" + tarefa.id;
      checkbox.addEventListener("change", function () {
        tarefa.revisado = checkbox.checked;
        salvarEstado();
        renderChecklist();
      });

      var textos = document.createElement("label");
      textos.setAttribute("for", "rev-" + tarefa.id);
      var titulo = document.createElement("div");
      titulo.className = "titulo";
      titulo.textContent = tarefa.titulo;
      var sub = document.createElement("div");
      sub.className = "sub";
      sub.textContent = tarefa.responsavel + " · " + STATUS_LABEL[tarefa.status];
      textos.appendChild(titulo);
      textos.appendChild(sub);

      li.appendChild(checkbox);
      li.appendChild(textos);
      lista.appendChild(li);
    });

    var jaTinhaCelebracao = document.querySelector(".celebracao");
    if (jaTinhaCelebracao) jaTinhaCelebracao.remove();
    if (revisadas === state.tarefas.length) {
      var msg = document.createElement("p");
      msg.className = "celebracao";
      msg.textContent = "Tudo revisado! Prontos para entregar. 🎉";
      document.getElementById("view-checklist").appendChild(msg);
    }
  }

  /* ---------------------------------------------------------
     Tela do grupo
     --------------------------------------------------------- */
  function renderGrupo() {
    var lista = document.getElementById("lista-integrantes-grupo");
    lista.innerHTML = "";
    state.grupo.integrantes.forEach(function (nome) {
      var li = document.createElement("li");
      var avatar = document.createElement("span");
      avatar.className = "task-avatar pal-" + paletaDe(nome);
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = iniciais(nome);
      var span = document.createElement("span");
      span.textContent = nome;
      li.appendChild(avatar);
      li.appendChild(span);
      lista.appendChild(li);
    });

    var cardCodigo = document.getElementById("codigo-grupo-card");
    if (modoNuvem && codigoGrupoAtual) {
      cardCodigo.hidden = false;
      document.getElementById("codigo-grupo-texto").textContent = codigoGrupoAtual;
    } else {
      cardCodigo.hidden = true;
    }

    atualizarZonaRisco();
  }

  document.getElementById("btn-copiar-codigo").addEventListener("click", function () {
    if (!codigoGrupoAtual) return;
    function avisarCopiaManual() {
      toast("Não foi possível copiar automaticamente. Código: " + codigoGrupoAtual);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(codigoGrupoAtual).then(function () {
        toast("Código copiado!");
      }).catch(avisarCopiaManual);
    } else {
      avisarCopiaManual();
    }
  });

  function adicionarIntegranteReal() {
    var input = document.getElementById("input-integrante-2");
    var nome = input.value.trim();
    if (!nome) return;
    if (state.grupo.integrantes.indexOf(nome) !== -1) {
      toast(nome + " já está no grupo.", { tipo: "erro" });
      return;
    }
    state.grupo.integrantes.push(nome);
    salvarEstado();
    input.value = "";
    toast(nome + " entrou no grupo.");
    renderGrupo();
  }
  document.getElementById("btn-add-integrante-2").addEventListener("click", adicionarIntegranteReal);
  document.getElementById("input-integrante-2").addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
      evento.preventDefault();
      adicionarIntegranteReal();
    }
  });

  // H5 — confirmação em duas etapas antes de uma ação destrutiva/irreversível.
  // Em modo nuvem, "sair do grupo" não é destrutivo pra ninguém além de quem
  // clicou (só esquece o código neste aparelho) — por isso o texto e o
  // visual mudam (atualizarZonaRisco), mas a confirmação em duas etapas
  // continua, pra evitar clique acidental.
  var elPerigoZona = document.getElementById("perigo-zona");
  var elPerigoZonaTitulo = document.getElementById("perigo-zona-titulo");
  var elPerigoZonaTexto = document.getElementById("perigo-zona-texto");
  var btnReiniciar = document.getElementById("btn-reiniciar");
  var reiniciarArmado = false;
  var reiniciarTimeout = null;

  function textoBotaoReiniciar() {
    return modoNuvem && codigoGrupoAtual ? "Sair deste grupo" : "Reiniciar dados do grupo";
  }

  function atualizarZonaRisco() {
    var emGrupoCompartilhado = modoNuvem && codigoGrupoAtual;
    elPerigoZona.classList.toggle("is-neutro", emGrupoCompartilhado);
    elPerigoZonaTitulo.textContent = emGrupoCompartilhado ? "Sair do grupo" : "Zona de risco";
    elPerigoZonaTexto.textContent = emGrupoCompartilhado
      ? "Isso esquece o código deste grupo neste aparelho. As tarefas continuam salvas pro resto da squad."
      : "Isso apaga o grupo e todas as tarefas deste navegador.";
    if (!reiniciarArmado) btnReiniciar.textContent = textoBotaoReiniciar();
  }

  btnReiniciar.addEventListener("click", function () {
    if (!reiniciarArmado) {
      reiniciarArmado = true;
      btnReiniciar.textContent = "Clique de novo para confirmar";
      reiniciarTimeout = setTimeout(function () {
        reiniciarArmado = false;
        btnReiniciar.textContent = textoBotaoReiniciar();
      }, 5000);
      return;
    }
    clearTimeout(reiniciarTimeout);
    reiniciarArmado = false;

    if (modoNuvem && codigoGrupoAtual) {
      if (pararDeOuvirGrupo) { pararDeOuvirGrupo(); pararDeOuvirGrupo = null; }
      localStorage.removeItem(CODIGO_KEY);
      codigoGrupoAtual = null;
      state = { grupo: null, tarefas: [] };
      integrantesTemp = [];
      document.getElementById("form-grupo").reset();
      var inputCodigo = document.getElementById("input-codigo-entrar");
      if (inputCodigo) inputCodigo.value = "";
      renderChipsOnboarding();
      mostrarOnboarding();
      toast("Você saiu do grupo. As tarefas continuam salvas pro resto da squad.");
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
    state = { grupo: null, tarefas: [] };
    integrantesTemp = [];
    document.getElementById("form-grupo").reset();
    renderChipsOnboarding();
    mostrarOnboarding();
  });

  /* ---------------------------------------------------------
     Cabeçalho / progresso
     --------------------------------------------------------- */
  function renderHeader() {
    document.getElementById("nome-grupo-exibido").textContent = state.grupo.nome;
    var total = state.tarefas.length;
    var prontas = state.tarefas.filter(function (t) { return t.status === "pronto"; }).length;
    var pct = total === 0 ? 0 : Math.round((prontas / total) * 100);
    document.getElementById("progresso-preenchimento").style.width = pct + "%";
    document.getElementById("progresso-numero").textContent = pct + "%";
    document.getElementById("progresso-texto").textContent = prontas + " de " + total + " tarefas prontas";
  }

  function renderTudo() {
    if (!state.grupo) return;
    atualizarFlagsAtraso();
    renderHeader();
    renderPainel();
    renderChecklist();
    renderGrupo();
  }

  /* ---------------------------------------------------------
     PWA: service worker (offline) + prompt de instalação
     --------------------------------------------------------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function (erro) {
        // H9 — não trava o app: sem service worker o Combinado ainda
        // funciona normalmente, só não guarda cache pra usar offline.
        console.warn("Service worker não registrado:", erro);
      });
    });
  }

  var promptDeInstalacaoAdiado = null;
  var zonaInstalar = document.getElementById("instalar-zona");
  var btnInstalar = document.getElementById("btn-instalar");

  window.addEventListener("beforeinstallprompt", function (evento) {
    evento.preventDefault();
    promptDeInstalacaoAdiado = evento;
    zonaInstalar.hidden = false; // só aparece quando o navegador confirma que dá pra instalar
  });

  btnInstalar.addEventListener("click", function () {
    if (!promptDeInstalacaoAdiado) return;
    promptDeInstalacaoAdiado.prompt();
    promptDeInstalacaoAdiado.userChoice.then(function (resultado) {
      if (resultado.outcome === "accepted") toast("Combinado instalado! 🎉");
      promptDeInstalacaoAdiado = null;
      zonaInstalar.hidden = true;
    });
  });

  window.addEventListener("appinstalled", function () {
    zonaInstalar.hidden = true;
  });

  /* ---------------------------------------------------------
     Inicialização
     --------------------------------------------------------- */
  var codigoSalvo = modoNuvem ? localStorage.getItem(CODIGO_KEY) : null;

  if (codigoSalvo) {
    // Já tinha um grupo sincronizado neste aparelho — reconecta sozinho,
    // sem pedir pra digitar o código de novo.
    mostrarOnboarding(true);
    conectarAoGrupo(
      codigoSalvo,
      function () {
        mostrarApp();
        irParaAba("painel");
      },
      function () {
        // Código salvo não existe mais na nuvem (grupo apagado, por
        // exemplo) — H9: não trava, só volta pro onboarding normal.
        localStorage.removeItem(CODIGO_KEY);
        renderChipsOnboarding();
        mostrarOnboarding();
        toast("Não encontramos mais o seu grupo. Crie um novo ou entre com um código.", { tipo: "erro" });
      }
    );
  } else {
    var estadoSalvo = carregarEstadoLocal();
    if (estadoSalvo) {
      state = estadoSalvo;
      mostrarApp();
      irParaAba("painel");
    } else {
      renderChipsOnboarding();
      mostrarOnboarding();
    }
  }
})();
