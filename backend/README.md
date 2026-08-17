# Backend — IEPP Curitiba

O banco de dados e a autenticação são executados pelo Supabase. Esta pasta guarda o schema, as políticas de segurança e uma API serverless mínima para validar a implantação na Vercel.

## Preparar o Supabase

Siga `CONFIGURAR_SUPABASE.md` e execute `supabase.sql` no SQL Editor do projeto.

## Publicar na Vercel

Crie um segundo projeto na Vercel e selecione `backend` como **Root Directory**. A rota `/api/health` responderá com o estado do serviço.

Cadastre em **Settings > Environment Variables**:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — somente quando uma rota administrativa realmente precisar dela.

Para desenvolvimento local, use o arquivo `.env`, que está ignorado pelo Git. Os nomes e exemplos ficam em `.env.example`.

Não é necessário colocar `SUPABASE_SERVICE_ROLE_KEY` na Vercel para as funções atuais. Se futuramente houver rotas administrativas, essa chave deve ser cadastrada somente nas Environment Variables do projeto backend e nunca enviada ao frontend.
