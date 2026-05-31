require('dotenv').config({ override: true });

const { createClient } = require('@supabase/supabase-js');

const TABLES = ['events', 'volunteers', 'assignments'];

let supabaseClient = null;

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  return { url, key };
};

const getSupabase = () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { url, key } = getSupabaseConfig();

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  supabaseClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return supabaseClient;
};

const connectDB = async () => {
  getSupabase();
  console.log('Supabase client configured');
};

const getDatabaseStatus = () => {
  const { url, key } = getSupabaseConfig();

  return {
    databaseType: 'Supabase',
    isConfigured: Boolean(url && key),
    projectUrl: url || null,
    tables: TABLES
  };
};

const getDatabaseStats = async () => {
  const supabase = getSupabase();
  const stats = {};

  for (const table of TABLES) {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true });

    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }

    stats[table] = count || 0;
  }

  return stats;
};

module.exports = connectDB;
module.exports.getSupabase = getSupabase;
module.exports.getDatabaseStatus = getDatabaseStatus;
module.exports.getDatabaseStats = getDatabaseStats;
