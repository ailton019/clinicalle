// js/auth.js - Versão com Reset de Senha Sem Link Externo
console.log('🔐 Carregando módulo de autenticação...');

class Auth {
    constructor() {
        this.currentUser = null;
        this.session = null;
        this.loginEventFired = false;
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

        // ============================================
        // VERIFICAR SE VEIO DO LINK DE RESET DE SENHA
        // ============================================
        const hash = window.location.hash;
        if (hash && (hash.includes('type=recovery') || hash.includes('type=signup') || hash.includes('access_token'))) {
            console.log('🔑 Detectado link de recuperação de senha!');
            this.mostrarFormularioResetSenha();
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
                
                // Só redireciona para o dashboard se estiver na tela de login ou index.html
                const path = window.location.pathname;
                if (path.endsWith('login.html') || path.endsWith('index.html') || path === '/' || path.endsWith('/')) {
                    setTimeout(() => {
                        this.carregarDashboard();
                    }, 500);
                }
            }
            
            return true;
        } catch (error) {
            console.error('❌ Erro na inicialização:', error.message);
            return false;
        }
    }
    
    // ============================================
    // MOSTRAR FORMULÁRIO DE RESET DE SENHA
    // ============================================
    mostrarFormularioResetSenha() {
        const loginScreen = document.getElementById('loginScreen');
        const appScreen = document.getElementById('appScreen');
        
        if (appScreen) appScreen.style.display = 'none';
        if (loginScreen) {
            loginScreen.style.display = 'flex';
            loginScreen.innerHTML = `
                <div class="login-box">
                    <div class="login-header">
                        <i class="fas fa-lock"></i>
                        <h1>Redefinir Senha</h1>
                        <p>Digite sua nova senha abaixo</p>
                    </div>
                    
                    <form id="newPasswordForm" class="login-form">
                        <div class="form-group">
                            <label><i class="fas fa-key"></i> Nova Senha</label>
                            <input type="password" id="newPassword" required 
                                   placeholder="Mínimo 6 caracteres" minlength="6">
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fas fa-check-circle"></i> Confirmar Senha</label>
                            <input type="password" id="confirmNewPassword" required 
                                   placeholder="Repita a senha" minlength="6">
                        </div>
                        
                        <button type="submit" class="btn-login" id="btnResetPassword">
                            <i class="fas fa-save"></i> Redefinir Senha
                        </button>
                        
                        <div id="resetPasswordMessage" class="error-message" style="display: none;"></div>
                    </form>
                </div>
            `;
            
            // Adicionar evento ao formulário
            document.getElementById('newPasswordForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.redefinirSenha();
            });
        }
    }
    
    // ============================================
    // REDEFINIR SENHA APÓS LINK
    // ============================================
    async redefinirSenha() {
        const supabase = this.getSupabase();
        const password = document.getElementById('newPassword')?.value;
        const confirmPassword = document.getElementById('confirmNewPassword')?.value;
        const btnReset = document.getElementById('btnResetPassword');
        const messageDiv = document.getElementById('resetPasswordMessage');
        
        if (!password || password.length < 6) {
            this.showMessage(messageDiv, 'A senha deve ter no mínimo 6 caracteres', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showMessage(messageDiv, 'As senhas não coincidem', 'error');
            return;
        }
        
        if (btnReset) {
            btnReset.disabled = true;
            btnReset.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redefinindo...';
        }
        
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });
            
            if (error) throw error;
            
            this.showMessage(messageDiv, '✅ Senha redefinida com sucesso! Redirecionando...', 'success');
            
            // Redirecionar para o login após 2 segundos
            setTimeout(() => {
                window.location.href = window.location.origin + window.location.pathname;
            }, 2000);
            
        } catch (error) {
            console.error('❌ Erro:', error);
            this.showMessage(messageDiv, 'Erro: ' + error.message, 'error');
            if (btnReset) {
                btnReset.disabled = false;
                btnReset.innerHTML = '<i class="fas fa-save"></i> Redefinir Senha';
            }
        }
    }
    
    showMessage(div, message, type) {
        if (div) {
            div.textContent = message;
            div.style.display = 'block';
            div.className = type === 'success' ? 'success-message' : 'error-message';
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
                    message = 'E-mail não confirmado. Verifique sua caixa de entrada.';
                } else if (message.includes('rate limit')) {
                    message = 'Muitas tentativas. Aguarde um momento.';
                }
                
                return { success: false, message };
            }
            
            if (!data || !data.session) {
                return { success: false, message: 'Resposta inválida do servidor' };
            }
            
            this.session = data.session;
            this.currentUser = data.user;
            this.loginEventFired = false;
            
            this.showApp();
            
            console.log('✅ Login realizado com sucesso');
            
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
    
    carregarDashboard() {
        console.log('📊 Redirecionando para dashboard...');
        window.location.href = 'dashboard.html';
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
        console.log('Redirecionando para login...');
        window.location.href = 'login.html';
    }
    
    async resetPassword(email) {
        const supabase = this.getSupabase();
        
        if (!supabase || !supabase.auth) {
            return { 
                success: false, 
                message: 'Serviço indisponível. Tente novamente.' 
            };
        }

        try {
            console.log('📧 Enviando recuperação para:', email);
            
            // URL de redirecionamento - VOLTA PARA O PRÓPRIO SITE
            const redirectUrl = window.location.origin + window.location.pathname;
            
            console.log('🔗 URL de retorno:', redirectUrl);
            
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl
            });
            
            if (error) throw error;
            
            return { 
                success: true, 
                message: '✅ E-mail enviado! Verifique sua caixa de entrada e spam.\n\nClique no link recebido para redefinir sua senha.' 
            };
        } catch (error) {
            console.error('❌ Erro:', error.message);
            
            let msg = error.message;
            if (msg.includes('rate limit')) {
                msg = 'Aguarde 60 segundos antes de tentar novamente.';
            } else if (msg.includes('not found') || msg.includes('not exist')) {
                msg = 'E-mail não encontrado. Verifique se está correto.';
            }
            
            return { 
                success: false, 
                message: msg || 'Erro ao enviar e-mail. Tente novamente.' 
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
        
        // Recarregar a página para limpar o hash da URL
        if (window.location.hash) {
            window.location.hash = '';
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
    
    // IMPORTANTE: Verificar se veio do link de reset ANTES de init
    await auth.init();
    
    // Só configura eventos se NÃO estiver na tela de reset
    if (!document.getElementById('newPasswordForm')) {
        setupEvents();
    }
    
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
        const msg = document.getElementById('resetMessage');
        if (msg) msg.style.display = 'none';
    });
    
    // Reset Password Form
    document.getElementById('resetForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('resetEmail')?.value?.trim();
        const messageDiv = document.getElementById('resetMessage');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        if (!email) {
            if (messageDiv) {
                messageDiv.textContent = 'Digite seu e-mail';
                messageDiv.className = 'error-message';
                messageDiv.style.display = 'block';
            }
            return;
        }
        
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

// Adicionar estilo para mensagem de sucesso
const style = document.createElement('style');
style.textContent = `
    .success-message {
        background: #c6f6d5 !important;
        color: #22543d !important;
        padding: 12px;
        border-radius: 8px;
        margin-top: 15px;
        font-size: 14px;
        border-left: 4px solid #38a169 !important;
    }
`;
document.head.appendChild(style);

window.auth = auth;
console.log('✅ Auth carregado!');