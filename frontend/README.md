# Frontend — IEPP Curitiba

PWA estático responsável pela interface, instalação no Android/iOS e comunicação segura com a API pública do Supabase.

## Publicar na Vercel

1. Importe o repositório na Vercel.
2. Em **Root Directory**, escolha `frontend`.
3. Em **Framework Preset**, escolha `Other`.
4. Não informe comando de build.
5. Clique em **Deploy**.

Antes da publicação, preencha `js/supabase-config.js` com a URL do projeto e a chave `anon/public`. Essa chave pode existir no navegador porque as tabelas são protegidas pelas políticas RLS de `backend/supabase.sql`.

Nunca coloque a chave `service_role` nesta pasta.
