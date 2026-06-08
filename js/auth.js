// js/auth.js - Versão Final Simplificada (Sem loops)
console.log('🔐 Carregando módulo de autenticação...');

class Auth {
    constructor() {
        this.currentUser = null;
        this.session = null;
        this.loginEventFired = false; // Controle para evitar múltiplos disparos
    }
    
    getSupabase() {
        return window.supabaseClient;
    }
    
    async init() {
        const supabase = this.getSupabase();
        
        if (!supabase) {
            console.error('❌ Supabase não inicializado');
            return false;
        }

        if (!supabase.auth) {
            console.error('❌ Auth não disponível');
            return false;
        }

        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('❌ Erro ao verificar sessão:', error.message);
                return false;
            }
            
            if (session) {
                this.session = session;
                this.currentUser = session.user;
                this.showApp();
                console.log('✅ Sessão restaurada');
                
                // Carregar dashboard diretamente (sem evento)
                setTimeout(() => {
                    this.carregarDashboard();
                }, 500);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Erro na inicialização:', error.message);
            return false;
        }
    }
    
    async login(email, password) {
        const supabase = this.getSupabase();
        
        if (!supabase || !supabase.auth) {
            return { 
                success: false, 
                message: 'Sistema não inicializado. Recarregue a página.' 
            };
        }

        try {
            console.log('🔐 Tentando login:', email);
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) {
                console.error('❌ Erro no login:', error.message);
                
                let message = error.message;
                if (message.includes('Invalid login credentials')) {
                    message = 'E-mail ou senha incorretos';
                } else if (message.includes('Email not confirmed')) {
                    message = 'E-mail não confirmado';
                } else if (message.includes('rate limit')) {
                    message = 'Muitas tentativas. Aguarde um momento';
                }
                
                return { success: false, message };
            }
            
            if (!data || !data.session) {
                return { success: false, message: 'Resposta inválida do servidor' };
            }
            
            this.session = data.session;
            this.currentUser = data.user;
            this.loginEventFired = false;
            
            // Mostrar a tela do app
            this.showApp();
            
            console.log('✅ Login realizado com sucesso');
            
            // Carregar dashboard após um delay
            setTimeout(() => {
                this.carregarDashboard();
            }, 800);
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Erro:', error.message);
            return { 
                success: false, 
                message: error.message || 'Erro ao fazer login' 
            };
        }
    }
    
    // Função única para carregar o dashboard
    carregarDashboard() {
        // Evitar múltiplas chamadas
        if (this.loginEventFired) {
            console.log('⏭️ Dashboard já foi carregado, ignorando...');
            return;
        }
        
        this.loginEventFired = true;
        console.log('📊 Carregando dashboard...');
        
        // Tentar via app
        if (typeof app !== 'undefined' && app) {
            if (!app.initialized) {
                app.init().then(() => {
                    if (app.initialized) {
                        app.navigateTo('dashboard');
                    }
                });
            } else {
                app.navigateTo('dashboard');
            }
            return;
        }
        
        // Fallback: carregar diretamente
        if (typeof loadDashboard === 'function') {
            loadDashboard();
        } else {
            console.error('❌ loadDashboard não encontrada');
        }
    }
    
    async logout() {
        const supabase = this.getSupabase();
        
        try {
            if (supabase && supabase.auth) {
                await supabase.auth.signOut();
            }
        } catch (error) {
            console.error('Erro no logout:', error.message);
        }
        
        this.currentUser = null;
        this.session = null;
        this.loginEventFired = false;
        this.showLogin();
    }
    
    async resetPassword(email) {
        const supabase = this.getSupabase();
        
        if (!supabase || !supabase.auth) {
            return { 
                success: false, 
                message: 'Serviço indisponível' 
            };
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin
            });
            
            if (error) throw error;
            
            return { 
                success: true, 
                message: '✅ E-mail de recuperação enviado! Verifique sua caixa de entrada.' 
            };
        } catch (error) {
            console.error('❌ Erro:', error.message);
            return { 
                success: false, 
                message: error.message || 'Erro ao enviar e-mail' 
            };
        }
    }
    
    showApp() {
        const loginScreen = document.getElementById('loginScreen');
        const appScreen = document.getElementById('appScreen');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (appScreen) appScreen.style.display = 'flex';
        
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = 
                this.currentUser?.user_metadata?.name || 
                this.currentUser?.email || 
                'Usuário';
        }
    }
    
    showLogin() {
        const loginScreen = document.getElementById('loginScreen');
        const appScreen = document.getElementById('appScreen');
        
        if (loginScreen) loginScreen.style.display = 'flex';
        if (appScreen) appScreen.style.display = 'none';
        
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.reset();
        
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        
        const contentArea = document.getElementById('contentArea');
        if (contentArea) {
            contentArea.innerHTML = '';
        }
    }
    
    isAuthenticated() {
        return !!(this.session && this.currentUser);
    }
}

// Criar instância global
const auth = new Auth();

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando aplicação...');
    
    // Aguardar Supabase com retry
    let tentativas = 0;
    const maxTentativas = 30;
    
    while (tentativas < maxTentativas) {
        if (window.supabaseClient && window.supabaseClient.auth) {
            console.log('✅ Supabase pronto!');
            break;
        }
        tentativas++;
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (!window.supabaseClient || !window.supabaseClient.auth) {
        console.error('❌ Supabase não inicializou');
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.innerHTML = '<strong>⚠️ Erro de Conexão</strong><br>Não foi possível conectar ao servidor.';
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    // Inicializar autenticação
    console.log('🔐 Verificando sessão...');
    await auth.init();
    
    // Configurar eventos
    setupEvents();
    
    console.log('✅ Pronto!');
});

// ============================================
// EVENTOS
// ============================================
function setupEvents() {
    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email')?.value?.trim();
            const password = document.getElementById('password')?.value;
            const btnLogin = document.getElementById('btnLogin');
            const errorDiv = document.getElementById('loginError');
            
            if (!email || !password) {
                showError(errorDiv, 'Preencha todos os campos');
                return;
            }
            
            if (btnLogin) {
                btnLogin.disabled = true;
                btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
            }
            
            if (errorDiv) errorDiv.style.display = 'none';
            
            const result = await auth.login(email, password);
            
            if (!result.success) {
                showError(errorDiv, result.message);
                if (btnLogin) {
                    btnLogin.disabled = false;
                    btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
                }
            }
        });
    }
    
    // Forgot Password
    document.getElementById('forgotPassword')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.login-form').style.display = 'none';
        document.getElementById('resetPasswordForm').style.display = 'block';
        document.getElementById('loginError').style.display = 'none';
    });
    
    // Back to Login
    document.getElementById('backToLogin')?.addEventListener('click', () => {
        document.querySelector('.login-form').style.display = 'block';
        document.getElementById('resetPasswordForm').style.display = 'none';
    });
    
    // Reset Password
    document.getElementById('resetForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('resetEmail')?.value?.trim();
        const messageDiv = document.getElementById('resetMessage');
        
        if (!email) {
            if (messageDiv) {
                messageDiv.textContent = 'Digite seu e-mail';
                messageDiv.className = 'error-message';
                messageDiv.style.display = 'block';
            }
            return;
        }
        
        const result = await auth.resetPassword(email);
        
        if (messageDiv) {
            messageDiv.textContent = result.message;
            messageDiv.className = result.success ? 'success-message' : 'error-message';
            messageDiv.style.display = 'block';
        }
    });
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        if (confirm('Deseja realmente sair?')) {
            auth.logout();
        }
    });
    
    // Menu Mobile
    document.getElementById('menuToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.toggle('show');
    });
}

function showError(errorDiv, message) {
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

window.auth = auth;
console.log('✅ Auth carregado!');