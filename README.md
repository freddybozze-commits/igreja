# IEPP Curitiba — frontend e backend

O projeto está separado para permitir duas implantações independentes na Vercel:

```text
igreja/
├── frontend/   # PWA instalável para Android e iOS
└── backend/    # Supabase, políticas RLS e funções serverless
```

## Ordem recomendada

1. Configure o Supabase seguindo `backend/CONFIGURAR_SUPABASE.md`.
2. Configure `PUBLIC_SUPABASE_URL` e `PUBLIC_SUPABASE_ANON_KEY` no projeto frontend da Vercel.
3. Na Vercel, crie um projeto com **Root Directory** igual a `frontend`.
4. Opcionalmente, crie outro projeto com **Root Directory** igual a `backend`.

O frontend acessa diretamente o Supabase para cadastro, login, perfil, conteúdo e pedidos de oração. A segurança é aplicada pelas políticas RLS do banco; nenhuma chave administrativa fica no navegador.

Cada pasta possui `.env.example`. Os arquivos `.env` reais ficam somente no computador e estão bloqueados pelo `.gitignore`.
....