// Inicialização do Supabase
let supabase;

try {
    supabase = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
} catch (error) {
    console.error('Erro ao inicializar Supabase:', error);
}

// Funções utilitárias para operações no banco
const DB = {
    // Operações genéricas
    async insert(table, data) {
        const { data: result, error } = await supabase
            .from(table)
            .insert(data)
            .select();
        
        if (error) throw error;
        return result;
    },
    
    async update(table, id, data) {
        const { data: result, error } = await supabase
            .from(table)
            .update({ ...data, updated_at: new Date() })
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return result;
    },
    
    async delete(table, id) {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    },
    
    async select(table, query = '*') {
        const { data, error } = await supabase
            .from(table)
            .select(query)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },
    
    async selectById(table, id, query = '*') {
        const { data, error } = await supabase
            .from(table)
            .select(query)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    },
    
    // Consultas específicas com filtros
    async filterByDateRange(table, startDate, endDate, dateField = 'created_at') {
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