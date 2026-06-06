// Main Application Controller
class AppController {
    constructor() {
        this.currentPage = 'dashboard';
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        this.setupNavigation();
        this.updateCurrentDate();
        this.loadUserInfo();
    }

    async checkAuth() {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session && !window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
            return;
        }
        
        if (session && window.location.pathname.includes('login.html')) {
            window.location.href = 'dashboard.html';
        }
    }

    setupEventListeners() {
        // Mobile menu toggle
        const mobileToggle = document.getElementById('mobileToggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('open');
            });
        }

        // Dark mode toggle
        const darkModeBtn = document.getElementById('darkModeBtn');
        if (darkModeBtn) {
            darkModeBtn.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
            });
            
            // Load dark mode preference
            if (localStorage.getItem('darkMode') === 'true') {
                document.body.classList.add('dark-mode');
            }
        }

        // Close modals when clicking on X
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                closeBtn.closest('.modal').style.display = 'none';
            });
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
    }

    navigateTo(page) {
        // Update active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        // Hide all views
        document.querySelectorAll('.page-view').forEach(view => {
            view.classList.remove('active');
        });

        // Show selected view
        const view = document.getElementById(`${page}View`);
        if (view) {
            view.classList.add('active');
            this.currentPage = page;
            
            // Load page-specific data
            this.loadPageData(page);
        }
    }

    loadPageData(page) {
        switch(page) {
            case 'dashboard':
                if (window.dashboardManager) window.dashboardManager.loadIndicators();
                break;
            case 'financeiro':
                if (window.financeiroManager) window.financeiroManager.loadMovimentacoes();
                break;
            case 'produtos':
                if (window.estoqueManager) window.estoqueManager.loadProdutos();
                break;
            case 'clientes':
                if (window.clientesManager) window.clientesManager.loadClientes();
                break;
            case 'agenda':
                if (window.agendaManager) window.agendaManager.loadAgenda();
                break;
        }
    }

    updateCurrentDate() {
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateElement.textContent = new Date().toLocaleDateString('pt-BR', options);
        }
    }

    async loadUserInfo() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = user.email?.split('@')[0] || 'Usuário';
            }
        }
    }
}

// Global functions for modals
window.openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        
        // Populate categories based on modal type
        if (modalId === 'movimentacaoModal') {
            populateCategorias();
        }
    }
};

window.closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        // Reset form
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
};

function populateCategorias() {
    const tipo = document.getElementById('movTipo')?.value;
    const categoriaSelect = document.getElementById('movCategoria');
    
    if (!categoriaSelect) return;
    
    const categorias = {
        receita: ['Procedimentos', 'Venda de Produtos', 'Outros'],
        despesa: ['Aluguel', 'Água', 'Luz', 'Internet', 'Marketing', 'Funcionários', 'Fornecedores', 'Impostos', 'Outros']
    };
    
    const options = tipo ? categorias[tipo] : [];
    
    categoriaSelect.innerHTML = '<option value="">Selecione</option>';
    options.forEach(cat => {
        categoriaSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

window.calcularMargem = () => {
    const custo = parseFloat(document.getElementById('prodCusto')?.value) || 0;
    const venda = parseFloat(document.getElementById('prodPrecoVenda')?.value) || 0;
    
    if (custo > 0) {
        const margem = ((venda - custo) / custo) * 100;
        const margemSpan = document.getElementById('prodMargem');
        if (margemSpan) {
            margemSpan.textContent = margem.toFixed(2);
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AppController();
});