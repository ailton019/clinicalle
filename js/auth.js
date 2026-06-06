// js/auth.js - Substitua TODO o conteúdo por este arquivo

class Auth {
    constructor() {
        this.currentUser = null;
        this.session = null;
    }
    
    // Método para obter o cliente Supabase
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
                }
                
                return { success: false, message };
            }
            
            if (!data || !data.session) {
                return { success: false, message: 'Resposta inválida do servidor' };
            }
            
            this.session = data.session;
            this.currentUser = data.user;
            this.showApp();
            
            console.log('✅ Login realizado com sucesso');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Erro:', error.message);
            return { 
                success: false, 
                message: error.message || 'Erro ao fazer login' 
            };
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
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            
            if (error) throw error;
            
            return { 
                success: true, 
                message: 'E-mail de recuperação enviado! Verifique sua caixa de entrada.' 
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
    }
    
    isAuthenticated() {
        return !!(this.session && this.currentUser);
    }
}

// Criar instância global
const auth = new Auth();

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando aplicação...');
    
    // Aguardar Supabase inicializar
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Verificar se Supabase está disponível
    if (!window.supabaseClient) {
        console.error('❌ Supabase não encontrado');
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.innerHTML = `
                <strong>⚠️ Erro de Configuração</strong><br>
                Verifique:<br>
                1. Conexão com internet<br>
                2. Configurações em js/config.js<br>
                3. Console do navegador (F12)
            `;
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    // Inicializar autenticação
    await auth.init();
    
    // Configurar eventos
    setupEvents();
});

function setupEvents() {
    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email')?.value;
            const password = document.getElementById('password')?.value;
            const btnLogin = document.getElementById('btnLogin');
            const errorDiv = document.getElementById('loginError');
            
            if (!email || !password) {
                if (errorDiv) {
                    errorDiv.textContent = 'Preencha todos os campos';
                    errorDiv.style.display = 'block';
                }
                return;
            }
            
            if (btnLogin) {
                btnLogin.disabled = true;
                btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
            }
            
            if (errorDiv) errorDiv.style.display = 'none';
            
            const result = await auth.login(email, password);
            
            if (!result.success) {
                if (errorDiv) {
                    errorDiv.textContent = result.message;
                    errorDiv.style.display = 'block';
                }
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
        const loginFormDiv = document.querySelector('.login-form');
        const resetDiv = document.getElementById('resetPasswordForm');
        if (loginFormDiv) loginFormDiv.style.display = 'none';
        if (resetDiv) resetDiv.style.display = 'block';
    });
    
    // Back to Login
    document.getElementById('backToLogin')?.addEventListener('click', () => {
        const loginFormDiv = document.querySelector('.login-form');
        const resetDiv = document.getElementById('resetPasswordForm');
        if (loginFormDiv) loginFormDiv.style.display = 'block';
        if (resetDiv) resetDiv.style.display = 'none';
    });
    
    // Reset Password
    document.getElementById('resetForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('resetEmail')?.value;
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
    document.getElementById('logoutBtn')?.addEventListener('click', () => auth.logout());
    
    // Menu Mobile
    document.getElementById('menuToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.toggle('show');
    });
}