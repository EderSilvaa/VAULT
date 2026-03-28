// Setup Database via Supabase API
// Execute: node scripts/setup-database.js

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Você vai precisar adicionar esta

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas!');
  console.log('\nAdicione no .env:');
  console.log('VITE_SUPABASE_URL=sua-url');
  console.log('SUPABASE_SERVICE_KEY=sua-service-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Setup do banco de dados Vault\n');

  // Validate connectivity
  const { error: pingError } = await supabase.from('profiles').select('id').limit(1);

  if (pingError && pingError.code !== 'PGRST116') {
    console.error('❌ Erro ao conectar ao Supabase:', pingError.message);
    console.log('\nVerifique se as variáveis de ambiente estão corretas.');
    process.exit(1);
  }

  console.log('✅ Conexão com Supabase OK\n');
  console.log('⚠️  Este script NÃO executa SQL diretamente (exec_sql foi removido por segurança).\n');
  console.log('Para aplicar o schema e as migrations, use o Supabase CLI:\n');
  console.log('  1. Instale: npm install -g supabase');
  console.log('  2. Login:   supabase login');
  console.log('  3. Vincule: supabase link --project-ref SEU_PROJECT_REF');
  console.log('  4. Execute: supabase db push\n');
  console.log('Ou aplique as migrations manualmente pelo Supabase Dashboard:');
  console.log('  https://supabase.com/dashboard → SQL Editor\n');
  console.log('Migrations disponíveis em: supabase/migrations/\n');
}

setupDatabase();
