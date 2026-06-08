// js/app.js - Versão Simplificada
console.log('📦 Carregando app.js...');

class App {
    constructor() {
        this.currentPage = 'dashboard';
        this.initialized = false;
    }
    
    async init() {
        if (this.initialized) {
            console.log('⏭️ App já inicializado');
            return;
        }
        
        console.log('🔧 Inicializando App...');
        
        if (!auth || !auth.isAuthenticated()) {
            console.log('ℹ️ Usuário não autenticado');
            return;
        }
        
        await this.checkAdminAccess();
        this.setupNavigation();
        this.navigateTo('dashboard');
        
        this.initialized = true;
        console.log('✅ App inicializado!');
    }
    
    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            // Remover listener antigo
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            newItem.addEventListener('click', (e) => {
                e.preventDefault();
                const page = newItem.dataset.page;
                
                if (page === 'users') {
                    this.isAdmin().then(isAdmin => {
                        if (!isAdmin) {
                            alert('Acesso restrito a administradores');
                            return;
                        }
                        this.navigateTo(page);
                    });
                    return;
                }
                
                this.navigateTo(page);
                
                if (window.innerWidth <= 1024) {
                    document.getElementById('sidebar')?.classList.remove('show');
                }
            });
        });
    }
    
    navigateTo(page) {
        console.log('🔀 Navegando para:', page);
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-page="${page}"]`);
        if (activeItem) activeItem.classList.add('active');
        
        const titles = {
            dashboard: 'Dashboard',
            clients: 'Clientes',
            products: 'Produtos',
            sales: 'Vendas',
            expenses: 'Despesas',
            users: 'Usuários'
        };
        document.getElementById('pageTitle').textContent = titles[page] || page;
        
        try {
            switch(page) {
                case 'dashboard':
                    if (typeof loadDashboard === 'function') loadDashboard();
                    break;
                case 'clients':
                    if (typeof loadClients === 'function') loadClients();
                    break;
                case 'products':
                    if (typeof loadProducts === 'function') loadProducts();
                    break;
                case 'sales':
                    if (typeof loadSales === 'function') loadSales();
                    break;
                case 'expenses':
                    if (typeof loadExpenses === 'function') loadExpenses();
                    break;
                case 'users':
                    if (typeof loadUsers === 'function') loadUsers();
                    break;
                default:
                    if (typeof loadDashboard === 'function') loadDashboard();
            }
        } catch (error) {
            console.error('❌ Erro:', error);
        }
        
        this.currentPage = page;
    }
    
    async isAdmin() {
        try {
            const userId = auth?.currentUser?.id;
            if (!userId) return false;
            
            const { data } = await supabaseClient
                .from('users')
                .select('role')
                .eq('user_id', userId)
                .single();
            
            return data?.role === 'admin';
        } catch {
            return false;
        }
    }
    
    async checkAdminAccess() {
        const isAdmin = await this.isAdmin();
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = isAdmin ? 'flex' : 'none';
        });
    }
}

// Inicialização
let app;

document.addEventListener('DOMContentLoaded', async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
        app = new App();
        await app.init();
    } catch (error) {
        console.error('❌ Erro:', error);
    }
    
    window.app = app;
});

console.log('✅ app.js carregado!');