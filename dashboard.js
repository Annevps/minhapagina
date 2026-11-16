const verificando = document.getElementById("verificando");
const painel = document.getElementById("painel");
const botaoSair = document.getElementById("botao-sair");
const mensagem = document.getElementById("mensagem");

const formulario = document.getElementById("form-projeto");
const tituloForm = document.getElementById("titulo-form");
const campoId = document.getElementById("projeto-id");
const campoTitulo = document.getElementById("projeto-titulo");
const campoImagem = document.getElementById("projeto-imagem");
const campoDescricao = document.getElementById("projeto-descricao");
const campoLink = document.getElementById("projeto-link");
const previa = document.getElementById("previa");
const previaImg = document.getElementById("previa-img");
const botaoSalvar = document.getElementById("botao-salvar");
const botaoCancelar = document.getElementById("botao-cancelar");

const lista = document.getElementById("lista-projetos");
const listaEstado = document.getElementById("lista-estado");

const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

let projetos = []; // cópia da lista que veio do banco

/* ---------- Mensagens ---------- */
function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = tipo === "ok" ? "mensagem-ok" : "mensagem-erro";
  mensagem.hidden = false;
}

function limparMensagem() {
  mensagem.textContent = "";
  mensagem.hidden = true;
}

/* ---------- Acesso ---------- */
async function iniciar() {
  const { data } = await db.auth.getSession();
  const sessao = data.session;

  if (!sessao) {
    window.location.replace("login.html");
    return;
  }

  const { data: admin } = await db
    .from("admins")
    .select("user_id")
    .eq("user_id", sessao.user.id)
    .maybeSingle();

  if (!admin) {
    await db.auth.signOut();
    window.location.replace("login.html");
    return;
  }

  verificando.hidden = true;
  painel.hidden = false;
  carregarProjetos();
}

botaoSair.addEventListener("click", async function () {
  await db.auth.signOut();
  window.location.href = "login.html";
});

/* ---------- Imagens ---------- */
async function enviarImagem(arquivo) {
  let extensao = "jpg";
  if (arquivo.type === "image/png") extensao = "png";
  if (arquivo.type === "image/webp") extensao = "webp";

  const caminho = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + extensao;

  const { error } = await db.storage
    .from(BUCKET_IMAGENS)
    .upload(caminho, arquivo, { contentType: arquivo.type, cacheControl: "3600" });

  if (error) throw error;
  return caminho;
}

async function removerImagem(caminho) {
  if (!caminho) return;
  await db.storage.from(BUCKET_IMAGENS).remove([caminho]);
}

campoImagem.addEventListener("change", function () {
  const arquivo = campoImagem.files[0];
  if (arquivo) {
    previaImg.src = URL.createObjectURL(arquivo);
    previa.hidden = false;
  }
});

/* ---------- Lista de projetos ---------- */
function criarItem(projeto) {
  const item = document.createElement("li");
  item.className = "item-projeto";

  const miniatura = document.createElement("img");
  miniatura.className = "item-miniatura";
  miniatura.src = urlImagem(projeto.imagem_path);
  miniatura.alt = "Imagem do projeto " + projeto.titulo;

  const info = document.createElement("div");
  info.className = "item-info";

  const titulo = document.createElement("strong");
  titulo.textContent = projeto.titulo;

  const data = document.createElement("span");
  data.textContent =
    "Atualizado em " + new Date(projeto.atualizado_em).toLocaleDateString("pt-BR");

  info.append(titulo, data);

  const acoes = document.createElement("div");
  acoes.className = "item-acoes";

  const botaoEditar = document.createElement("button");
  botaoEditar.type = "button";
  botaoEditar.className = "botao botao-contorno botao-pequeno";
  botaoEditar.textContent = "Editar";
  botaoEditar.addEventListener("click", function () {
    editarProjeto(projeto);
  });

  const botaoExcluir = document.createElement("button");
  botaoExcluir.type = "button";
  botaoExcluir.className = "botao botao-perigo botao-pequeno";
  botaoExcluir.textContent = "Excluir";
  botaoExcluir.addEventListener("click", function () {
    excluirProjeto(projeto);
  });

  acoes.append(botaoEditar, botaoExcluir);
  item.append(miniatura, info, acoes);
  return item;
}

async function carregarProjetos() {
  listaEstado.textContent = "Carregando projetos...";
  listaEstado.hidden = false;
  lista.replaceChildren();

  const { data, error } = await db
    .from("projetos")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) {
    console.error(error);
    listaEstado.textContent = "Não foi possível carregar os projetos. Tente recarregar a página.";
    return;
  }

  projetos = data;

  if (projetos.length === 0) {
    listaEstado.textContent = "Nenhum projeto cadastrado ainda.";
    return;
  }

  listaEstado.hidden = true;
  projetos.forEach(function (projeto) {
    lista.appendChild(criarItem(projeto));
  });
}

/* ---------- Formulário ---------- */
function resetarFormulario() {
  formulario.reset();
  campoId.value = "";
  tituloForm.textContent = "Adicionar projeto";
  botaoSalvar.textContent = "Adicionar projeto";
  botaoCancelar.hidden = true;
  previa.hidden = true;
  previaImg.removeAttribute("src");
}

function editarProjeto(projeto) {
  limparMensagem();
  campoId.value = projeto.id;
  campoTitulo.value = projeto.titulo;
  campoDescricao.value = projeto.descricao || "";
  campoLink.value = projeto.link;
  campoImagem.value = "";

  previaImg.src = urlImagem(projeto.imagem_path);
  previa.hidden = false;

  tituloForm.textContent = "Editar projeto";
  botaoSalvar.textContent = "Salvar alterações";
  botaoCancelar.hidden = false;
  formulario.scrollIntoView({ behavior: "smooth", block: "start" });
  campoTitulo.focus();
}

botaoCancelar.addEventListener("click", function () {
  resetarFormulario();
  limparMensagem();
});

function salvando(estado) {
  botaoSalvar.disabled = estado;
  if (estado) {
    botaoSalvar.textContent = "Salvando...";
  } else {
    botaoSalvar.textContent = campoId.value ? "Salvar alterações" : "Adicionar projeto";
  }
}

formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  limparMensagem();

  const id = campoId.value;
  const titulo = campoTitulo.value.trim();
  const descricao = campoDescricao.value.trim();
  const link = campoLink.value.trim();
  const arquivo = campoImagem.files[0];

  // Validações amigáveis
  if (titulo === "") {
    mostrarMensagem("Digite o título do projeto.", "erro");
    return;
  }
  if (!/^https?:\/\/.+/i.test(link)) {
    mostrarMensagem("O link precisa começar com http:// ou https://", "erro");
    return;
  }
  if (!id && !arquivo) {
    mostrarMensagem("Escolha uma imagem de apresentação para o projeto.", "erro");
    return;
  }
  if (arquivo && !TIPOS_PERMITIDOS.includes(arquivo.type)) {
    mostrarMensagem("A imagem precisa ser JPG, PNG ou WebP.", "erro");
    return;
  }
  if (arquivo && arquivo.size > TAMANHO_MAXIMO) {
    mostrarMensagem("A imagem é grande demais. O limite é 5 MB.", "erro");
    return;
  }

  salvando(true);
  let novoCaminho = null;

  try {
    if (arquivo) novoCaminho = await enviarImagem(arquivo);

    if (id) {
      // EDITAR
      const antigo = projetos.find(function (p) {
        return String(p.id) === id;
      });
      const dados = { titulo: titulo, descricao: descricao, link: link };
      if (novoCaminho) dados.imagem_path = novoCaminho;

      const { data, error } = await db
        .from("projetos")
        .update(dados)
        .eq("id", id)
        .select();

      if (error || !data || data.length === 0) throw error || new Error("Sem permissão");

      if (novoCaminho && antigo) await removerImagem(antigo.imagem_path);
      mostrarMensagem("Projeto atualizado com sucesso.", "ok");
    } else {
      // ADICIONAR
      const { error } = await db.from("projetos").insert({
        titulo: titulo,
        descricao: descricao,
        link: link,
        imagem_path: novoCaminho,
      });

      if (error) throw error;
      mostrarMensagem("Projeto adicionado com sucesso.", "ok");
    }

    resetarFormulario();
    await carregarProjetos();
  } catch (erro) {
    console.error(erro);
    // Se a imagem subiu mas o banco falhou, apaga a imagem órfã
    if (novoCaminho) await removerImagem(novoCaminho);
    mostrarMensagem("Não foi possível salvar o projeto. Tente novamente.", "erro");
  } finally {
    salvando(false);
  }
});

/* ---------- Excluir ---------- */
async function excluirProjeto(projeto) {
  const confirmou = window.confirm(
    'Excluir o projeto "' + projeto.titulo + '"? Essa ação não pode ser desfeita.'
  );
  if (!confirmou) return;

  limparMensagem();

  const { data, error } = await db
    .from("projetos")
    .delete()
    .eq("id", projeto.id)
    .select();

  if (error || !data || data.length === 0) {
    console.error(error);
    mostrarMensagem("Não foi possível excluir o projeto.", "erro");
    return;
  }

  await removerImagem(projeto.imagem_path);

  if (campoId.value === String(projeto.id)) resetarFormulario();
  mostrarMensagem("Projeto excluído com sucesso.", "ok");
  carregarProjetos();
}

iniciar();