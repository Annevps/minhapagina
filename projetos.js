/* =========================================================
   PORTFÓLIO PÚBLICO — PROJETOS DO SUPABASE
   Os projetos em destaque são escolhidos no painel administrativo.
   ========================================================= */

const gradeDestaques = document.getElementById("grade-destaques");
const estadoDestaques = document.getElementById("estado-destaques");
const gradeProjetos = document.getElementById("grade-projetos");
const estadoProjetos = document.getElementById("estado");
const botoesFiltro = document.querySelectorAll(".filtro-projeto");

let projetosPublicos = [];
let filtroAtual = "Todos";

function criarElemento(tag, classe, texto) {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

function urlHttpValida(valor) {
  try {
    const url = new URL(valor);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function criarCardProjeto(projeto, destaque = false) {
  const card = criarElemento("li", destaque ? "portfolio-card portfolio-card-destaque" : "portfolio-card");

  const imagemLink = criarElemento("a", "portfolio-card-imagem");
  const linkProjeto = urlHttpValida(projeto.link);
  if (linkProjeto) {
    imagemLink.href = linkProjeto;
    imagemLink.target = "_blank";
    imagemLink.rel = "noopener noreferrer";
    imagemLink.setAttribute("aria-label", "Abrir projeto " + (projeto.titulo || ""));
  }

  const imagem = criarElemento("img");
  imagem.src = urlImagem(projeto.imagem_path);
  imagem.alt = "Imagem de apresentação do projeto " + (projeto.titulo || "");
  imagem.loading = "lazy";
  imagem.decoding = "async";
  imagemLink.appendChild(imagem);

  const numero = criarElemento("span", "portfolio-card-numero", destaque ? "EM DESTAQUE" : (projeto.categoria || "PROJETO"));
  imagemLink.appendChild(numero);

  const conteudo = criarElemento("div", "portfolio-card-conteudo");
  const meta = criarElemento("div", "portfolio-card-meta");
  meta.appendChild(criarElemento("span", "portfolio-card-categoria", projeto.categoria || "Outros"));
  if (destaque) meta.appendChild(criarElemento("span", "portfolio-card-selo", "Projeto selecionado"));

  const titulo = criarElemento("h3", "", projeto.titulo || "Projeto sem título");
  const descricao = criarElemento("p", "", projeto.descricao || "Projeto desenvolvido durante minha jornada de aprendizado.");

  const rodape = criarElemento("div", "portfolio-card-rodape");
  const acoes = criarElemento("div", "portfolio-card-acoes");

  if (linkProjeto) {
    const acessar = criarElemento("a", "portfolio-link-principal", "Conhecer projeto");
    acessar.href = linkProjeto;
    acessar.target = "_blank";
    acessar.rel = "noopener noreferrer";
    const icone = criarElemento("i");
    icone.setAttribute("data-lucide", "arrow-up-right");
    acessar.appendChild(icone);
    acoes.appendChild(acessar);
  }

  const github = urlHttpValida(projeto.github_url);
  if (github) {
    const codigo = criarElemento("a", "portfolio-link-codigo", "Código-fonte");
    codigo.href = github;
    codigo.target = "_blank";
    codigo.rel = "noopener noreferrer";
    const icone = criarElemento("i");
    icone.setAttribute("data-lucide", "github");
    codigo.prepend(icone);
    acoes.appendChild(codigo);
  }

  rodape.appendChild(acoes);
  conteudo.append(meta, titulo, descricao, rodape);
  card.append(imagemLink, conteudo);
  return card;
}

function projetosDoFiltro() {
  return filtroAtual === "Todos"
    ? projetosPublicos
    : projetosPublicos.filter(projeto => (projeto.categoria || "Outros") === filtroAtual);
}

function renderizarProjetos() {
  const filtrados = projetosDoFiltro();
  const destaques = filtrados.filter(projeto => projeto.destaque === true);
  const demais = filtrados.filter(projeto => projeto.destaque !== true);

  gradeDestaques.replaceChildren();
  gradeProjetos.replaceChildren();

  if (destaques.length) {
    estadoDestaques.hidden = true;
    destaques.forEach(projeto => gradeDestaques.appendChild(criarCardProjeto(projeto, true)));
  } else {
    estadoDestaques.textContent = filtroAtual === "Todos"
      ? "Ainda não há projetos selecionados para destaque."
      : "Nenhum projeto em destaque nesta categoria.";
    estadoDestaques.hidden = false;
  }

  if (demais.length) {
    estadoProjetos.hidden = true;
    demais.forEach(projeto => gradeProjetos.appendChild(criarCardProjeto(projeto)));
  } else {
    estadoProjetos.textContent = filtrados.length
      ? "Todos os projetos desta categoria estão na seleção de destaque."
      : (projetosPublicos.length ? "Nenhum projeto encontrado nesta categoria." : "Nenhum projeto cadastrado no momento.");
    estadoProjetos.hidden = false;
  }

  if (window.lucide) window.lucide.createIcons();
}

botoesFiltro.forEach(botao => {
  botao.addEventListener("click", () => {
    filtroAtual = botao.dataset.filtro;
    botoesFiltro.forEach(item => {
      const ativo = item === botao;
      item.classList.toggle("ativo", ativo);
      item.setAttribute("aria-pressed", String(ativo));
    });
    renderizarProjetos();
  });
});

async function carregarProjetosPublicos() {
  estadoDestaques.textContent = "Carregando projetos em destaque...";
  estadoProjetos.textContent = "Carregando projetos...";
  estadoDestaques.hidden = false;
  estadoProjetos.hidden = false;

  try {
    const { data, error } = await db
      .from("projetos")
      .select("id,titulo,descricao,link,imagem_path,categoria,github_url,destaque,criado_em")
      .order("criado_em", { ascending: false });

    if (error) throw error;

    projetosPublicos = data || [];
    renderizarProjetos();
  } catch (erro) {
    console.error("Erro ao carregar projetos:", erro);
    estadoDestaques.textContent = "Não foi possível carregar os projetos.";
    estadoProjetos.textContent = "Verifique a conexão com o banco de dados e tente novamente.";
    estadoDestaques.hidden = false;
    estadoProjetos.hidden = false;
  }
}

carregarProjetosPublicos();
