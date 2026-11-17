/* Projetos públicos: conteúdo real carregado do Supabase. */
const gradeProjetos=document.getElementById("grade-projetos");
const estadoProjetos=document.getElementById("estado");
const botoesFiltro=document.querySelectorAll(".filtro-projeto");
let projetosPublicos=[];
let filtroAtual="Todos";
function criarElemento(tag,classe,texto){
 const el=document.createElement(tag);
 if(classe)el.className=classe;
 if(texto!==undefined)el.textContent=texto;
 return el;
}
function urlHttpValida(valor){
 try{const u=new URL(valor);return ["http:","https:"].includes(u.protocol)?u.href:"";}
 catch{return "";}
}
function criarCardProjeto(projeto){
 const card=criarElemento("li","card-projeto");
 const img=criarElemento("img");
 img.src=urlImagem(projeto.imagem_path);
 img.alt="Imagem de apresentação do projeto "+(projeto.titulo||"");
 img.loading="lazy";img.decoding="async";
 const corpo=criarElemento("div","card-corpo");
 corpo.append(
  criarElemento("span","projeto-categoria",projeto.categoria||"Outros"),
  criarElemento("h2","",projeto.titulo||"Projeto sem título"),
  criarElemento("p","",projeto.descricao||"Projeto desenvolvido durante minha jornada de aprendizado.")
 );
 const acoes=criarElemento("div","projeto-acoes");
 const link=urlHttpValida(projeto.link);
 if(link){
  const a=criarElemento("a","botao","Visualizar projeto");
  a.href=link;a.target="_blank";a.rel="noopener noreferrer";
  acoes.appendChild(a);
 }
 const github=urlHttpValida(projeto.github_url);
 if(github){
  const a=criarElemento("a","projeto-codigo","Ver código-fonte");
  a.href=github;a.target="_blank";a.rel="noopener noreferrer";
  const icone=criarElemento("i");icone.setAttribute("data-lucide","github");a.prepend(icone);
  acoes.appendChild(a);
 }
 corpo.appendChild(acoes);card.append(img,corpo);return card;
}
function renderizarProjetos(){
 gradeProjetos.replaceChildren();
 const lista=filtroAtual==="Todos"?projetosPublicos:projetosPublicos.filter(p=>(p.categoria||"Outros")===filtroAtual);
 if(!lista.length){
  estadoProjetos.textContent=projetosPublicos.length?"Nenhum projeto encontrado nesta categoria.":"Nenhum projeto cadastrado no momento.";
  estadoProjetos.hidden=false;return;
 }
 estadoProjetos.hidden=true;
 lista.forEach(p=>gradeProjetos.appendChild(criarCardProjeto(p)));
 if(window.lucide)window.lucide.createIcons();
}
botoesFiltro.forEach(botao=>botao.addEventListener("click",()=>{
 filtroAtual=botao.dataset.filtro;
 botoesFiltro.forEach(item=>{
  const ativo=item===botao;item.classList.toggle("ativo",ativo);item.setAttribute("aria-pressed",String(ativo));
 });
 renderizarProjetos();
}));
async function carregarProjetosPublicos(){
 estadoProjetos.textContent="Carregando projetos...";estadoProjetos.hidden=false;
 const {data,error}=await db.from("projetos")
  .select("id,titulo,descricao,link,imagem_path,categoria,github_url,criado_em")
  .order("criado_em",{ascending:false});
 if(error){
  console.error("Erro ao carregar projetos:",error);
  estadoProjetos.textContent="Não foi possível carregar os projetos. Tente novamente mais tarde.";return;
 }
 projetosPublicos=data||[];renderizarProjetos();
}
carregarProjetosPublicos();
