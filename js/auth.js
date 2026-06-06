// js/auth.js - Versão Corrigida

// Gerenciamento de Autenticação
class Auth {
    constructor() {
        this.currentUser = null;
        this.session = null;
        this.initialized = false;
    }
    
    async init() {
        // Verificar se o Supabase está inicializado
        if (!supabase) {
            console.error('❌ Supabase não está inicializado');
            this.initialized = false;
            return false;
        }

        try {
            // Verificar sessão existente
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) throw error;
            
            if (session) {
                this.session = session;
                this.currentUser = session.user;
                this.initialized = true;
                this.showApp();
                console.log('✅ Sessão restaurada com sucesso');
                return true;
            }
            
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('❌ Erro ao verificar sessão:', error.message);
            this.initialized = false;
            return false;
        }
    }
    
    async login(email, password) {
        try {
            // Verificar se Supabase está disponível
            if (!supabase) {
                throw new Error('Sistema não inicializado. Recarregue a página.');
            }

            // Verificar se o cliente auth está disponível
            if (!supabase.auth) {
                throw new Error('Serviço de autenticação indisponível');
            }

            console.log('🔐 Tentando login com:', email);
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) {
                console.error('❌ Erro no login:', error.message);
                throw error;
            }
            
            if (!data || !data.session) {
                throw new Error('Resposta inválida do servidor');
            }
            
            this.session = data.session;
            this.currentUser = data.user;
            this.showApp();
            
            console.log('✅ Login realizado com sucesso');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Falha no login:', error);
            
            let message = error.message;
            
            // Traduzir mensagens comuns de erro
            if (message.includes('Invalid login credentials')) {
                message = 'E-mail ou senha incorretos';
            } else if (message.includes('Email not confirmed')) {
                message = 'E-mail não confirmado. Verifique sua caixa de entrada';
            } else if (message.includes('rate limit')) {
                message = 'Muitas tentativas. Aguarde um momento';
            }
            
            return { 
                success: false, 
                message: message || 'Erro ao fazer login' 
            };
        }
    }
    
    async logout() {
        try {
            if (!supabase || !supabase.auth) {
                throw new Error('Serviço indisponível');
            }

            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            this.currentUser = null;
            this.session = null;
            this.showLogin();
            
            console.log('✅ Logout realizado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao fazer logout:', error.message);
            // Forçar logout local mesmo se falhar
            this.currentUser = null;
            this.session = null;
            this.showLogin();
        }
    }
    
    async resetPassword(email) {
        try {
            if (!supabase || !supabase.auth) {
                throw new Error('Serviço indisponível');
            }

            console.log('📧 Enviando recuperação para:', email);
            
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password'
            });
            
            if (error) throw error;
            
            return { 
                success: true, 
                message: 'E-mail de recuperação enviado! Verifique sua caixa de entrada e spam.' 
            };
        } catch (error) {
            console.error('❌ Erro na recuperação:', error.message);
            
            let message = error.message;
            if (message.includes('rate limit')) {
                message = 'Aguarde 60 segundos antes de tentar novamente';
            }
            
            return { 
                success: false, 
                message: message || 'Erro ao enviar e-mail de recuperação' 
            };
        }
    }
    
    showApp() {
        const loginScreen = document.getElementById('loginScreen');
        const appScreen = document.getElementById('appScreen');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (appScreen) appScreen.style.display = 'flex';
        
        // Atualizar informações do usuário
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
        
        if (loginScreen) {
            loginScreen.style.display = 'flex';
            // Limpar formulário
            const loginForm = document.getElementById('loginForm');
            if (loginForm) loginForm.reset();
        }
        if (appScreen) appScreen.style.display = 'none';
    }
    
    isAuthenticated() {
        return !!(this.session && this.currentUser);
    }
}

// Instância global de autenticação
const auth = new Auth();

// Aguardar o DOM carregar e Supabase inicializar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando aplicação...');
    
    // Aguardar um momento para garantir que o Supabase inicializou
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verificar se Supabase está disponível
    if (!supabase) {
        console.error('❌ Supabase não encontrado. Verifique:');
        console.error('1. Se o arquivo js/config.js existe');
        console.error('2. Se as credenciais estão corretas');
        console.error('3. Se a URL do Supabase está acessível');
        
        // Mostrar mensagem na tela
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.innerHTML = `
                <strong>⚠️ Erro de Configuração</strong><br>
                Sistema não inicializado. Verifique:<br>
                1. Arquivo js/config.js<br>
                2. Credenciais do Supabase<br>
                3. Console do navegador (F12)
            `;
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    // Inicializar autenticação
    const initialized = await auth.init();
    
    if (!initialized) {
        console.error('❌ Falha na inicialização da autenticação');
    }
    
    // Configurar eventos de login
    setupLoginEvents();
});

function setupLoginEvents() {
    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email')?.value;
            const password = document.getElementById('password')?.value;
            const btnLogin = document.getElementById('btnLogin');
            const errorDiv = document.getElementById('loginError');
            
            // Validações básicas
            if (!email || !password) {
                if (errorDiv) {
                    errorDiv.textContent = 'Preencha todos os campos';
                    errorDiv.style.display = 'block';
                }
                return;
            }
            
            // Desabilitar botão
            if (btnLogin) {
                btnLogin.disabled = true;
                btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
            }
            
            // Esconder erro anterior
            if (errorDiv) errorDiv.style.display = 'none';
            
            // Tentar login
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
    const forgotLink = document.getElementById('forgotPassword');
    if (forgotLink) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            const loginFormDiv = document.querySelector('.login-form');
            const resetDiv = document.getElementById('resetPasswordForm');
            
            if (loginFormDiv) loginFormDiv.style.display = 'none';
            if (resetDiv) resetDiv.style.display = 'block';
        });
    }
    
    // Back to Login
    const backBtn = document.getElementById('backToLogin');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            const loginFormDiv = document.querySelector('.login-form');
            const resetDiv = document.getElementById('resetPasswordForm');
            
            if (loginFormDiv) loginFormDiv.style.display = 'block';
            if (resetDiv) resetDiv.style.display = 'none';
        });
    }
    
    // Reset Password Form
    const resetForm = document.getElementById('resetForm');
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('resetEmail')?.value;
            const messageDiv = document.getElementById('resetMessage');
            const submitBtn = resetForm.querySelector('button[type="submit"]');
            
            if (!email) {
                if (messageDiv) {
                    messageDiv.textContent = 'Digite seu e-mail';
                    messageDiv.className = 'error-message';
                    messageDiv.style.display = 'block';
                }
                return;
            }
            
            // Desabilitar botão
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            }
            
            const result = await auth.resetPassword(email);
            
            if (messageDiv) {
                messageDiv.textContent = result.message;
                messageDiv.className = result.success ? 'success-message' : 'error-message';
                messageDiv.style.display = 'block';
            }
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar';
            }
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => auth.logout());
    }
    
    // Menu Toggle para Mobile
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.toggle('show');
        });
    }
}