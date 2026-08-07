# Frontend — IEPP Curitiba

PWA estático responsável pela interface, instalação no Android/iOS e comunicação segura com a API pública do Supabase.

## Publicar na Vercel

1. Importe o repositório na Vercel.
2. Em **Root Directory**, escolha `frontend`.
3. Em **Framework Preset**, escolha `Other`.
4. Cadastre as variáveis `PUBLIC_SUPABASE_URL` e `PUBLIC_SUPABASE_ANON_KEY`.
5. O comando `npm run build` será executado automaticamente.
6. Clique em **Deploy**.

Para desenvolvimento local, copie os valores para `.env`. Na Vercel, use **Settings > Environment Variables**. O build gera `js/supabase-config.js` automaticamente. A chave `anon/public` pode existir no navegador porque as tabelas são protegidas pelas políticas RLS de `backend/supabase.sql`.

Nunca coloque a chave `service_role` nesta pasta.
