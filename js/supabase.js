// js/supabase.js - Versão compatível com Publishable Key

// Inicialização do Supabase
let supabase;
let supabaseInitialized = false;

// Função para inicializar o Supabase
function initSupabase() {
    try {
        // Verificar se as configurações existem
        if (!SUPABASE_CONFIG || !SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
            throw new Error('Configurações do Supabase não encontradas');
        }

        console.log('🔧 Inicializando Supabase...');
        console.log('URL:', SUPABASE_CONFIG.url);
        console.log('Tipo da chave:', SUPABASE_CONFIG.anonKey.startsWith('sb_publishable_') ? 'Publishable Key' : 'Anon Key');

        // Verificar se a biblioteca Supabase está carregada
        if (!window.supabase || !window.supabase.createClient) {
            throw new Error('Biblioteca Supabase não carregada. Verifique a CDN no HTML.');
        }

        // Inicializar o cliente Supabase
        // Nota: createClient aceita tanto anon key quanto publishable key
        supabase = window.supabase.createClient(
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

        // Verificar se o cliente foi criado corretamente
        if (!supabase) {
            throw new Error('Falha ao criar cliente Supabase');
        }

        // Verificar se os métodos principais existem
        if (!supabase.auth) {
            throw new Error('Cliente Supabase criado sem módulo de autenticação');
        }

        supabaseInitialized = true;
        console.log('✅ Supabase inicializado com sucesso!');
        console.log('📦 Módulos disponíveis:', {
            auth: !!supabase.auth,
            from: !!supabase.from,
            rpc: !!supabase.rpc
        });
        
        return true;
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error.message);
        console.error('Stack:', error.stack);
        supabaseInitialized = false;
        return false;
    }
}

// Inicializar quando o script carregar
initSupabase();

// Funções utilitárias para operações no banco
const DB = {
    async insert(table, data) {
        if (!supabase) throw new Error('Supabase não inicializado');
        
        const { data: result, error } = await supabase
            .from(table)
            .insert(data)
            .select();
        
        if (error) throw error;
        return result;
    },
    
    async update(table, id, data) {
        if (!supabase) throw new Error('Supabase não inicializado');
        
        const { data: result, error } = await supabase
            .from(table)
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return result;
    },
    
    async delete(table, id) {
        if (!supabase) throw new Error('Supabase não inicializado');
        
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    },
    
    async select(table, query = '*') {
        if (!supabase) throw new Error('Supabase não inicializado');
        
        const { data, error } = await supabase
            .from(table)
            .select(query)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },
    
    async selectById(table, id, query = '*') {
        if (!supabase) throw new Error('Supabase não inicializado');
        
        const { data, error } = await supabase
            .from(table)
            .select(query)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    },
    
    async filterByDateRange(table, startDate, endDate, dateField = 'created_at') {
        if (!supabase) throw new Error('Supabase não inicializado');
        
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .gte(dateField, startDate)
            .lte(dateField, endDate)
            .order(dateField, { ascending: false });
        
        if (error) throw error;
        return data;
    }
};

// Exportar função para verificar estado
window.getSupabaseStatus = function() {
    return {
        initialized: supabaseInitialized,
        client: !!supabase,
        auth: !!supabase?.auth,
        config: {
            url: SUPABASE_CONFIG.url,
            keyType: SUPABASE_CONFIG.anonKey.startsWith('sb_publishable_') ? 'publishable' : 'anon'
        }
    };
};