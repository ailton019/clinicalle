/**
 * Clínica Estética ERP - Aplicação Principal
 * Versão: 2.0
 * Descrição: Sistema completo de gestão para clínicas de estética
 */

// ==================== CONFIGURAÇÃO GLOBAL ====================

// Estado global da aplicação
window.appState = {
    currentUser: null,
    currentPage: 'dashboard',
    isDarkMode: localStorage.getItem('darkMode') === 'true',
    notifications: [],
    loading: false
};

// ==================== CLASSE PRINCIPAL DO APP ====================

class AppController {
    constructor() {
        this.supabase = supabaseClient;
        this.currentPage = 'dashboard';
        this.initialized = false;
    }

    /**
     * Inicializa a aplicação
     */
    async init() {
        if (this.initialized) {
            console.log('App já inicializado');
            return;
        }

        console.log('🚀 Inicializando Sistema ERP - Clínica Estética...');
        
        // Verificar autenticação
        const isAuthenticated = await this.checkAuth();
        
        if (!isAuthenticated) {
            console.log('Usuário não autenticado, redirecionando para login...');
            window.location.href = 'login.html';
            return;
        }

        // Carregar dados do usuário
        await this.loadUserData();
        
        // Configurar interface
        this.setupEventListeners();
        this.setupNavigation();
        this.setupDarkMode();
        this.updateCurrentDate();
        
        // Carregar página inicial
        this.navigateTo('dashboard');
        
        this.initialized = true;
        console.log('✅ Sistema inicializado com sucesso!');
    }

    /**
     * Verifica se o usuário está autenticado
     */
    async checkAuth() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) throw error;
            
            if (!session) {
                return false;
            }
            
            window.appState.currentUser = session.user;
            return true;
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            return false;
        }
    }

    /**
     * Carrega dados do usuário logado
     */
    async loadUserData() {
        try {
            const { data: profile, error } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', window.appState.currentUser?.id)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            
            if (profile) {
                window.appState.currentUser.profile = profile;
            }
            
            // Atualizar interface do usuário
            this.updateUserInterface();
            
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
        }
    }

    /**
     * Atualiza interface com dados do usuário
     */
    updateUserInterface() {
        const userNameElement = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userNameElement && window.appState.currentUser) {
            const nome = window.appState.currentUser.profile?.nome || 
                        window.appState.currentUser.email?.split('@')[0] || 
                        'Usuário';
            userNameElement.textContent = nome;
        }
        
        if (userAvatar && window.appState.currentUser) {
            const primeiraLetra = (window.appState.currentUser.profile?.nome || 'U')[0].toUpperCase();
            userAvatar.innerHTML = `<span style="font-weight: 600;">${primeiraLetra}</span>`;
        }
    }

    /**
     * Configura todos os event listeners globais
     */
    setupEventListeners() {
        // Mobile menu toggle
        const mobileToggle = document.getElementById('mobileToggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                const sidebar = document.querySelector('.sidebar');
                sidebar.classList.toggle('open');
            });
        }

        // Botão de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await this.logout();
            });
        }

        // Notificações
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.showNotifications();
            });
        }

        // Fechar modais ao clicar fora
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
            }
        });

        // Fechar modais com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.show').forEach(modal => {
                    modal.classList.remove('show');
                });
            }
        });
    }

    /**
     * Configura a navegação entre páginas
     */
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            // Remover listeners antigos para evitar duplicação
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            newItem.addEventListener('click', (e) => {
                e.preventDefault();
                const page = newItem.dataset.page;
                
                if (page) {
                    // Verificar permissões para páginas administrativas
                    if (page === 'configuracoes' || page === 'usuarios') {
                        if (!this.isAdmin()) {
                            this.showToast('Acesso restrito a administradores', 'error');
                            return;
                        }
                    }
                    
                    this.navigateTo(page);
                }
            });
        });
    }

    /**
     * Verifica se o usuário é admin
     */
    isAdmin() {
        return window.appState.currentUser?.profile?.cargo === 'admin' ||
               window.appState.currentUser?.profile?.role === 'admin';
    }

    /**
     * Navega para uma página específica
     */
    navigateTo(page) {
        console.log('Navegando para:', page);
        
        // Atualizar estado
        this.currentPage = page;
        window.appState.currentPage = page;
        
        // Atualizar sidebar ativa
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });
        
        // Atualizar título da página
        const pageTitles = {
            dashboard: 'Dashboard',
            financeiro: 'Financeiro',
            receitas: 'Receitas',
            despesas: 'Despesas',
            gastosFixos: 'Gastos Fixos',
            gastosVariaveis: 'Gastos Variáveis',
            produtos: 'Produtos',
            servicos: 'Serviços',
            estoque: 'Estoque',
            clientes: 'Clientes',
            agenda: 'Agenda',
            relatorios: 'Relatórios',
            configuracoes: 'Configurações'
        };
        
        const titleElement = document.getElementById('pageTitle');
        if (titleElement) {
            titleElement.textContent = pageTitles[page] || page.charAt(0).toUpperCase() + page.slice(1);
        }
        
        // Carregar conteúdo da página
        this.loadPageContent(page);
    }

    /**
     * Carrega o conteúdo da página selecionada
     */
    async loadPageContent(page) {
        const contentArea = document.getElementById('contentArea');
        if (!contentArea) return;
        
        // Mostrar loading
        this.showLoading();
        
        try {
            // Esconder todas as views
            document.querySelectorAll('.page-view').forEach(view => {
                view.classList.remove('active');
            });
            
            // Mostrar view selecionada
            const targetView = document.getElementById(`${page}View`);
            
            if (targetView) {
                targetView.classList.add('active');
                
                // Carregar dados específicos da página
                await this.loadPageData(page);
            } else {
                // Se a view não existe, carregar via função
                await this.loadPageViaFunction(page);
            }
            
        } catch (error) {
            console.error('Erro ao carregar página:', error);
            this.showToast('Erro ao carregar página: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Carrega dados específicos da página
     */
    async loadPageData(page) {
        switch(page) {
            case 'dashboard':
                if (typeof loadDashboard === 'function') {
                    await loadDashboard();
                }
                break;
            case 'financeiro':
                if (typeof loadFinanceiro === 'function') {
                    await loadFinanceiro();
                }
                break;
            case 'produtos':
                if (typeof loadProducts === 'function') {
                    await loadProducts();
                }
                break;
            case 'clientes':
                if (typeof loadClientes === 'function') {
                    await loadClientes();
                }
                break;
            case 'agenda':
                if (typeof loadAgenda === 'function') {
                    await loadAgenda();
                }
                break;
            case 'estoque':
                if (typeof loadEstoque === 'function') {
                    await loadEstoque();
                }
                break;
            case 'servicos':
                if (typeof loadServicos === 'function') {
                    await loadServicos();
                }
                break;
            default:
                console.log('Página sem função específica:', page);
        }
    }

    /**
     * Carrega página via função global (fallback)
     */
    async loadPageViaFunction(page) {
        const functionMap = {
            'dashboard': 'loadDashboard',
            'financeiro': 'loadFinanceiro',
            'produtos': 'loadProducts',
            'clientes': 'loadClientes',
            'agenda': 'loadAgenda'
        };
        
        const functionName = functionMap[page];
        if (functionName && typeof window[functionName] === 'function') {
            await window[functionName]();
        }
    }

    /**
     * Configura o modo escuro
     */
    setupDarkMode() {
        const darkModeBtn = document.getElementById('darkModeBtn');
        if (!darkModeBtn) return;
        
        // Aplicar modo salvo
        if (window.appState.isDarkMode) {
            document.body.classList.add('dark-mode');
            darkModeBtn.innerHTML = '<i class="fas fa-sun"></i>';
        }
        
        darkModeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            window.appState.isDarkMode = isDark;
            localStorage.setItem('darkMode', isDark);
            darkModeBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            
            this.showToast(`Modo ${isDark ? 'escuro' : 'claro'} ativado`, 'info');
        });
    }

    /**
     * Atualiza a data atual no header
     */
    updateCurrentDate() {
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            const hoje = new Date();
            const dataFormatada = hoje.toLocaleDateString('pt-BR', options);
            dateElement.textContent = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
        }
    }

    /**
     * Mostra notificações
     */
    showNotifications() {
        const notifications = window.appState.notifications;
        
        if (notifications.length === 0) {
            this.showToast('Nenhuma notificação nova', 'info');
            return;
        }
        
        // Criar modal de notificações
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3><i class="fas fa-bell"></i> Notificações</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${notifications.map(notif => `
                        <div style="padding: 12px; border-bottom: 1px solid #e2e8f0; ${notif.lida ? 'opacity: 0.6;' : ''}">
                            <strong>${notif.titulo}</strong>
                            <p style="margin: 5px 0; font-size: 14px;">${notif.mensagem}</p>
                            <small style="color: #718096;">${this.formatDate(notif.data)}</small>
                        </div>
                    `).join('')}
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Fechar</button>
                    <button class="btn-primary" onclick="app.markAllNotificationsRead(); this.closest('.modal').remove()">
                        Marcar todas como lidas
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    /**
     * Marca todas notificações como lidas
     */
    markAllNotificationsRead() {
        window.appState.notifications.forEach(n => n.lida = true);
        const badge = document.querySelector('.notification-badge');
        if (badge) badge.style.display = 'none';
        this.showToast('Notificações marcadas como lidas', 'success');
    }

    /**
     * Adiciona uma notificação
     */
    addNotification(title, message, type = 'info') {
        const notification = {
            id: Date.now(),
            titulo: title,
            mensagem: message,
            tipo: type,
            data: new Date().toISOString(),
            lida: false
        };
        
        window.appState.notifications.unshift(notification);
        
        // Atualizar badge
        const unreadCount = window.appState.notifications.filter(n => !n.lida).length;
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
        
        // Mostrar toast de notificação
        this.showToast(title, type);
    }

    /**
     * Mostra um toast de notificação
     */
    showToast(message, type = 'success') {
        // Remover toast existente
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            border-left: 4px solid ${colors[type]};
            font-size: 14px;
        `;
        
        toast.innerHTML = `
            <i class="fas ${icons[type]}" style="color: ${colors[type]};"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Mostra loading overlay
     */
    showLoading() {
        if (document.querySelector('.loading-overlay')) return;
        
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-pulse fa-3x"></i>
                <p>Carregando...</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    /**
     * Esconde loading overlay
     */
    hideLoading() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) overlay.remove();
    }

    /**
     * Logout do usuário
     */
    async logout() {
        try {
            const confirmed = confirm('Tem certeza que deseja sair?');
            if (!confirmed) return;
            
            this.showLoading();
            
            await this.supabase.auth.signOut();
            localStorage.removeItem('user');
            window.appState.currentUser = null;
            
            this.showToast('Logout realizado com sucesso!', 'success');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 500);
            
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            this.showToast('Erro ao fazer logout', 'error');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Formata data para exibição
     */
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Formata valor monetário
     */
    formatCurrency(value) {
        if (value === undefined || value === null) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }
}

// ==================== INICIALIZAÇÃO ====================

let app;

// Aguardar DOM carregar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM carregado, iniciando aplicação...');
    
    // Pequeno delay para garantir que outros scripts carregaram
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
        app = new AppController();
        await app.init();
        
        // Expor globalmente para uso em outros scripts
        window.app = app;
        window.showToast = (msg, type) => app.showToast(msg, type);
        window.showLoading = () => app.showLoading();
        window.hideLoading = () => app.hideLoading();
        window.formatCurrency = (value) => app.formatCurrency(value);
        window.formatDate = (date) => app.formatDate(date);
        
    } catch (error) {
        console.error('❌ Erro fatal ao inicializar aplicação:', error);
        
        // Mostrar erro na tela se estiver em dashboard
        if (!window.location.pathname.includes('login.html')) {
            const contentArea = document.getElementById('contentArea');
            if (contentArea) {
                contentArea.innerHTML = `
                    <div style="text-align: center; padding: 60px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: #e53e3e;"></i>
                        <h2 style="margin: 20px 0;">Erro ao carregar sistema</h2>
                        <p style="color: #718096;">${error.message}</p>
                        <button class="btn-primary" onclick="location.reload()">
                            <i class="fas fa-sync"></i> Recarregar
                        </button>
                    </div>
                `;
            }
        }
    }
});

// Adicionar estilos de animação se não existirem
if (!document.querySelector('#appAnimations')) {
    const style = document.createElement('style');
    style.id = 'appAnimations';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        
        .loading-spinner {
            background: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        
        .loading-spinner i {
            color: var(--primary-color);
            font-size: 48px;
        }
        
        .loading-spinner p {
            margin-top: 15px;
            color: #4a5568;
        }
        
        .toast-notification {
            animation: slideInRight 0.3s ease;
        }
        
        .modal.show {
            display: flex !important;
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ app.js carregado com sucesso!');