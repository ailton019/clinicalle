// js/supabase.js - Versão Final Corrigida
console.log('🔧 Inicializando Supabase...');

// Remover qualquer declaração anterior
if (typeof window.supabaseClient !== 'undefined') {
    delete window.supabaseClient;
}

window.supabaseClient = null;

(function() {
    try {
        // ============================================
        // VERIFICAÇÕES DE CONFIGURAÇÃO
        // ============================================
        
        if (!window.SUPABASE_CONFIG) {
            console.error('❌ SUPABASE_CONFIG não encontrado!');
            console.error('O arquivo config.js foi carregado?');
            return;
        }
        
        const { url, anonKey } = window.SUPABASE_CONFIG;
        
        if (!url || url.includes('seu-projeto')) {
            console.error('❌ URL do Supabase não configurada!');
            console.error('Edite config.js com a URL do seu projeto');
            return;
        }
        
        if (!anonKey || anonKey.length < 20) {
            console.error('❌ ANON KEY inválida!');
            console.error('Edite config.js com sua ANON KEY');
            return;
        }
        
        console.log('📋 Configurações carregadas:');
        console.log('  URL:', url);
        console.log('  Chave presente:', !!anonKey);
        console.log('  Tipo:', anonKey.startsWith('eyJ') ? 'JWT (Anon Key)' : 'Publishable Key');
        
        // ============================================
        // VERIFICAR BIBLIOTECA SUPABASE
        // ============================================
        
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Biblioteca Supabase não carregada!');
            console.error('Verifique a CDN no index.html');
            return;
        }
        
        if (typeof window.supabase.createClient !== 'function') {
            console.error('❌ createClient não é uma função!');
            console.error('Biblioteca Supabase pode estar corrompida');
            return;
        }
        
        // ============================================
        // CRIAR CLIENTE SUPABASE
        // ============================================
        
        console.log('🔨 Criando cliente Supabase...');
        
        window.supabaseClient = window.supabase.createClient(url, anonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                storage: window.localStorage,
                storageKey: 'erp_estetica_auth'
            }
        });
        
        // ============================================
        // VERIFICAR CLIENTE CRIADO
        // ============================================
        
        if (!window.supabaseClient) {
            console.error('❌ createClient retornou null/undefined');
            return;
        }
        
        console.log('✅ Cliente Supabase criado!');
        
        // Verificar módulos disponíveis
        const modulos = {
            auth: !!window.supabaseClient.auth,
            from: !!window.supabaseClient.from,
            rpc: !!window.supabaseClient.rpc,
            storage: !!window.supabaseClient.storage,
            functions: !!window.supabaseClient.functions
        };
        
        console.log('📦 Módulos:', modulos);
        
        // Verificar auth especificamente
        if (window.supabaseClient.auth) {
            const authMethods = {
                signInWithPassword: typeof window.supabaseClient.auth.signInWithPassword === 'function',
                signOut: typeof window.supabaseClient.auth.signOut === 'function',
                getSession: typeof window.supabaseClient.auth.getSession === 'function',
                onAuthStateChange: typeof window.supabaseClient.auth.onAuthStateChange === 'function',
                resetPasswordForEmail: typeof window.supabaseClient.auth.resetPasswordForEmail === 'function',
                signUp: typeof window.supabaseClient.auth.signUp === 'function'
            };
            
            console.log('🔑 Métodos Auth:', authMethods);
            
            // Verificar se todos os métodos essenciais existem
            const faltando = Object.entries(authMethods)
                .filter(([, existe]) => !existe)
                .map(([nome]) => nome);
            
            if (faltando.length > 0) {
                console.error('⚠️ Métodos auth faltando:', faltando);
            }
        } else {
            console.error('❌ Módulo Auth NÃO disponível!');
            console.error('Possíveis causas:');
            console.error('  1. ANON KEY inválida ou expirada');
            console.error('  2. URL do projeto incorreta');
            console.error('  3. Projeto Supabase não configurado');
        }
        
        console.log('🎉 Supabase inicializado!');
        
    } catch (error) {
        console.error('❌ ERRO CRÍTICO:', error.message);
        console.error('Stack:', error.stack);
    }
})();

// ============================================
// FUNÇÕES DE DIAGNÓSTICO
// ============================================

// Verificar status
window.getSupabaseStatus = function() {
    return {
        client: !!window.supabaseClient,
        auth: !!window.supabaseClient?.auth,
        config: window.SUPABASE_CONFIG ? 'OK' : 'N/A',
        url: window.SUPABASE_CONFIG?.url || 'N/A'
    };
};

console.log('✅ Módulo Supabase carregado!');
console.log('💡 Execute getSupabaseStatus() no console para diagnóstico');