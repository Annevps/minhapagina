/* Animações progressivas acessíveis do portfólio */
(() => {
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targets = document.querySelectorAll(".av-reveal, .scroll-reveal");
  if (!targets.length) return;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    targets.forEach(item => item.classList.add("is-visible"));
    return;
  }
  document.documentElement.classList.add("av-js");
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
  targets.forEach(item => observer.observe(item));
})();