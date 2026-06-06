// Configuração do Supabase
// IMPORTANTE: Substitua com suas credenciais do Supabase
const SUPABASE_CONFIG = {
    // URL do projeto - Esta está correta ✅
    url: 'https://fmhojfyalubgzivfflwp.supabase.co',
    
    // ANON KEY - Precisa ser a chave JWT que começa com "eyJ..."
    // Encontre em: Settings > API > Project API keys > anon public
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtaG9qZnlhbHViZ3ppdmZmbHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTg1MzgsImV4cCI6MjA5NjMzNDUzOH0._49b5zErD0JM7NIwSC-V6bKkxB7EkeEeAc-nFkpW3Ho'  // 👈 SUBSTITUA AQUI
};

// Constantes do Sistema
const APP_CONFIG = {
    appName: 'ERP Estética',
    version: '1.0.0',
    currency: 'BRL',
    locale: 'pt-BR'
};

// Verificação de configuração
console.log('🔧 Configuração do Supabase:');
console.log('URL:', SUPABASE_CONFIG.url);
console.log('Anon Key:', SUPABASE_CONFIG.anonKey.substring(0, 20) + '...');
console.log('Formato da chave:', SUPABASE_CONFIG.anonKey.startsWith('eyJ') ? '✅ Válido (JWT)' : '❌ Inválido');