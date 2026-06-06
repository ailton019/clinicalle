// Gerenciamento de Autenticação
class Auth {
    constructor() {
        this.currentUser = null;
        this.session = null;
    }
    
    async init() {
        // Verificar sessão existente
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            this.session = session;
            this.currentUser = session.user;
            this.showApp();
        }
    }
    
    async login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            this.session = data.session;
            this.currentUser = data.user;
            this.showApp();
            
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    
    async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            this.currentUser = null;
            this.session = null;
            this.showLogin();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    }
    
    async resetPassword(email) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin
            });
            
            if (error) throw error;
            
            return { success: true, message: 'E-mail de recuperação enviado!' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    
    showApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appScreen').style.display = 'flex';
        
        // Atualizar informações do usuário
        document.getElementById('userName').textContent = 
            this.currentUser?.user_metadata?.name || this.currentUser?.email;
        
        // Carregar dashboard
        loadDashboard();
    }
    
    showLogin() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('appScreen').style.display = 'none';
    }
    
    isAuthenticated() {
        return !!this.session;
    }
}

// Instância global de autenticação
const auth = new Auth();

// Event Listeners para Login
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar autenticação
    auth.init();
    
    // Login Form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btnLogin = document.getElementById('btnLogin');
        const errorDiv = document.getElementById('loginError');
        
        // Desabilitar botão
        btnLogin.disabled = true;
        btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
        
        const result = await auth.login(email, password);
        
        if (!result.success) {
            errorDiv.textContent = result.message;
            errorDiv.style.display = 'block';
            btnLogin.disabled = false;
            btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
        }
    });
    
    // Forgot Password
    document.getElementById('forgotPassword').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.login-form').style.display = 'none';
        document.getElementById('resetPasswordForm').style.display = 'block';
    });
    
    // Back to Login
    document.getElementById('backToLogin').addEventListener('click', () => {
        document.querySelector('.login-form').style.display = 'block';
        document.getElementById('resetPasswordForm').style.display = 'none';
    });
    
    // Reset Password Form
    document.getElementById('resetForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('resetEmail').value;
        const messageDiv = document.getElementById('resetMessage');
        
        const result = await auth.resetPassword(email);
        
        messageDiv.textContent = result.message;
        messageDiv.style.display = 'block';
        
        if (result.success) {
            messageDiv.className = 'success-message';
        } else {
            messageDiv.className = 'error-message';
        }
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        auth.logout();
    });
    
    // Menu Toggle para Mobile
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('show');
    });
});