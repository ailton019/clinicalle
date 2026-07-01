// js/auth_check.js - Controle de Sessão e Interface Compartilhada
console.log('🔒 Carregando verificador de autenticação...');

document.addEventListener('DOMContentLoaded', async () => {
    // Aguardar o Supabase estar pronto
    let limit = 0;
    while (!window.supabaseClient && limit < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        limit++;
    }
    
    if (typeof auth !== 'undefined') {
        await auth.init();
        
        if (!auth.isAuthenticated()) {
            console.log('Redirecionando para login...');
            window.location.href = 'login.html';
            return;
        }
        
        // Atualizar interface comum (avatar, nome, data)
        updateCommonUI();
        
        // Inicializar eventos comuns
        initCommonEvents();
    } else {
        console.error('Módulo auth.js não carregado');
    }
});

function updateCommonUI() {
    const userNameElement = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userNameElement && auth.currentUser) {
        const nome = auth.currentUser.user_metadata?.name || 
                     auth.currentUser.email?.split('@')[0] || 
                     'Usuário';
        userNameElement.textContent = nome;
    }
    
    if (userAvatar && auth.currentUser) {
        const nome = auth.currentUser.user_metadata?.name || 'U';
        const primeiraLetra = nome[0].toUpperCase();
        userAvatar.innerHTML = `<span style="font-weight: 600;">${primeiraLetra}</span>`;
    }
    
    // Atualizar data atual
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = new Date().toLocaleDateString('pt-BR', options);
    }
    
    // Verificar acesso de administrador
    checkAdminAccess();
}

async function checkAdminAccess() {
    try {
        const userId = auth.currentUser?.id;
        if (!userId) return;
        
        const { data, error } = await supabaseClient
            .from('users')
            .select('role')
            .eq('user_id', userId)
            .single();
        
        if (!error && data) {
            const isAdmin = data.role === 'admin';
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = isAdmin ? 'flex' : 'none';
            });
        } else {
            // Se não encontrar ou der erro, esconde por segurança
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = 'none';
            });
        }
    } catch (e) {
        console.error('Erro ao verificar permissão:', e);
    }
}

function initCommonEvents() {
    // Menu toggle (Desktop collapse / Mobile slide)
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    
    const toggleSidebar = (e) => {
        if (e) e.stopPropagation();
        const sidebar = document.getElementById('sidebar');
        const appScreen = document.getElementById('appScreen');
        
        if (window.innerWidth <= 1024) {
            if (sidebar) {
                sidebar.classList.toggle('open');
                sidebar.classList.toggle('show');
            }
        } else {
            if (appScreen) {
                appScreen.classList.toggle('collapsed');
            }
        }
    };
    
    if (menuToggleBtn) menuToggleBtn.addEventListener('click', toggleSidebar);
    
    // Fechar ao clicar fora (no mobile)
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const menuToggleBtn = document.getElementById('menuToggleBtn');
        
        if (window.innerWidth <= 1024 && sidebar && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && 
                (!menuToggleBtn || !menuToggleBtn.contains(e.target))) {
                sidebar.classList.remove('open');
                sidebar.classList.remove('show');
            }
        }
    });
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        // Carregar estado salvo
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            document.body.classList.add('dark-mode');
            const icon = themeToggle.querySelector('i');
            if (icon) icon.className = 'fas fa-sun';
        }
        
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', isDark);
            const icon = themeToggle.querySelector('i');
            if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        });
    }
    
    // Botão de sair (logout)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('Deseja realmente sair?')) {
                await auth.logout();
            }
        });
    }
}
