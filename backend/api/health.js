export default function handler(_request, response) {
  response.status(200).json({
    ok: true,
    service: 'iepp-curitiba-backend',
    database: 'supabase',
    environment: {
      supabaseUrl: Boolean(process.env.SUPABASE_URL),
      anonKey: Boolean(process.env.SUPABASE_ANON_KEY),
      serviceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
    }
  });
}
