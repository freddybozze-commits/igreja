# IEPP Curitiba — frontend e backend

O projeto está separado para permitir duas implantações independentes na Vercel:

```text
igreja/
├── frontend/   # PWA instalável para Android e iOS
└── backend/    # Supabase, políticas RLS e funções serverless
```

## Ordem recomendada

1. Configure o Supabase seguindo `backend/CONFIGURAR_SUPABASE.md`.
2. Preencha `frontend/js/supabase-config.js` com a URL e a chave `anon/public`.
3. Na Vercel, crie um projeto com **Root Directory** igual a `frontend`.
4. Opcionalmente, crie outro projeto com **Root Directory** igual a `backend`.

O frontend acessa diretamente o Supabase para cadastro, login, perfil, conteúdo e pedidos de oração. A segurança é aplicada pelas políticas RLS do banco; nenhuma chave administrativa fica no navegador.
