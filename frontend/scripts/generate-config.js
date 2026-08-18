import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const envPath = resolve(root, '.env');
const backendEnvPath = resolve(root, '..', 'backend', '.env');

function loadEnvFile(path, allowedKeys = null) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    if (allowedKeys && !allowedKeys.has(key)) continue;
    const value = trimmed.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(envPath);
loadEnvFile(backendEnvPath, new Set(['SUPABASE_URL', 'SUPABASE_ANON_KEY']));

const url = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const configPath = resolve(root, 'js', 'supabase-config.js');

if (url && anonKey) {
  writeFileSync(configPath, `// Gerado automaticamente no build. Não edite manualmente.\nexport const SUPABASE_URL = ${JSON.stringify(url)};\nexport const SUPABASE_ANON_KEY = ${JSON.stringify(anonKey)};\n`);
  console.log('Configuração gerada pelas variáveis de ambiente.');
} else if (existsSync(configPath) && !readFileSync(configPath, 'utf8').includes('COLE_AQUI')) {
  console.log('Variáveis de ambiente ausentes; configuração pública existente preservada.');
} else {
  writeFileSync(configPath, `// Gerado automaticamente no build. Não edite manualmente.\nexport const SUPABASE_URL = "COLE_AQUI_A_URL_DO_PROJETO";\nexport const SUPABASE_ANON_KEY = "COLE_AQUI_A_CHAVE_ANON_PUBLIC";\n`);
  console.warn('Build concluído sem configuração do Supabase.');
}
