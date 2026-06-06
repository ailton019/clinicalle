// Módulo de Clientes
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
                        <td colspan="6" class="text-center">Carregando...</td>
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
                        <input type="tel" id="clientPhone"  
                               placeholder="(00) 00000-0000"
                               pattern="\([0-9]{2}\) [0-9]{5}-[0-9]{4}">
                    </div>
                    
                    <div class="form-group">
                        <label>Data de Nascimento</label>
                        <input type="date" id="clientBirthdate">
                    </div>
                    
                    <div class="form-group">
                        <label>CPF/CNPJ</label>
                        <input type="text" id="clientDocument" 
                               placeholder="000.000.000-00 ou 00.000.000/0000-00">
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
    
    // Carregar lista de clientes
    await refreshClientsList();
    
    // Event listeners
    document.getElementById('searchClient').addEventListener('input', debounce(searchClients, 300));
    document.getElementById('clientForm').addEventListener('submit', handleClientSubmit);
    
    // Máscara para telefone
    document.getElementById('clientPhone').addEventListener('input', maskPhone);
    // Máscara para documento
    document.getElementById('clientDocument').addEventListener('input', maskDocument);
}

async function refreshClientsList(searchTerm = '') {
    const tbody = document.getElementById('clientsTableBody');
    
    try {
        let clients;
        if (searchTerm) {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .or(`name.ilike.%${searchTerm}%,document.ilike.%${searchTerm}%`)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            clients = data;
        } else {
            clients = await DB.select('clients');
        }
        
        if (clients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">Nenhum cliente encontrado</td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = clients.map(client => `
            <tr>
                <td>${client.name}</td>
                <td>${client.email || '-'}</td>
                <td>${client.phone}</td>
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
        console.error('Erro ao carregar clientes:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">Erro ao carregar clientes</td>
            </tr>
        `;
    }
}

async function searchClients() {
    const searchTerm = document.getElementById('searchClient').value;
    await refreshClientsList(searchTerm);
}

function showClientModal(clientId = null) {
    const modal = document.getElementById('clientModal');
    const title = document.getElementById('clientModalTitle');
    
    if (clientId) {
        title.textContent = 'Editar Cliente';
        loadClientData(clientId);
    } else {
        title.textContent = 'Novo Cliente';
        document.getElementById('clientForm').reset();
        document.getElementById('clientId').value = '';
    }
    
    modal.classList.add('show');
}

async function loadClientData(clientId) {
    try {
        const client = await DB.selectById('clients', clientId);
        
        document.getElementById('clientId').value = client.id;
        document.getElementById('clientName').value = client.name;
        document.getElementById('clientEmail').value = client.email || '';
        document.getElementById('clientPhone').value = client.phone;
        document.getElementById('clientBirthdate').value = client.birthdate || '';
        document.getElementById('clientDocument').value = client.document || '';
        
    } catch (error) {
        console.error('Erro ao carregar dados do cliente:', error);
    }
}

async function editClient(clientId) {
    showClientModal(clientId);
}

async function handleClientSubmit(e) {
    e.preventDefault();
    
    const clientId = document.getElementById('clientId').value;
    const clientData = {
        name: document.getElementById('clientName').value,
        email: document.getElementById('clientEmail').value,
        phone: document.getElementById('clientPhone').value,
        birthdate: document.getElementById('clientBirthdate').value,
        document: document.getElementById('clientDocument').value
    };
    
    try {
        if (clientId) {
            await DB.update('clients', clientId, clientData);
        } else {
            await DB.insert('clients', { ...clientData, created_at: new Date() });
        }
        
        closeModal('clientModal');
        await refreshClientsList();
        
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
        alert('Erro ao salvar cliente: ' + error.message);
    }
}

async function deleteClient(clientId) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    
    try {
        await DB.delete('clients', clientId);
        await refreshClientsList();
    } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        alert('Erro ao excluir cliente');
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

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

function maskDocument(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
        // CPF
        if (value.length > 9) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (value.length > 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
        } else if (value.length > 3) {
            value = value.replace(/(\d{3})(\d{3})/, '$1.$2');
        }
    } else {
        // CNPJ
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

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
}

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