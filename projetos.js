/* =========================================================
   PORTFÓLIO PÚBLICO — DADOS REAIS DO SUPABASE
   Compatível com a tabela atual: projetos.
   Não depende de campos de tecnologia que ainda não existem.
   ========================================================= */
const gradeDestaques = document.getElementById("grade-destaques");
const estadoDestaques = document.getElementById("estado-destaques");
const gradeProjetos = document.getElementById("grade-projetos");
const estadoProjetos = document.getElementById("estado");
const areaFiltros = document.getElementById("filtros-projetos");
const campoPesquisa = document.getElementById("pesquisa-projetos");
const contadorResultados = document.getElementById("contador-resultados");
const mensagemVazia = document.getElementById("sem-resultados");
const secaoDestaques = document.querySelector(".portfolio-featured-section");

let projetosPublicos = [];
let filtroAtual = "Todos";
let termoPesquisa = "";
let modoVisualizacao = "grid";
let botoesFiltro = [];

const observadorRevelacao = "IntersectionObserver" in window
  ? new IntersectionObserver((entradas, observador) => {
      entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("visivel");
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" })
  : null;

function animarEntrada(elemento) {
  elemento.classList.add("portfolio-reveal");
  if (observadorRevelacao) observadorRevelacao.observe(elemento);
  else elemento.classList.add("visivel");
}

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

function atualizarIndicadores() {
  const categorias = new Set(projetosPublicos.map(p => (p.categoria || "Outros").trim()).filter(Boolean));
  document.getElementById("stat-total").textContent = projetosPublicos.length;
  document.getElementById("stat-categorias").textContent = categorias.size;
  document.getElementById("stat-codigo").textContent = projetosPublicos.filter(p => urlHttpValida(p.github_url)).length;
}

function criarCardProjeto(projeto, destaque = false) {
  const card = criarElemento("li", "portfolio-card" + (destaque ? " portfolio-card-featured" : ""));
  const linkProjeto = urlHttpValida(projeto.link);
  const imagem = criarElemento("img");
  const caminhoImagem = urlImagem(projeto.imagem_path);
  if (caminhoImagem) imagem.src = caminhoImagem;
  imagem.alt = "Capa do projeto " + (projeto.titulo || "");
  imagem.loading = "lazy";
  imagem.decoding = "async";

  const areaImagem = criarElemento(linkProjeto ? "a" : "div", "portfolio-card-cover");
  if (linkProjeto) {
    areaImagem.href = linkProjeto;
    areaImagem.target = "_blank";
    areaImagem.rel = "noopener noreferrer";
    areaImagem.setAttribute("aria-label", "Abrir projeto " + (projeto.titulo || ""));
  }
  areaImagem.appendChild(imagem);

  const categoria = criarElemento("span", "portfolio-card-category", projeto.categoria || "Outros");
  areaImagem.appendChild(categoria);
  if (destaque) areaImagem.appendChild(criarElemento("span", "portfolio-card-featured-label", "EM DESTAQUE"));

  const corpo = criarElemento("div", "portfolio-card-body");
  const topo = criarElemento("div", "portfolio-card-meta");
  topo.appendChild(criarElemento("span", "portfolio-card-type", destaque ? "Projeto selecionado" : "Projeto"));
  topo.appendChild(criarElemento("span", "portfolio-card-dot", "•"));
  topo.appendChild(criarElemento("span", "portfolio-card-category-text", projeto.categoria || "Outros"));

  const titulo = criarElemento("h3", "", projeto.titulo || "Projeto sem título");
  const descricao = criarElemento("p", "portfolio-card-description", projeto.descricao || "Descrição não informada.");

  const acoes = criarElemento("div", "portfolio-card-actions");
  if (linkProjeto) {
    const acessar = criarElemento("a", "portfolio-button portfolio-button-primary", "Visualizar projeto");
    acessar.href = linkProjeto;
    acessar.target = "_blank";
    acessar.rel = "noopener noreferrer";
    const icon = criarElemento("i");
    icon.setAttribute("data-lucide", "arrow-up-right");
    acessar.appendChild(icon);
    acoes.appendChild(acessar);
  } else {
    acoes.appendChild(criarElemento("span", "portfolio-link-unavailable", "Link de visualização indisponível"));
  }

  const github = urlHttpValida(projeto.github_url);
  if (github) {
    const codigo = criarElemento("a", "portfolio-button portfolio-button-secondary", "Código");
    codigo.href = github;
    codigo.target = "_blank";
    codigo.rel = "noopener noreferrer";
    const icon = criarElemento("i");
    icon.setAttribute("data-lucide", "github");
    codigo.prepend(icon);
    acoes.appendChild(codigo);
  }

  corpo.append(topo, titulo, descricao, acoes);
  card.append(areaImagem, corpo);
  animarEntrada(card);
  return card;
}

function correspondePesquisa(projeto) {
  if (!termoPesquisa) return true;
  const texto = [projeto.titulo, projeto.descricao, projeto.categoria]
    .filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
  return texto.includes(termoPesquisa);
}

function projetosFiltrados() {
  return projetosPublicos.filter(projeto => {
    const categoria = (projeto.categoria || "Outros").trim();
    const categoriaOk = filtroAtual === "Todos" || categoria === filtroAtual;
    return categoriaOk && correspondePesquisa(projeto);
  });
}

function renderizarProjetos() {
  const filtrados = projetosFiltrados();
  const destaques = filtrados.filter(p => p.destaque === true);
  const demais = filtrados.filter(p => p.destaque !== true);

  secaoDestaques.hidden = destaques.length === 0;
  gradeDestaques.replaceChildren();
  gradeProjetos.replaceChildren();

  destaques.forEach(projeto => gradeDestaques.appendChild(criarCardProjeto(projeto, true)));
  demais.forEach(projeto => gradeProjetos.appendChild(criarCardProjeto(projeto)));

  estadoDestaques.hidden = true;
  estadoProjetos.hidden = true;
  mensagemVazia.hidden = filtrados.length !== 0 || projetosPublicos.length === 0;
  gradeProjetos.hidden = filtrados.length === 0;
  contadorResultados.textContent = filtrados.length + (filtrados.length === 1 ? " projeto encontrado" : " projetos encontrados");

  if (projetosPublicos.length === 0) {
    estadoProjetos.textContent = "Ainda não há projetos cadastrados. Volte em breve para conhecer meus trabalhos.";
    estadoProjetos.hidden = false;
    gradeProjetos.hidden = true;
    mensagemVazia.hidden = true;
    contadorResultados.textContent = "Nenhum projeto cadastrado";
  }

  if (window.lucide) window.lucide.createIcons();
}

function criarFiltrosCategorias() {
  const categorias = [...new Set(
    projetosPublicos.map(p => (p.categoria || "Outros").trim()).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "pt-BR"));

  areaFiltros.replaceChildren();
  ["Todos", ...categorias].forEach((categoria, indice) => {
    const botao = criarElemento("button", "filtro-projeto" + (indice === 0 ? " ativo" : ""), categoria);
    botao.type = "button";
    botao.dataset.filtro = categoria;
    botao.setAttribute("aria-pressed", String(indice === 0));
    botao.addEventListener("click", () => {
      filtroAtual = categoria;
      atualizarEstadoFiltros(botao);
      renderizarProjetos();
    });
    areaFiltros.appendChild(botao);
  });
  botoesFiltro = [...areaFiltros.querySelectorAll(".filtro-projeto")];
}

function atualizarEstadoFiltros(botaoAtivo) {
  botoesFiltro.forEach(botao => {
    const ativo = botao === botaoAtivo;
    botao.classList.toggle("ativo", ativo);
    botao.setAttribute("aria-pressed", String(ativo));
  });
}

function configurarExploracao() {
  campoPesquisa.addEventListener("input", () => {
    termoPesquisa = campoPesquisa.value.trim().toLocaleLowerCase("pt-BR");
    renderizarProjetos();
  });

  document.querySelectorAll(".view-button").forEach(botao => {
    botao.addEventListener("click", () => {
      modoVisualizacao = botao.dataset.view;
      document.querySelectorAll(".view-button").forEach(item => {
        const ativo = item === botao;
        item.classList.toggle("active", ativo);
        item.setAttribute("aria-pressed", String(ativo));
      });
      gradeProjetos.classList.toggle("is-list-view", modoVisualizacao === "list");
      gradeDestaques.classList.toggle("is-list-view", modoVisualizacao === "list");
    });
  });

  document.getElementById("limpar-filtros").addEventListener("click", () => {
    filtroAtual = "Todos";
    termoPesquisa = "";
    campoPesquisa.value = "";
    atualizarEstadoFiltros(botoesFiltro[0]);
    renderizarProjetos();
    campoPesquisa.focus();
  });
}

async function carregarProjetosPublicos() {
  estadoProjetos.textContent = "Carregando projetos...";
  estadoProjetos.hidden = false;
  try {
    const { data, error } = await db
      .from("projetos")
      .select("id,titulo,descricao,link,imagem_path,categoria,github_url,destaque,criado_em")
      .order("criado_em", { ascending: false });
    if (error) throw error;

    projetosPublicos = data || [];
    atualizarIndicadores();
    criarFiltrosCategorias();
    configurarExploracao();
    renderizarProjetos();
  } catch (erro) {
    console.error("Erro ao carregar projetos:", erro);
    estadoProjetos.textContent = "Não foi possível carregar os projetos. Verifique a conexão e tente novamente.";
    estadoProjetos.hidden = false;
    contadorResultados.textContent = "Falha ao carregar";
  }
}

carregarProjetosPublicos();
