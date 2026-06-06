// Arquivo principal da aplicação - Gerencia navegação e inicialização
class App {
    constructor() {
        this.currentPage = 'dashboard';
        this.init();
    }
    
    async init() {
        // Verificar autenticação
        await auth.init();
        
        if (!auth.isAuthenticated()) return;
        
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
        // Atualizar menu ativo
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
        
        // Carregar página correspondente
        switch(page) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'clients':
                loadClients();
                break;
            case 'products':
                loadProducts();
                break;
            case 'sales':
                loadSales();
                break;
            case 'expenses':
                loadExpenses();
                break;
            case 'users':
                loadUsers();
                break;
        }
        
        this.currentPage = page;
    }
    
    async isAdmin() {
        try {
            const userId = auth.currentUser?.id;
            if (!userId) return false;
            
            const { data, error } = await supabase
                .from('users')
                .select('role')
                .eq('user_id', userId)
                .single();
            
            if (error) return false;
            return data.role === 'admin';
        } catch {
            return false;
        }
    }
}

// Inicializar aplicação quando o DOM estiver pronto
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
});

// Mostrar/esconder elementos baseado no perfil
async function checkAdminAccess() {
    const isAdmin = await app.isAdmin();
    
    // Mostrar/esconder itens do menu
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = isAdmin ? 'flex' : 'none';
    });
}

// Exportar funções globais para uso nos módulos
window.showClientModal = showClientModal;
window.editClient = editClient;
window.deleteClient = deleteClient;
window.closeModal = closeModal;