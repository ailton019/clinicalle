// js/usuarios.js - Gerenciamento de Usuários (Apenas Administrador)
console.log('📦 Carregando módulo de usuários...');

let usersList = [];

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================
async function loadUsers() {
    console.log('👥 loadUsers() chamada!');
    document.getElementById('pageTitle').textContent = 'Usuários';
    
    // Aguardar autenticação inicializar
    let limit = 0;
    while ((!auth.currentUser || !supabaseClient) && limit < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        limit++;
    }
    
    // Verificar permissão de admin
    const isAdmin = await checkAdminPermission();
    if (!isAdmin) {
        alert('Acesso negado! Esta tela é permitida apenas para administradores.');
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Carregar usuários
    await refreshUsersList();
    
    // Adicionar estilos de badge
    addUsersStyles();
}

/**
 * Verifica se o usuário atual é admin
 */
async function checkAdminPermission() {
    try {
        const userId = auth.currentUser?.id;
        if (!userId) return false;
        
        const { data, error } = await supabaseClient
            .from('users')
            .select('role')
            .eq('user_id', userId)
            .single();
        
        if (error) return false;
        return data.role === 'admin';
    } catch (e) {
        console.error('Erro ao checar papel do usuário:', e);
        return false;
    }
}

/**
 * Adiciona estilos específicos
 */
function addUsersStyles() {
    if (document.getElementById('usersStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'usersStyles';
    style.textContent = `
        .role-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .role-admin {
            background: #e6fffa;
            color: #319795;
        }
        .role-user {
            background: #ebf8ff;
            color: #2b6cb0;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Carrega a lista de usuários do Supabase
 */
async function refreshUsersList() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        usersList = data || [];
        
        if (usersList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center">Nenhum usuário cadastrado</td></tr>`;
            return;
        }
        
        tbody.innerHTML = usersList.map(user => {
            const isSelf = user.user_id === auth.currentUser.id;
            
            return `
                <tr>
                    <td><strong>${user.name}</strong> ${isSelf ? '<span style="color:#718096; font-size:12px;">(Você)</span>' : ''}</td>
                    <td>${user.email}</td>
                    <td>
                        <span class="role-badge role-${user.role}">
                            ${user.role === 'admin' ? 'Administrador' : 'Profissional'}
                        </span>
                    </td>
                    <td>${formatDate(user.created_at)}</td>
                    <td>
                        ${isSelf ? `
                            <span style="color:#a0aec0; font-size:12px;">Sem ações</span>
                        ` : `
                            <button class="btn-primary btn-sm" onclick="alterarPapel('${user.id}', '${user.role}')" title="Alterar Papel de Acesso">
                                <i class="fas fa-user-shield"></i> Alterar Papel
                            </button>
                        `}
                    </td>
                </tr>
            `;
        }).join('');
        
    } catch (e) {
        console.error('Erro ao carregar usuários:', e);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:red;">Erro ao carregar lista: ${e.message}</td></tr>`;
    }
}

/**
 * Altera o papel do usuário (admin/user)
 */
async function alterarPapel(id, roleAtual) {
    const user = usersList.find(u => u.id === id);
    if (!user) return;
    
    const novoPapel = roleAtual === 'admin' ? 'user' : 'admin';
    const nomePapel = novoPapel === 'admin' ? 'Administrador' : 'Profissional';
    
    const confirmed = confirm(`Deseja alterar o papel de "${user.name}" para "${nomePapel}"?`);
    if (!confirmed) return;
    
    try {
        const { error } = await supabaseClient
            .from('users')
            .update({ 
                role: novoPapel, 
                updated_at: new Date().toISOString() 
            })
            .eq('id', id);
        
        if (error) throw error;
        
        alert(`Papel de "${user.name}" atualizado com sucesso!`);
        await refreshUsersList();
        
    } catch (e) {
        console.error('Erro ao atualizar papel:', e);
        alert('Erro ao atualizar papel: ' + e.message);
    }
}

/**
 * Formata data
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Exportar funções
window.alterarPapel = alterarPapel;

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('usersTableBody')) {
        setTimeout(() => {
            loadUsers();
        }, 300);
    }
});

console.log('✅ Módulo de usuários carregado!');
