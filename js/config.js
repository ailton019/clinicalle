// js/config.js
window.SUPABASE_CONFIG = {
    url: 'https://fmhojfyalubgzivfflwp.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtaG9qZnlhbHViZ3ppdmZmbHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTg1MzgsImV4cCI6MjA5NjMzNDUzOH0._49b5zErD0JM7NIwSC-V6bKkxB7EkeEeAc-nFkpW3Ho'  // SUA CHAVE JWT COMPLETA AQUI
};

window.APP_CONFIG = {
    appName: 'ERP Estética',
    version: '1.0.0',
    currency: 'BRL',
    locale: 'pt-BR'
};

console.log('📋 Config carregada - URL:', window.SUPABASE_CONFIG.url);