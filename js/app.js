// js/app.js - Arquivo principal da aplicação

class App {
    constructor() {
        this.currentPage = 'dashboard';
        this.init();
    }
    
    async init() {
        // Aguardar autenticação
        await auth.init();
        
        if (!auth.isAuthenticated()) return;
        
        // Verificar se é admin para mostrar itens restritos
        await this.checkAdminAccess();
        
        // Configurar navegação
        this.setupNavigation();
        
        // Carregar página inicial
        this.navigateTo('dashboard');
    }
    
    setupNavigation() {
        // Menu lateral
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                
                // Verificar permissão para página de usuários
                if (page === 'users' && !this.isAdmin()) {
                    alert('Acesso restrito a administradores');
                    return;
                }
                
                this.navigateTo(page);
            });
        });
        
        // Fechar sidebar em mobile ao clicar em um item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 1024) {
                    document.getElementById('sidebar').classList.remove('show');
                }
            });
        });
    }
    
    navigateTo(page) {
        console.log('🔀 Navegando para:', page);
        
        // Atualizar menu ativo
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-page="${page}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        // Carregar página correspondente
        try {
            switch(page) {
                case 'dashboard':
                    if (typeof loadDashboard === 'function') {
                        loadDashboard();
                    } else {
                        console.error('❌ Função loadDashboard não encontrada');
                        this.showPageError('Dashboard não disponível');
                    }
                    break;
                    
                case 'clients':
                    if (typeof loadClients === 'function') {
                        loadClients();
                    } else {
                        console.error('❌ Função loadClients não encontrada');
                        this.showPageError('Módulo de Clientes não disponível');
                    }
                    break;
                    
                case 'products':
                    if (typeof loadProducts === 'function') {
                        loadProducts();
                    } else {
                        console.error('❌ Função loadProducts não encontrada');
                        this.showPageError('Módulo de Produtos não disponível');
                    }
                    break;
                    
                case 'sales':
                    if (typeof loadSales === 'function') {
                        loadSales();
                    } else {
                        console.error('❌ Função loadSales não encontrada');
                        this.showPageError('Módulo de Vendas não disponível');
                    }
                    break;
                    
                case 'expenses':
                    if (typeof loadExpenses === 'function') {
                        loadExpenses();
                    } else {
                        console.error('❌ Função loadExpenses não encontrada');
                        this.showPageError('Módulo de Despesas não disponível');
                    }
                    break;
                    
                case 'users':
                    if (typeof loadUsers === 'function') {
                        loadUsers();
                    } else {
                        console.error('❌ Função loadUsers não encontrada');
                        this.showPageError('Módulo de Usuários não disponível');
                    }
                    break;
                    
                default:
                    console.warn('⚠️ Página desconhecida:', page);
                    if (typeof loadDashboard === 'function') {
                        loadDashboard();
                    }
            }
        } catch (error) {
            console.error('❌ Erro ao navegar:', error);
            this.showPageError('Erro ao carregar a página: ' + error.message);
        }
        
        this.currentPage = page;
    }
    
    showPageError(message) {
        const contentArea = document.getElementById('contentArea');
        if (contentArea) {
            contentArea.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #e53e3e; margin-bottom: 20px;"></i>
                    <h3 style="color: #e53e3e;">Erro ao carregar módulo</h3>
                    <p style="color: #718096;">${message}</p>
                    <button class="btn-primary" onclick="location.reload()" style="margin-top: 20px;">
                        <i class="fas fa-sync"></i> Recarregar Sistema
                    </button>
                </div>
            `;
        }
    }
    
    async isAdmin() {
        try {
            const userId = auth.currentUser?.id;
            if (!userId) return false;
            
            const { data, error } = await supabaseClient
                .from('users')
                .select('role')
                .eq('user_id', userId)
                .single();
            
            if (error) return false;
            return data?.role === 'admin';
        } catch {
            return false;
        }
    }
    
    async checkAdminAccess() {
        const isAdmin = await this.isAdmin();
        
        // Mostrar/esconder itens do menu baseado no perfil
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = isAdmin ? 'flex' : 'none';
        });
        
        console.log('👤 Perfil:', isAdmin ? 'Administrador' : 'Usuário');
    }
}

// Inicializar aplicação quando o DOM estiver pronto
let app;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando aplicação...');
    
    // Aguardar um momento para garantir que todos os scripts carregaram
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Verificar se os módulos principais estão disponíveis
    console.log('📋 Verificando módulos:');
    console.log('  - auth:', typeof auth !== 'undefined' ? '✅' : '❌');
    console.log('  - supabaseClient:', typeof supabaseClient !== 'undefined' ? '✅' : '❌');
    console.log('  - loadDashboard:', typeof loadDashboard === 'function' ? '✅' : '❌');
    console.log('  - loadClients:', typeof loadClients === 'function' ? '✅' : '❌');
    console.log('  - loadProducts:', typeof loadProducts === 'function' ? '✅' : '❌');
    console.log('  - loadSales:', typeof loadSales === 'function' ? '✅' : '❌');
    console.log('  - loadExpenses:', typeof loadExpenses === 'function' ? '✅' : '❌');
    console.log('  - loadUsers:', typeof loadUsers === 'function' ? '✅' : '❌');
    
    // Inicializar app
    try {
        app = new App();
        console.log('✅ Aplicação inicializada com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao inicializar aplicação:', error);
    }
});

// Expor app globalmente para debug
window.app = app;