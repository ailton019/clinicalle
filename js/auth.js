// Authentication functions
class AuthManager {
    constructor() {
        this.supabase = supabase;
        this.setupAuthListener();
    }
    
    async login(email, password) {
        try {
            showLoading();
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            if (data.user) {
                // Get user profile
                const { data: profile } = await this.supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();
                
                window.appState.user = { ...data.user, ...profile };
                localStorage.setItem('user', JSON.stringify(window.appState.user));
                
                showToast('Login realizado com sucesso!');
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            showToast(error.message, 'error');
            console.error('Login error:', error);
        } finally {
            hideLoading();
        }
    }
    
    async register(email, password, nome) {
        try {
            showLoading();
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { nome }
                }
            });
            
            if (error) throw error;
            
            if (data.user) {
                // Create profile
                await this.supabase
                    .from('profiles')
                    .insert([{
                        id: data.user.id,
                        nome,
                        email
                    }]);
                
                showToast('Cadastro realizado! Verifique seu e-mail.');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            hideLoading();
        }
    }
    
    async logout() {
        try {
            await this.supabase.auth.signOut();
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        } catch (error) {
            showToast('Erro ao fazer logout', 'error');
        }
    }
    
    setupAuthListener() {
        this.supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
        });
    }
    
    async resetPassword(email) {
        try {
            showLoading();
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });
            
            if (error) throw error;
            
            showToast('E-mail de recuperação enviado!');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            hideLoading();
        }
    }
}

// Initialize auth on login page
if (document.getElementById('loginForm')) {
    const auth = new AuthManager();
    
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        auth.login(email, password);
    });
    
    document.getElementById('registerLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        // Show register modal or redirect
        showRegisterModal();
    });
    
    document.getElementById('forgotPassword')?.addEventListener('click', (e) => {
        e.preventDefault();
        const email = prompt('Digite seu e-mail para recuperar a senha:');
        if (email) auth.resetPassword(email);
    });
}