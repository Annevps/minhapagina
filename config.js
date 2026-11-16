const SUPABASE_URL = "https://mezafzsrxzgryefprblh.supabase.co";
const SUPABASE_CHAVE_PUBLICA = "sb_publishable_TDk-7FqEPphaWB30qkjMGw_BvHMr1vu";
const BUCKET_IMAGENS = "projetos-imagens";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_CHAVE_PUBLICA);

function urlImagem(caminho) {
  if (!caminho) return "";
  return db.storage.from(BUCKET_IMAGENS).getPublicUrl(caminho).data.publicUrl;
}