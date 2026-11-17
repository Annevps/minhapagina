
/* =========================================================
   ELEMENTOS DO PAINEL
   ========================================================= */

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
const campoCategoria = document.getElementById("projeto-categoria");
const campoGithub = document.getElementById("projeto-github");
const previa = document.getElementById("previa");
const previaImg = document.getElementById("previa-img");
const botaoSalvar = document.getElementById("botao-salvar");
const botaoCancelar = document.getElementById("botao-cancelar");

const lista = document.getElementById("lista-projetos");
const listaEstado = document.getElementById("lista-estado");

/* Elementos das mensagens */
const listaMensagens = document.getElementById("lista-mensagens");
const mensagensEstado = document.getElementById("mensagens-estado");
const mensagensContador = document.getElementById("mensagens-contador");
const botaoAtualizarMensagens = document.getElementById(
  "botao-atualizar-mensagens"
);

const TAMANHO_MAXIMO = 5 * 1024 * 1024;
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

let projetos = [];


/* =========================================================
   MENSAGENS DO SISTEMA
   ========================================================= */

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = tipo === "ok" ? "mensagem-ok" : "mensagem-erro";
  mensagem.hidden = false;
}

function limparMensagem() {
  mensagem.textContent = "";
  mensagem.hidden = true;
}


/* =========================================================
   AUTENTICAÇÃO E ACESSO ADMINISTRATIVO
   ========================================================= */

async function iniciar() {
  try {
    const { data, error } = await db.auth.getSession();

    if (error) throw error;

    const sessao = data.session;

    if (!sessao) {
      window.location.replace("login.html");
      return;
    }

    const { data: admin, error: erroAdmin } = await db
      .from("admins")
      .select("user_id")
      .eq("user_id", sessao.user.id)
      .maybeSingle();

    if (erroAdmin) throw erroAdmin;

    if (!admin) {
      await db.auth.signOut();
      window.location.replace("login.html");
      return;
    }

    verificando.hidden = true;
    painel.hidden = false;

    await Promise.all([
      carregarProjetos(),
      carregarMensagens()
    ]);

  } catch (erro) {
    console.error("Erro ao verificar acesso:", erro);

    verificando.textContent =
      "Não foi possível verificar seu acesso. Atualize a página.";
  }
}


botaoSair.addEventListener("click", async function () {
  await db.auth.signOut();
  window.location.href = "login.html";
});


/* =========================================================
   GERENCIAMENTO DE IMAGENS DOS PROJETOS
   ========================================================= */

async function enviarImagem(arquivo) {
  let extensao = "jpg";

  if (arquivo.type === "image/png") extensao = "png";
  if (arquivo.type === "image/webp") extensao = "webp";

  const caminho =
    Date.now() + "-" +
    Math.random().toString(36).slice(2, 8) +
    "." + extensao;

  const { error } = await db.storage
    .from(BUCKET_IMAGENS)
    .upload(caminho, arquivo, {
      contentType: arquivo.type,
      cacheControl: "3600"
    });

  if (error) throw error;

  return caminho;
}


async function removerImagem(caminho) {
  if (!caminho) return;

  await db.storage
    .from(BUCKET_IMAGENS)
    .remove([caminho]);
}


campoImagem.addEventListener("change", function () {
  const arquivo = campoImagem.files[0];

  if (arquivo) {
    previaImg.src = URL.createObjectURL(arquivo);
    previa.hidden = false;
  }
});


/* =========================================================
   LISTA DE PROJETOS
   ========================================================= */

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
    "Atualizado em " +
    new Date(projeto.atualizado_em).toLocaleDateString("pt-BR");

  info.append(titulo, data);

  const acoes = document.createElement("div");
  acoes.className = "item-acoes";

  const botaoEditar = document.createElement("button");
  botaoEditar.type = "button";
  botaoEditar.className =
    "botao botao-contorno botao-pequeno";
  botaoEditar.textContent = "Editar";

  botaoEditar.addEventListener("click", function () {
    editarProjeto(projeto);
  });

  const botaoExcluir = document.createElement("button");
  botaoExcluir.type = "button";
  botaoExcluir.className =
    "botao botao-perigo botao-pequeno";
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

    listaEstado.textContent =
      "Não foi possível carregar os projetos. Tente recarregar a página.";

    return;
  }

  projetos = data || [];

  if (projetos.length === 0) {
    listaEstado.textContent = "Nenhum projeto cadastrado ainda.";
    return;
  }

  listaEstado.hidden = true;

  projetos.forEach(function (projeto) {
    lista.appendChild(criarItem(projeto));
  });
}


/* =========================================================
   FORMULÁRIO DE PROJETOS
   ========================================================= */

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
  campoCategoria.value = projeto.categoria || "Outros";
  campoGithub.value = projeto.github_url || "";

  campoImagem.value = "";

  previaImg.src = urlImagem(projeto.imagem_path);
  previa.hidden = false;

  tituloForm.textContent = "Editar projeto";
  botaoSalvar.textContent = "Salvar alterações";

  botaoCancelar.hidden = false;

  formulario.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

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
    botaoSalvar.textContent =
      campoId.value ? "Salvar alterações" : "Adicionar projeto";
  }
}


formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  limparMensagem();

  const id = campoId.value;
  const titulo = campoTitulo.value.trim();
  const descricao = campoDescricao.value.trim();
  const link = campoLink.value.trim();
  const categoria = campoCategoria.value;
  const github = campoGithub.value.trim();
  const arquivo = campoImagem.files[0];

  if (titulo === "") {
    mostrarMensagem("Digite o título do projeto.", "erro");
    return;
  }

  if (github && !/^https?:\/\/.+/i.test(github)) {
    mostrarMensagem("O link do GitHub precisa começar com http:// ou https://", "erro");
    return;
  }

  if (!/^https?:\/\/.+/i.test(link)) {
    mostrarMensagem(
      "O link precisa começar com http:// ou https://",
      "erro"
    );
    return;
  }

  if (!id && !arquivo) {
    mostrarMensagem(
      "Escolha uma imagem de apresentação para o projeto.",
      "erro"
    );
    return;
  }

  if (arquivo && !TIPOS_PERMITIDOS.includes(arquivo.type)) {
    mostrarMensagem(
      "A imagem precisa ser JPG, PNG ou WebP.",
      "erro"
    );
    return;
  }

  if (arquivo && arquivo.size > TAMANHO_MAXIMO) {
    mostrarMensagem(
      "A imagem é grande demais. O limite é 5 MB.",
      "erro"
    );
    return;
  }

  salvando(true);

  let novoCaminho = null;

  try {
    if (arquivo) {
      novoCaminho = await enviarImagem(arquivo);
    }

    if (id) {
      const antigo = projetos.find(function (p) {
        return String(p.id) === id;
      });

      const dados = {
        titulo: titulo,
        descricao: descricao,
        link: link,
        categoria: categoria,
        github_url: github || null
      };

      if (novoCaminho) {
        dados.imagem_path = novoCaminho;
      }

      const { data, error } = await db
        .from("projetos")
        .update(dados)
        .eq("id", id)
        .select();

      if (error || !data || data.length === 0) {
        throw error || new Error("Sem permissão");
      }

      if (novoCaminho && antigo) {
        await removerImagem(antigo.imagem_path);
      }

      mostrarMensagem("Projeto atualizado com sucesso.", "ok");

    } else {
      const { error } = await db
        .from("projetos")
        .insert({
          titulo: titulo,
          descricao: descricao,
          link: link,
          categoria: categoria,
          github_url: github || null,
          imagem_path: novoCaminho
        });

      if (error) throw error;

      mostrarMensagem("Projeto adicionado com sucesso.", "ok");
    }

    resetarFormulario();

    await carregarProjetos();

  } catch (erro) {
    console.error(erro);

    if (novoCaminho) {
      await removerImagem(novoCaminho);
    }

    mostrarMensagem(
      "Não foi possível salvar o projeto. Tente novamente.",
      "erro"
    );

  } finally {
    salvando(false);
  }
});


/* =========================================================
   EXCLUIR PROJETOS
   ========================================================= */

async function excluirProjeto(projeto) {
  const confirmou = window.confirm(
    'Excluir o projeto "' +
    projeto.titulo +
    '"? Essa ação não pode ser desfeita.'
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

    mostrarMensagem(
      "Não foi possível excluir o projeto.",
      "erro"
    );

    return;
  }

  await removerImagem(projeto.imagem_path);

  if (campoId.value === String(projeto.id)) {
    resetarFormulario();
  }

  mostrarMensagem("Projeto excluído com sucesso.", "ok");

  await carregarProjetos();
}


/* =========================================================
   GERENCIAMENTO DE CONTATOS
   TABELA: formleads
   ========================================================= */


/* Formata a data recebida do banco */
function formatarData(data) {
  if (!data) return "Data não informada";

  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
}


/* Define a aparência do status */
function classeStatus(status) {
  if (status === "Novo") return "novo";

  if (status === "Em andamento") return "andamento";

  if (status === "Respondido") return "respondido";

  return "";
}


/* Cria cada mensagem recebida */
function criarMensagem(contato) {
  const item = document.createElement("li");

  item.className = "item-mensagem";

  if (contato.status === "Novo") {
    item.classList.add("mensagem-nova");
  }


  // Cabeçalho
  const cabecalho = document.createElement("div");
  cabecalho.className = "mensagem-cabecalho";


  // Identificação
  const identificacao = document.createElement("div");
  identificacao.className = "mensagem-identificacao";

  const nome = document.createElement("strong");
  nome.textContent = contato.nome;

  const email = document.createElement("span");
  email.textContent = contato.email;

  const data = document.createElement("span");
  data.textContent = formatarData(contato.criado_em);

  identificacao.append(nome, email, data);


  // Status visual
  const status = document.createElement("span");
  status.className =
    "mensagem-status " + classeStatus(contato.status);

  status.textContent = contato.status;


  cabecalho.append(identificacao, status);


  // Área de detalhes
  const detalhes = document.createElement("details");
  detalhes.className = "mensagem-detalhes";

  const resumo = document.createElement("summary");
  resumo.textContent = "Visualizar mensagem completa";

  const conteudo = document.createElement("div");
  conteudo.style.marginTop = "14px";


  const telefone = document.createElement("p");
  telefone.textContent =
    "WhatsApp: " + (contato.zap || "Não informado");


  const descricaoTitulo = document.createElement("strong");
  descricaoTitulo.textContent = "Mensagem:";

  const descricao = document.createElement("p");
  descricao.className = "mensagem-texto";
  descricao.textContent = contato.descricao;


  const identificador = document.createElement("p");
  identificador.textContent = "Código da mensagem: " + contato.id;


  conteudo.append(
    telefone,
    descricaoTitulo,
    descricao,
    identificador
  );

  detalhes.append(resumo, conteudo);


  // Ações
  const acoes = document.createElement("div");
  acoes.className = "mensagem-acoes";


  // Seleção de status
  const seletorStatus = document.createElement("select");

  seletorStatus.setAttribute(
    "aria-label",
    "Alterar status da mensagem de " + contato.nome
  );

  const opcoes = [
    "Novo",
    "Em andamento",
    "Respondido"
  ];

  opcoes.forEach(function (opcao) {
    const elemento = document.createElement("option");

    elemento.value = opcao;
    elemento.textContent = opcao;

    if (contato.status === opcao) {
      elemento.selected = true;
    }

    seletorStatus.appendChild(elemento);
  });


  seletorStatus.addEventListener("change", async function () {
    const novoStatus = seletorStatus.value;

    seletorStatus.disabled = true;

    try {
      const { data, error } = await db
        .from("formleads")
        .update({ status: novoStatus })
        .eq("id", contato.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("A atualização não foi autorizada.");
      }

      await carregarMensagens();

    } catch (erro) {
      console.error("Erro ao atualizar status:", erro);

      alert(
        "Não foi possível atualizar o status da mensagem."
      );

      seletorStatus.disabled = false;
      seletorStatus.value = contato.status;
    }
  });


  // Botão excluir
  const botaoExcluir = document.createElement("button");

  botaoExcluir.type = "button";
  botaoExcluir.className =
    "botao botao-perigo botao-pequeno";

  botaoExcluir.textContent = "Excluir";

  botaoExcluir.addEventListener("click", function () {
    excluirMensagem(contato);
  });


  acoes.append(seletorStatus, botaoExcluir);

  item.append(cabecalho, detalhes, acoes);

  return item;
}


/* Busca as mensagens no Supabase */
async function carregarMensagens() {
  mensagensEstado.hidden = false;
  mensagensEstado.textContent = "Carregando mensagens...";

  mensagensContador.textContent = "Consultando banco de dados...";

  listaMensagens.replaceChildren();

  botaoAtualizarMensagens.disabled = true;

  try {
    const { data, error } = await db
      .from("formleads")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) throw error;

    const contatos = data || [];

    const quantidadeNovas = contatos.filter(function (contato) {
      return contato.status === "Novo";
    }).length;

    mensagensContador.textContent =
      contatos.length + " mensagem(ns) recebida(s) · " +
      quantidadeNovas + " nova(s)";


    if (contatos.length === 0) {
      mensagensEstado.textContent =
        "Nenhuma mensagem recebida ainda.";

      return;
    }


    mensagensEstado.hidden = true;

    contatos.forEach(function (contato) {
      listaMensagens.appendChild(criarMensagem(contato));
    });

  } catch (erro) {
    console.error("Erro ao carregar mensagens:", erro);

    mensagensEstado.textContent =
      "Não foi possível carregar as mensagens. Verifique as permissões da tabela formleads no Supabase.";

    mensagensContador.textContent =
      "Erro ao consultar mensagens.";

  } finally {
    botaoAtualizarMensagens.disabled = false;
  }
}


/* Atualização manual */
botaoAtualizarMensagens.addEventListener("click", function () {
  carregarMensagens();
});


/* Excluir uma mensagem */
async function excluirMensagem(contato) {
  const confirmou = window.confirm(
    "Deseja realmente excluir a mensagem enviada por " +
    contato.nome +
    "? Essa ação não pode ser desfeita."
  );

  if (!confirmou) return;

  try {
    const { data, error } = await db
      .from("formleads")
      .delete()
      .eq("id", contato.id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error("A exclusão não foi autorizada.");
    }

    await carregarMensagens();

  } catch (erro) {
    console.error("Erro ao excluir mensagem:", erro);

    alert(
      "Não foi possível excluir a mensagem. Verifique as permissões no Supabase."
    );
  }
}


/* =========================================================
   INICIAR PAINEL
   ========================================================= */

iniciar();
