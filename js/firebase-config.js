/* =========================================================
   Combinado — configuração opcional do Firebase (sincronização)
   =========================================================

   Isso é OPCIONAL. Sem preencher este arquivo, o Combinado continua
   funcionando exatamente como antes (tudo salvo só no LocalStorage
   deste navegador/aparelho).

   Preenchendo com dados reais, o app passa a oferecer "Entrar com
   código" no onboarding: todo mundo do grupo que digitar o mesmo
   código vê as mesmas tarefas, em tempo real, em qualquer aparelho.

   COMO CONSEGUIR ESSES VALORES (gratuito, ~5 minutos):
   1. Acesse https://console.firebase.google.com e crie um projeto
      novo (pode ser com a conta Google de qualquer integrante).
   2. Dentro do projeto, clique no ícone "</>" (Adicionar app da Web)
      e siga o passo a passo — não precisa marcar "Firebase Hosting".
   3. O Firebase mostra um objeto "firebaseConfig" — copie os valores
      dele para dentro do objeto abaixo (substitua "COLE_AQUI").
   4. No menu à esquerda, abra "Firestore Database" → "Criar banco de
      dados" → modo de produção (as regras de segurança ficam no
      README, seção "Sincronização entre integrantes").
   5. Salve este arquivo e suba de novo (ou recarregue a página local).

   Veja o passo a passo completo e as regras de segurança sugeridas
   no README.md, seção "Sincronização entre integrantes (opcional)".
   ========================================================= */

var firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};

window.firebaseConfig = firebaseConfig;
