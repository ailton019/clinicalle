// js/supabase.js - Substitua TODO o conteúdo por este arquivo

// Remover qualquer declaração anterior
if (typeof window.supabaseClient !== 'undefined') {
    delete window.supabaseClient;
}

// Criar o cliente Supabase UMA ÚNICA VEZ
window.supabaseClient = null;

(function() {
    try {
        // Verificar se as configurações existem
        if (!window.SUPABASE_CONFIG || !SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
            console.error('❌ Configurações do Supabase não encontradas');
            return;
        }

        console.log('🔧 Inicializando Supabase...');
        console.log('URL:', SUPABASE_CONFIG.url);
        console.log('Chave válida:', SUPABASE_CONFIG.anonKey.startsWith('eyJ') || SUPABASE_CONFIG.anonKey.startsWith('sb_'));

        // Verificar se a biblioteca Supabase está carregada
        if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
            console.error('❌ Biblioteca Supabase não carregada');
            return;
        }

        // Criar o cliente
        window.supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.url, 
            SUPABASE_CONFIG.anonKey,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                }
            }
        );

        console.log('✅ Supabase inicializado com sucesso!');
        console.log('Auth disponível:', !!window.supabaseClient?.auth);
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error.message);
    }
})();