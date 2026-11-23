/* Portfólio público — mantém os campos e a integração existentes do Supabase. */
(() => {
  const $ = (id) => document.getElementById(id);
  const gradeDestaques = $("grade-destaques");
  const gradeProjetos = $("grade-projetos");
  const estado = $("estado");
  const estadoDestaques = $("estado-destaques");
  const filtros = $("filtros-projetos");
  const pesquisa = $("pesquisa-projetos");
  const contador = $("contador-resultados");
  const vazio = $("sem-resultados");
  const dialogo = $("detalhes-projeto");

  let projetos = [];
  let categoriaAtiva = "Todos";
  let termo = "";
  let modo = "client";
  let botoesFiltro = [];
  let motionReady = false;
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function prepararMovimento() {
    if (reduceMotion) return;
    document.body.classList.add("js-motion");
    const observador = "IntersectionObserver" in window
      ? new IntersectionObserver((entradas) => entradas.forEach((entrada) => {
          if (entrada.isIntersecting) {
            entrada.target.classList.add("is-visible");
            observador.unobserve(entrada.target);
          }
        }), { threshold: 0.12 })
      : null;
    document.querySelectorAll(".portfolio-explorer,.portfolio-closing").forEach((secao) => {
      if (observador) observador.observe(secao);
      else secao.classList.add("is-visible");
    });
    const visual = $("portfolio-hero-visual");
    const stack = $("hero-image-stack");
    if (visual && stack && window.matchMedia("(pointer:fine)").matches) {
      visual.addEventListener("pointermove", (evento) => {
        const r = visual.getBoundingClientRect();
        const x = (evento.clientX - r.left) / r.width - .5;
        const y = (evento.clientY - r.top) / r.height - .5;
        stack.style.transform = "rotateY(" + (x * 5).toFixed(2) + "deg) rotateX(" + (-y * 4).toFixed(2) + "deg)";
      });
      visual.addEventListener("pointerleave", () => { stack.style.transform = ""; });
    }
  }

  function contarAte(elemento, valor) {
    if (!elemento) return;
    const alvo = Number(valor) || 0;
    if (reduceMotion) { elemento.textContent = alvo; return; }
    const inicio = performance.now();
    const duracao = 850;
    const animar = (agora) => {
      const progresso = Math.min((agora - inicio) / duracao, 1);
      const suavizado = 1 - Math.pow(1 - progresso, 3);
      elemento.textContent = Math.round(alvo * suavizado);
      if (progresso < 1) requestAnimationFrame(animar);
    };
    requestAnimationFrame(animar);
  }

  function renderizarColagemHero() {
    const stack = $("hero-image-stack");
    if (!stack) return;
    const comImagem = projetos.filter(p => p.imagem_path && urlImagem(p.imagem_path)).slice(0, 3);
    if (!comImagem.length) return;
    stack.replaceChildren();
    const classes = ["hero-shot hero-shot-back", "hero-shot hero-shot-main", "hero-shot hero-shot-front"];
    comImagem.forEach((projeto, indice) => {
      const quadro = elemento("div", classes[indice] || "hero-shot");
      const imagem = elemento("img");
      imagem.src = urlImagem(projeto.imagem_path);
      imagem.alt = "Prévia real do projeto " + (projeto.titulo || "");
      imagem.loading = "lazy";
      imagem.decoding = "async";
      imagem.addEventListener("error", () => quadro.remove(), { once: true });
      quadro.append(imagem, elemento("span", "hero-shot-label", projeto.titulo || "Projeto"));
      stack.appendChild(quadro);
    });
  }

  const normalizar = (valor) => String(valor || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

  function elemento(tag, classe, texto) {
    const node = document.createElement(tag);
    if (classe) node.className = classe;
    if (texto !== undefined) node.textContent = texto;
    return node;
  }

  function urlSegura(valor) {
    try {
      const url = new URL(valor);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  function criarLink(texto, destino, classe, icone) {
    if (!destino) return null;
    const a = elemento("a", classe, texto);
    a.href = destino;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    if (icone) {
      const i = elemento("i");
      i.setAttribute("data-lucide", icone);
      i.setAttribute("aria-hidden", "true");
      a.prepend(i);
    }
    return a;
  }

  function criarImagem(projeto) {
    const figura = elemento("div", "project-image-frame");
    const src = urlImagem(projeto.imagem_path);
    if (src) {
      const img = elemento("img");
      img.src = src;
      img.alt = "Imagem do projeto " + (projeto.titulo || "");
      img.loading = "lazy";
      img.decoding = "async";
      img.addEventListener("error", () => {
        img.remove();
        figura.classList.add("image-fallback");
        figura.append(elemento("span", "image-fallback-mark", "AV"));
      }, { once: true });
      figura.appendChild(img);
    } else {
      figura.classList.add("image-fallback");
      figura.append(elemento("span", "image-fallback-mark", "AV"));
    }
    return figura;
  }

  function atualizarIndicadores() {
    const categorias = new Set(projetos.map(p => (p.categoria || "Outros").trim()).filter(Boolean));
    contarAte($("stat-total"), projetos.length);
    contarAte($("stat-categorias"), categorias.size);
    contarAte($("stat-codigo"), projetos.filter(p => urlSegura(p.github_url)).length);
  }

  function abrirDetalhes(projeto) {
    $("detalhe-titulo").textContent = projeto.titulo || "Projeto";
    $("detalhe-categoria").textContent = projeto.categoria || "Outros";
    $("detalhe-descricao").textContent = projeto.descricao || "Não há descrição cadastrada para este projeto.";
    $("detalhe-imagem").replaceChildren(criarImagem(projeto));

    const informacoes = $("detalhe-informacoes");
    informacoes.replaceChildren();
    const itens = [
      ["Categoria", projeto.categoria || "Outros"],
      ["Código-fonte", urlSegura(projeto.github_url) ? "Repositório disponível" : "Não informado"],
      ["Visualização", urlSegura(projeto.link) ? "Link do projeto disponível" : "Não informado"]
    ];
    itens.forEach(([rotulo, valor]) => {
      const item = elemento("div", "dialog-info-item");
      item.append(elemento("span", "", rotulo), elemento("strong", "", valor));
      informacoes.appendChild(item);
    });

    const acoes = $("detalhe-acoes");
    acoes.replaceChildren();
    const ver = criarLink("Visualizar projeto", urlSegura(projeto.link), "portfolio-button portfolio-button-primary", "external-link");
    const codigo = criarLink("Acessar código", urlSegura(projeto.github_url), "portfolio-button portfolio-button-secondary", "github");
    if (ver) acoes.appendChild(ver);
    if (codigo) acoes.appendChild(codigo);
    if (!ver && !codigo) acoes.appendChild(elemento("span", "portfolio-link-unavailable", "Nenhum link externo cadastrado."));

    if (typeof dialogo.showModal === "function") dialogo.showModal();
    else dialogo.setAttribute("open", "");
    if (window.lucide) window.lucide.createIcons();
  }

  function criarCard(projeto, destaque = false) {
    const card = elemento("li", "portfolio-card");
    const capa = elemento("div", "portfolio-card-cover");
    capa.appendChild(criarImagem(projeto));
    const selo = elemento("span", "portfolio-card-category", projeto.categoria || "Outros");
    capa.appendChild(selo);
    if (destaque) capa.appendChild(elemento("span", "portfolio-card-featured-label", "DESTAQUE"));

    const corpo = elemento("div", "portfolio-card-body");
    const meta = elemento("div", "portfolio-card-meta");
    meta.append(elemento("span", "portfolio-card-dot", "AV"), elemento("span", "portfolio-card-type", modo === "client" ? "PROJETO" : "DADOS DO CADASTRO"));

    const titulo = elemento("h3", "", projeto.titulo || "Projeto sem título");
    const descricaoTexto = modo === "client"
      ? (projeto.descricao || "Descrição não informada no cadastro.")
      : (urlSegura(projeto.github_url) ? "Este projeto possui um repositório de código cadastrado." : "Não há repositório de código cadastrado para este projeto.");
    const descricao = elemento("p", "portfolio-card-description", descricaoTexto);

    const tags = elemento("div", "portfolio-card-tags");
    tags.appendChild(elemento("span", "project-tag", projeto.categoria || "Outros"));
    if (modo === "technical") {
      tags.appendChild(elemento("span", "project-tag", urlSegura(projeto.github_url) ? "GitHub disponível" : "GitHub não informado"));
    }

    const acoes = elemento("div", "portfolio-card-actions");
    const visualizar = criarLink("Ver projeto", urlSegura(projeto.link), "portfolio-button portfolio-button-primary", "arrow-up-right");
    const detalhes = elemento("button", "portfolio-button portfolio-button-secondary", "Detalhes");
    detalhes.type = "button";
    detalhes.addEventListener("click", () => abrirDetalhes(projeto));
    if (visualizar) acoes.appendChild(visualizar);
    acoes.appendChild(detalhes);
    const github = criarLink("Código", urlSegura(projeto.github_url), "portfolio-button portfolio-button-quiet", "github");
    if (github) acoes.appendChild(github);

    corpo.append(meta, titulo, descricao, tags, acoes);
    card.append(capa, corpo);
    return card;
  }

  function corresponde(projeto) {
    if (!termo) return true;
    const campos = [projeto.titulo, projeto.descricao, projeto.categoria, projeto.link, projeto.github_url];
    return normalizar(campos.join(" ")).includes(normalizar(termo));
  }

  function listaFiltrada() {
    return projetos.filter(projeto => {
      const categoria = (projeto.categoria || "Outros").trim();
      return (categoriaAtiva === "Todos" || categoria === categoriaAtiva) && corresponde(projeto);
    });
  }

  function renderizarDestaques(lista) {
    const destaques = lista.filter(p => p.destaque === true).slice(0, 3);
    gradeDestaques.replaceChildren();
    estadoDestaques.hidden = destaques.length > 0;
    estadoDestaques.textContent = destaques.length ? "" : "Os projetos selecionados como destaque aparecerão aqui.";
    destaques.forEach(projeto => gradeDestaques.appendChild(criarCard(projeto, true)));
    gradeDestaques.closest(".portfolio-featured-section").hidden = destaques.length === 0;
  }

  function renderizar() {
    const lista = listaFiltrada();
    renderizarDestaques(lista);
    gradeProjetos.replaceChildren();
    lista.forEach(projeto => gradeProjetos.appendChild(criarCard(projeto)));
    const total = lista.length;
    contador.textContent = total + (total === 1 ? " projeto encontrado" : " projetos encontrados");
    estado.hidden = projetos.length > 0;
    vazio.hidden = total > 0 || projetos.length === 0;
    gradeProjetos.hidden = total === 0;
    if (!projetos.length) {
      estado.textContent = "Ainda não há projetos cadastrados. Volte em breve para conhecer meus trabalhos.";
      contador.textContent = "Nenhum projeto cadastrado";
    }
    if (window.lucide) window.lucide.createIcons();
  }

  function criarFiltros() {
    const categorias = [...new Set(projetos.map(p => (p.categoria || "Outros").trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
    filtros.replaceChildren();
    ["Todos", ...categorias].forEach((categoria, indice) => {
      const botao = elemento("button", "filtro-projeto" + (indice === 0 ? " ativo" : ""), categoria);
      botao.type = "button";
      botao.dataset.filtro = categoria;
      botao.setAttribute("aria-pressed", String(indice === 0));
      botao.addEventListener("click", () => {
        categoriaAtiva = categoria;
        botoesFiltro.forEach(item => {
          const ativo = item === botao;
          item.classList.toggle("ativo", ativo);
          item.setAttribute("aria-pressed", String(ativo));
        });
        renderizar();
      });
      filtros.appendChild(botao);
    });
    botoesFiltro = [...filtros.querySelectorAll(".filtro-projeto")];
  }

  function configurarInteracoes() {
    pesquisa.addEventListener("input", () => {
      termo = pesquisa.value.trim();
      renderizar();
    });

    document.querySelectorAll(".mode-button").forEach(botao => {
      botao.addEventListener("click", () => {
        modo = botao.dataset.mode;
        document.querySelectorAll(".mode-button").forEach(item => {
          const ativo = item === botao;
          item.classList.toggle("active", ativo);
          item.setAttribute("aria-pressed", String(ativo));
        });
        $("mode-description").textContent = modo === "client"
          ? "Veja o propósito e a descrição de cada projeto."
          : "Consulte a categoria e a disponibilidade de links de código cadastrados.";
        renderizar();
      });
    });

    $("limpar-filtros").addEventListener("click", () => {
      categoriaAtiva = "Todos";
      termo = "";
      pesquisa.value = "";
      botoesFiltro.forEach((botao, indice) => {
        botao.classList.toggle("ativo", indice === 0);
        botao.setAttribute("aria-pressed", String(indice === 0));
      });
      renderizar();
      pesquisa.focus();
    });

    $("fechar-detalhes").addEventListener("click", () => dialogo.close());
    dialogo.addEventListener("click", evento => {
      if (evento.target === dialogo) dialogo.close();
    });
    dialogo.addEventListener("cancel", () => dialogo.close());
  }

  async function carregar() {
    estado.hidden = false;
    estado.textContent = "Carregando projetos...";
    estadoDestaques.textContent = "Carregando destaques...";
    try {
      const { data, error } = await db.from("projetos")
        .select("id,titulo,descricao,link,imagem_path,categoria,github_url,destaque,criado_em")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      projetos = data || [];
      atualizarIndicadores();
      renderizarColagemHero();
      criarFiltros();
      configurarInteracoes();
      renderizar();
      if (!motionReady) { prepararMovimento(); motionReady = true; }
    } catch (erro) {
      console.error("Erro ao carregar projetos:", erro);
      estado.textContent = "Não foi possível carregar os projetos. Verifique a conexão e tente novamente.";
      estado.hidden = false;
      estadoDestaques.hidden = true;
      contador.textContent = "Falha ao carregar os projetos";
    }
  }

  carregar();
})();