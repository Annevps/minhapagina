/* Navegação compartilhada entre as páginas públicas */
(() => {
  const mount = document.getElementById("site-header");
  if (!mount) return;
  const activePage = mount.dataset.page || "";
  const links = [
    { id: "home", label: "Início", href: "index.html" },
    { id: "about", label: "Quem sou eu", href: "sobre.html" },
    { id: "portfolio", label: "Portfólio", href: "portfolio.html" },
    { id: "contact", label: "Contato", href: "contato.html" }
  ];
  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <nav class="site-nav" aria-label="Navegação principal">
      <a class="site-brand" href="index.html" aria-label="Anne Vitória — página inicial">
        <span class="site-brand-mark" aria-hidden="true">AV</span>
        <span class="site-brand-name">Anne Vitória</span>
      </a>
      <button class="site-menu-toggle" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="site-menu">
        <i data-lucide="menu" aria-hidden="true"></i>
      </button>
      <ul class="site-menu" id="site-menu">
        ${links.map(link => `<li><a href="${link.href}" ${link.id === activePage ? 'aria-current="page"' : ""}>${link.label}</a></li>`).join("")}
      </ul>
      <a class="site-admin" href="login.html" aria-label="Acessar painel administrativo" title="Painel administrativo">
        <i data-lucide="lock-keyhole" aria-hidden="true"></i>
      </a>
    </nav>`;
  mount.replaceWith(header);
  const toggle = header.querySelector(".site-menu-toggle");
  const menu = header.querySelector(".site-menu");
  toggle.addEventListener("click", () => {
    const opened = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!opened));
    toggle.setAttribute("aria-label", opened ? "Abrir menu" : "Fechar menu");
    menu.classList.toggle("is-open", !opened);
    const icon = toggle.querySelector("i");
    if (icon) icon.setAttribute("data-lucide", opened ? "menu" : "x");
    if (window.lucide) window.lucide.createIcons();
  });
  document.addEventListener("click", event => {
    if (!header.contains(event.target) && menu.classList.contains("is-open")) {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menu");
      const icon = toggle.querySelector("i");
      if (icon) icon.setAttribute("data-lucide", "menu");
      if (window.lucide) window.lucide.createIcons();
    }
  });
  if (window.lucide) window.lucide.createIcons();
  else window.addEventListener("load", () => window.lucide?.createIcons(), { once: true });
})();
