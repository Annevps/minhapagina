const formulario = document.getElementById("form-login");
const campoEmail = document.getElementById("email");
const campoSenha = document.getElementById("senha");
const mensagemErro = document.getElementById("mensagem-erro");
const botaoEntrar = document.getElementById("botao-entrar");

function mostrarErro(texto) {
  mensagemErro.textContent = texto;
  mensagemErro.hidden = false;
}

function limparErro() {
  mensagemErro.textContent = "";
  mensagemErro.hidden = true;
}

function carregando(estado) {
  botaoEntrar.disabled = estado;
  botaoEntrar.textContent = estado ? "Entrando..." : "Entrar";
}

// Pergunta ao banco se este usuário está na lista de administradores
async function ehAdministrador(idUsuario) {
  const { data, error } = await db
    .from("admins")
    .select("user_id")
    .eq("user_id", idUsuario)
    .maybeSingle();
  return !error && data !== null;
}

// Se já existe uma sessão válida, vai direto para o painel
(async function () {
  const { data } = await db.auth.getSession();
  if (data.session && (await ehAdministrador(data.session.user.id))) {
    window.location.href = "dashboard.html";
  }
})();

formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  limparErro();

  const email = campoEmail.value.trim();
  const senha = campoSenha.value;

  if (email === "" || senha === "") {
    mostrarErro("Preencha o e-mail e a senha para continuar.");
    return;
  }

  carregando(true);

  try {
    const { data, error } = await db.auth.signInWithPassword({
      email: email,
      password: senha,
    });

    if (error) {
      mostrarErro("E-mail ou senha incorretos. Confira e tente de novo.");
      campoSenha.value = "";
      campoSenha.focus();
      return;
    }

    if (!(await ehAdministrador(data.user.id))) {
      await db.auth.signOut();
      mostrarErro("Esta conta não tem permissão para acessar o painel.");
      return;
    }

    window.location.href = "dashboard.html";
  } catch (erro) {
    console.error(erro);
    mostrarErro("Não foi possível conectar. Verifique sua internet e tente de novo.");
  } finally {
    carregando(false);
  }
});