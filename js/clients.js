// js/clients.js - Módulo de Clientes (VERSÃO CORRIGIDA)
console.log('📦 Carregando módulo de clientes...');

// ============================================
// FUNÇÃO PRINCIPAL - Carrega a página
// ============================================
async function loadClients() {
    const contentArea = document.getElementById('contentArea');
    document.getElementById('pageTitle').textContent = 'Clientes';
    
    contentArea.innerHTML = `
        <div class="table-container">
            <div class="table-header">
                <h2>Gerenciamento de Clientes</h2>
                <div class="table-actions">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="searchClient" placeholder="Buscar por nome ou documento...">
                    </div>
                    <button class="btn-primary" onclick="showClientModal()">
                        <i class="fas fa-plus"></i> Novo Cliente
                    </button>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>E-mail</th>
                        <th>Celular</th>
                        <th>CPF/CNPJ</th>
                        <th>Data Cadastro</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="clientsTableBody">
                    <tr>
                        <td colspan="6" style="text-align: center;">Carregando...</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <!-- Modal de Cliente -->
        <div id="clientModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="clientModalTitle">Novo Cliente</h3>
                    <button class="modal-close" onclick="closeModal('clientModal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="clientForm">
                    <input type="hidden" id="clientId">
                    
                    <div class="form-group">
                        <label>Nome Completo *</label>
                        <input type="text" id="clientName" required>
                    </div>
                    
                    <div class="form-group">
                        <label>E-mail</label>
                        <input type="email" id="clientEmail">
                    </div>
                    
                    <div class="form-group">
                        <label>Celular *</label>
                        <input type="tel" id="clientPhone" placeholder="(00) 00000-0000">
                    </div>
                    
                    <div class="form-group">
                        <label>Data de Nascimento</label>
                        <input type="date" id="clientBirthdate">
                    </div>
                    
                    <div class="form-group">
                        <label>CPF/CNPJ</label>
                        <input type="text" id="clientDocument" placeholder="000.000.000-00 ou 00.000.000/0000-00">
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeModal('clientModal')">
                            Cancelar
                        </button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i> Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Carregar lista
    await refreshClientsList();
    
    // Event listeners
    document.getElementById('searchClient').addEventListener('input', debounce(searchClients, 300));
    document.getElementById('clientForm').addEventListener('submit', handleClientSubmit);
    document.getElementById('clientPhone').addEventListener('input', maskPhone);
    document.getElementById('clientDocument').addEventListener('input', maskDocument);
}

// ============================================
// CARREGAR LISTA DE CLIENTES
// ============================================
async function refreshClientsList(searchTerm = '') {
    const tbody = document.getElementById('clientsTableBody');
    
    try {
        let query = supabaseClient
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (searchTerm) {
            query = query.or(`name.ilike.%${searchTerm}%,document.ilike.%${searchTerm}%`);
        }
        
        const { data: clients, error } = await query;
        
        if (error) throw error;
        
        if (!clients || clients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <i class="fas fa-users" style="font-size: 48px; color: #cbd5e0;"></i>
                        <p style="color: #718096; margin-top: 15px;">Nenhum cliente encontrado</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = clients.map(client => `
            <tr>
                <td><strong>${client.name || ''}</strong></td>
                <td>${client.email || '-'}</td>
                <td>${client.phone || '-'}</td>
                <td>${client.document || '-'}</td>
                <td>${formatDate(client.created_at)}</td>
                <td>
                    <button class="btn-primary btn-sm" onclick="editClient('${client.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-danger btn-sm" onclick="deleteClient('${client.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('❌ Erro ao carregar clientes:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: red;">
                    Erro ao carregar: ${error.message}
                </td>
            </tr>
        `;
    }
}

// ============================================
// BUSCAR CLIENTES
// ============================================
async function searchClients() {
    const searchTerm = document.getElementById('searchClient').value;
    await refreshClientsList(searchTerm);
}

// ============================================
// MOSTRAR MODAL
// ============================================
function showClientModal(clientId = null) {
    const modal = document.getElementById('clientModal');
    const title = document.getElementById('clientModalTitle');
    
    // Limpar formulário
    document.getElementById('clientForm').reset();
    document.getElementById('clientId').value = '';
    
    if (clientId) {
        title.textContent = 'Editar Cliente';
        loadClientData(clientId);
    } else {
        title.textContent = 'Novo Cliente';
    }
    
    modal.classList.add('show');
}

// ============================================
// CARREGAR DADOS PARA EDIÇÃO
// ============================================
async function loadClientData(clientId) {
    try {
        const { data: client, error } = await supabaseClient
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();
        
        if (error) throw error;
        
        if (client) {
            document.getElementById('clientId').value = client.id;
            document.getElementById('clientName').value = client.name || '';
            document.getElementById('clientEmail').value = client.email || '';
            document.getElementById('clientPhone').value = client.phone || '';
            document.getElementById('clientBirthdate').value = client.birthdate || '';
            document.getElementById('clientDocument').value = client.document || '';
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar cliente:', error);
        alert('Erro ao carregar dados do cliente');
    }
}

// ============================================
// EDITAR CLIENTE
// ============================================
function editClient(clientId) {
    showClientModal(clientId);
}

// ============================================
// SALVAR CLIENTE (INSERIR OU ATUALIZAR)
// ============================================
async function handleClientSubmit(e) {
    e.preventDefault();
    
    const clientId = document.getElementById('clientId').value;
    const clientData = {
        name: document.getElementById('clientName').value.trim(),
        email: document.getElementById('clientEmail').value.trim() || null,
        phone: document.getElementById('clientPhone').value.trim(),
        birthdate: document.getElementById('clientBirthdate').value || null,
        document: document.getElementById('clientDocument').value.trim() || null
    };
    
    // Validações
    if (!clientData.name) {
        alert('❌ Nome é obrigatório!');
        return;
    }
    
    if (!clientData.phone) {
        alert('❌ Celular é obrigatório!');
        return;
    }
    
    console.log('📤 Salvando cliente:', clientData);
    
    try {
        let result;
        
        if (clientId) {
            // ATUALIZAR
            result = await supabaseClient
                .from('clients')
                .update({ 
                    ...clientData, 
                    updated_at: new Date().toISOString() 
                })
                .eq('id', clientId)
                .select();
        } else {
            // INSERIR NOVO
            result = await supabaseClient
                .from('clients')
                .insert({ 
                    ...clientData, 
                    created_at: new Date().toISOString() 
                })
                .select();
        }
        
        console.log('✅ Resultado:', result);
        
        if (result.error) {
            throw result.error;
        }
        
        alert('✅ Cliente salvo com sucesso!');
        closeModal('clientModal');
        await refreshClientsList();
        
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        alert('Erro ao salvar cliente: ' + (error.message || 'Erro desconhecido'));
    }
}

// ============================================
// EXCLUIR CLIENTE
// ============================================
async function deleteClient(clientId) {
    if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita!')) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('clients')
            .delete()
            .eq('id', clientId);
        
        if (error) throw error;
        
        alert('✅ Cliente excluído com sucesso!');
        await refreshClientsList();
        
    } catch (error) {
        console.error('❌ Erro ao excluir:', error);
        
        // Se o cliente tem vendas vinculadas
        if (error.message.includes('foreign key')) {
            alert('Não é possível excluir este cliente pois existem vendas vinculadas a ele.');
        } else {
            alert('Erro ao excluir cliente: ' + error.message);
        }
    }
}

// ============================================
// FECHAR MODAL
// ============================================
function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('show');
}

// ============================================
// MÁSCARA DE TELEFONE
// ============================================
function maskPhone(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);
    
    if (value.length > 2) {
        value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
    }
    if (value.length > 10) {
        value = `${value.substring(0, 10)}-${value.substring(10)}`;
    }
    
    e.target.value = value;
}

// ============================================
// MÁSCARA DE DOCUMENTO (CPF/CNPJ)
// ============================================
function maskDocument(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
        // CPF: 000.000.000-00
        if (value.length > 9) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (value.length > 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
        } else if (value.length > 3) {
            value = value.replace(/(\d{3})(\d{3})/, '$1.$2');
        }
    } else {
        // CNPJ: 00.000.000/0000-00
        if (value.length > 14) value = value.substring(0, 14);
        if (value.length > 12) {
            value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        } else if (value.length > 8) {
            value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '$1.$2.$3/$4');
        } else if (value.length > 5) {
            value = value.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
        } else if (value.length > 2) {
            value = value.replace(/(\d{2})(\d{3})/, '$1.$2');
        }
    }
    
    e.target.value = value;
}

// ============================================
// FORMATAR DATA
// ============================================
function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// ============================================
// DEBOUNCE PARA BUSCA
// ============================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// EXPORTAR FUNÇÕES GLOBAIS
// ============================================
window.showClientModal = showClientModal;
window.editClient = editClient;
window.deleteClient = deleteClient;
window.closeModal = closeModal;

console.log('✅ Módulo de Clientes carregado com sucesso!');