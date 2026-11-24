document.addEventListener("DOMContentLoaded", () => {
  // Configuração do observador de interseção
  const observerOptions = {
    root: null, // Usa a viewport do navegador
    rootMargin: '0px 0px -50px 0px', // Dispara um pouco antes de entrar totalmente na tela
    threshold: 0.1 // 10% do card precisa estar visível
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Adiciona a classe que torna o card visível (definida no CSS)
        entry.target.classList.add('visible');
        
        // Para de observar este card após ele aparecer uma vez
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Seleciona todos os cards que têm a classe 'reveal' e começa a observar
  const cards = document.querySelectorAll('.project-card.reveal');
  
  if (cards.length > 0) {
    cards.forEach(card => {
      observer.observe(card);
    });
  }
});
