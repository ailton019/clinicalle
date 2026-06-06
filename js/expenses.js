// js/expenses.js - Módulo de Despesas
// Gerencia despesas fixas e variáveis com categorias personalizadas

// Variáveis globais do módulo
let expensesList = [];
let editingExpenseId = null;

// Categorias padrão
const DEFAULT_CATEGORIES = {
    fixed: [
        { id: 'aluguel', name: 'Aluguel', icon: 'fa-building' },
        { id: 'energia', name: 'Energia', icon: 'fa-bolt' },
        { id: 'internet', name: 'Internet', icon: 'fa-wifi' },
        { id: 'funcionario', name: 'Funcionário', icon: 'fa-users' },
        { id: 'contas', name: 'Contas', icon: 'fa-file-invoice-dollar' },
        { id: 'agua', name: 'Água', icon: 'fa-water' },
        { id: 'telefone', name: 'Telefone', icon: 'fa-phone' },
        { id: 'impostos', name: 'Impostos', icon: 'fa-landmark' },
        { id: 'seguro', name: 'Seguro', icon: 'fa-shield-alt' },
        { id: 'manutencao', name: 'Manutenção', icon: 'fa-tools' }
    ],
    variable: [
        { id: 'lanche', name: 'Lanche', icon: 'fa-hamburger' },
        { id: 'almoco', name: 'Almoço', icon: 'fa-utensils' },
        { id: 'janta', name: 'Janta', icon: 'fa-moon' },
        { id: 'agua_gas', name: 'Água/Gás', icon: 'fa-wine-bottle' },
        { id: 'transporte', name: 'Transporte', icon: 'fa-car' },
        { id: 'material', name: 'Material', icon: 'fa-box' },
        { id: 'limpeza', name: 'Limpeza', icon: 'fa-broom' },
        { id: 'escritorio', name: 'Escritório', icon: 'fa-paperclip' },
        { id: 'marketing', name: 'Marketing', icon: 'fa-bullhorn' },
        { id: 'outros', name: 'Outros', icon: 'fa-ellipsis-h' }
    ]
};

/**
 * Carrega a página de despesas
 */
async function loadExpenses() {
    const contentArea = document.getElementById('contentArea');
    document.getElementById('pageTitle').textContent = 'Despesas';
    
    contentArea.innerHTML = `
        <!-- Cards de Resumo -->
        <div class="stats-grid" style="margin-bottom: 30px;">
            <div class="stat-card danger">
                <div class="stat-icon"><i class="fas fa-money-bill-wave"></i></div>
                <div class="stat-value" id="totalExpenses">R$ 0,00</div>
                <div class="stat-label">Total de Despesas</div>
            </div>
            
            <div class="stat-card warning">
                <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
                <div class="stat-value" id="fixedExpenses">R$ 0,00</div>
                <div class="stat-label">Despesas Fixas</div>
            </div>
            
            <div class="stat-card info">
                <div class="stat-icon"><i class="fas fa-random"></i></div>
                <div class="stat-value" id="variableExpenses">R$ 0,00</div>
                <div class="stat-label">Despesas Variáveis</div>
            </div>
            
            <div class="stat-card primary">
                <div class="stat-icon"><i class="fas fa-receipt"></i></div>
                <div class="stat-value" id="totalCount">0</div>
                <div class="stat-label">Total de Registros</div>
            </div>
        </div>
        
        <!-- Filtros -->
        <div class="filters-bar">
            <button class="filter-btn active" data-period="today">Hoje</button>
            <button class="filter-btn" data-period="7days">7 Dias</button>
            <button class="filter-btn" data-period="30days">30 Dias</button>
            <button class="filter-btn" data-period="month">Este Mês</button>
            <button class="filter-btn" data-period="all">Todos</button>
            <select id="filterType" style="margin-left: auto; padding: 8px 16px; border: 2px solid #e2e8f0; border-radius: 8px;">
                <option value="all">Todos os Tipos</option>
                <option value="fixed">Despesas Fixas</option>
                <option value="variable">Despesas Variáveis</option>
            </select>
            <select id="filterCategory" style="padding: 8px 16px; border: 2px solid #e2e8f0; border-radius: 8px;">
                <option value="all">Todas Categorias</option>
            </select>
        </div>
        
        <!-- Tabela de Despesas -->
        <div class="table-container">
            <div class="table-header">
                <h2>Registro de Despesas</h2>
                <div class="table-actions">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="searchExpense" placeholder="Buscar por descrição...">
                    </div>
                    <button class="btn-primary" onclick="showExpenseModal()">
                        <i class="fas fa-plus"></i> Nova Despesa
                    </button>
                </div>
            </div>
            
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th>Categoria</th>
                            <th>Tipo</th>
                            <th>Valor</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="expensesTableBody">
                        <tr>
                            <td colspan="6" class="text-center">
                                <i class="fas fa-spinner fa-spin"></i> Carregando...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Modal de Despesa -->
        <div id="expenseModal" class="modal">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3 id="expenseModalTitle">
                        <i class="fas fa-money-bill-wave"></i> Nova Despesa
                    </h3>
                    <button class="modal-close" onclick="closeExpenseModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="expenseForm">
                    <input type="hidden" id="expenseId">
                    
                    <!-- Tipo de Despesa -->
                    <div class="form-group">
                        <label><i class="fas fa-tag"></i> Tipo de Despesa *</label>
                        <div style="display: flex; gap: 10px;">
                            <label style="flex: 1; cursor: pointer;">
                                <input type="radio" name="expenseType" value="fixed" checked onchange="updateCategorySelect()">
                                <span style="margin-left: 5px;">
                                    <i class="fas fa-calendar-check"></i> Despesa Fixa
                                </span>
                            </label>
                            <label style="flex: 1; cursor: pointer;">
                                <input type="radio" name="expenseType" value="variable" onchange="updateCategorySelect()">
                                <span style="margin-left: 5px;">
                                    <i class="fas fa-random"></i> Despesa Variável
                                </span>
                            </label>
                        </div>
                    </div>
                    
                    <!-- Categoria -->
                    <div class="form-group">
                        <label><i class="fas fa-folder"></i> Categoria *</label>
                        <div style="display: flex; gap: 10px;">
                            <select id="expenseCategory" required style="flex: 1;" onchange="onCategoryChange()">
                                <option value="">Selecione uma categoria...</option>
                            </select>
                            <button type="button" class="btn-secondary" onclick="showCustomCategoryInput()" title="Categoria personalizada">
                                <i class="fas fa-plus-circle"></i>
                            </button>
                        </div>
                        <!-- Campo para categoria personalizada -->
                        <div id="customCategoryGroup" style="display: none; margin-top: 10px;">
                            <input type="text" id="customCategory" 
                                   placeholder="Digite o nome da categoria"
                                   style="width: 100%;"
                                   maxlength="50">
                        </div>
                    </div>
                    
                    <!-- Descrição -->
                    <div class="form-group">
                        <label><i class="fas fa-file-alt"></i> Descrição *</label>
                        <input type="text" id="expenseDescription" 
                               required 
                               placeholder="Descreva a despesa..."
                               maxlength="200">
                    </div>
                    
                    <!-- Valor e Data -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="form-group">
                            <label><i class="fas fa-dollar-sign"></i> Valor (R$) *</label>
                            <input type="text" id="expenseValue" 
                                   required 
                                   placeholder="0,00"
                                   class="money-input"
                                   oninput="formatMoneyInput(this)">
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fas fa-calendar"></i> Data *</label>
                            <input type="date" id="expenseDate" required>
                        </div>
                    </div>
                    
                    <!-- Observação -->
                    <div class="form-group">
                        <label><i class="fas fa-sticky-note"></i> Observação</label>
                        <textarea id="expenseObservation" 
                                  rows="3" 
                                  placeholder="Observações adicionais (opcional)"
                                  maxlength="500"></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeExpenseModal()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i> Salvar Despesa
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Modal de Visualização -->
        <div id="viewExpenseModal" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Detalhes da Despesa</h3>
                    <button class="modal-close" onclick="closeModal('viewExpenseModal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="expenseDetails"></div>
            </div>
        </div>
    `;
    
    // Configurar data atual
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    
    // Inicializar selects de categoria
    updateCategorySelect();
    updateFilterCategories();
    
    // Carregar dados
    await refreshExpensesList();
    
    // Event Listeners
    document.getElementById('expenseForm').addEventListener('submit', handleExpenseSubmit);
    document.getElementById('searchExpense').addEventListener('input', debounce(searchExpenses, 300));
    document.getElementById('filterType').addEventListener('change', () => refreshExpensesList());
    document.getElementById('filterCategory').addEventListener('change', () => refreshExpensesList());
    
    // Filtros de período
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            await refreshExpensesList();
        });
    });
    
    // Adicionar estilos
    addExpenseStyles();
}

/**
 * Adiciona estilos específicos para despesas
 */
function addExpenseStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .expense-type-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .type-fixed {
            background: #fefcbf;
            color: #744210;
        }
        
        .type-variable {
            background: #ebf8ff;
            color: #2b6cb0;
        }
        
        .category-icon {
            width: 30px;
            height: 30px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            margin-right: 8px;
            font-size: 14px;
        }
        
        .category-fixed {
            background: #fefcbf;
            color: #744210;
        }
        
        .category-variable {
            background: #ebf8ff;
            color: #2b6cb0;
        }
        
        .expense-value-high {
            color: #e53e3e;
            font-weight: 700;
        }
        
        .expense-value-medium {
            color: #d69e2e;
            font-weight: 600;
        }
        
        .expense-value-low {
            color: #718096;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Atualiza o select de categorias baseado no tipo
 */
function updateCategorySelect() {
    const typeRadio = document.querySelector('input[name="expenseType"]:checked');
    const type = typeRadio ? typeRadio.value : 'fixed';
    const select = document.getElementById('expenseCategory');
    const customGroup = document.getElementById('customCategoryGroup');
    
    const categories = type === 'fixed' ? DEFAULT_CATEGORIES.fixed : DEFAULT_CATEGORIES.variable;
    
    select.innerHTML = '<option value="">Selecione uma categoria...</option>' +
        categories.map(cat => 
            `<option value="${cat.id}">${cat.name}</option>`
        ).join('');
    
    // Esconder campo customizado se não estiver selecionado "outros"
    customGroup.style.display = 'none';
    document.getElementById('customCategory').value = '';
}

/**
 * Atualiza categorias nos filtros
 */
function updateFilterCategories() {
    const filterSelect = document.getElementById('filterCategory');
    
    const allCategories = [
        ...DEFAULT_CATEGORIES.fixed.map(c => ({ ...c, type: 'fixed' })),
        ...DEFAULT_CATEGORIES.variable.map(c => ({ ...c, type: 'variable' }))
    ];
    
    filterSelect.innerHTML = '<option value="all">Todas Categorias</option>' +
        allCategories.map(cat => 
            `<option value="${cat.id}">${cat.type === 'fixed' ? '📌' : '🔄'} ${cat.name}</option>`
        ).join('');
}

/**
 * Evento ao mudar categoria
 */
function onCategoryChange() {
    const select = document.getElementById('expenseCategory');
    const customGroup = document.getElementById('customCategoryGroup');
    
    if (select.value === 'outros') {
        customGroup.style.display = 'block';
        document.getElementById('customCategory').focus();
    } else {
        customGroup.style.display = 'none';
    }
}

/**
 * Mostra input de categoria personalizada
 */
function showCustomCategoryInput() {
    const customGroup = document.getElementById('customCategoryGroup');
    const select = document.getElementById('expenseCategory');
    
    customGroup.style.display = 'block';
    select.value = 'outros';
    document.getElementById('customCategory').focus();
}

/**
 * Abre modal de nova despesa
 */
function showExpenseModal(expenseId = null) {
    const modal = document.getElementById('expenseModal');
    const title = document.getElementById('expenseModalTitle');
    const form = document.getElementById('expenseForm');
    
    form.reset();
    document.getElementById('expenseId').value = '';
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    document.querySelector('input[name="expenseType"][value="fixed"]').checked = true;
    document.getElementById('customCategoryGroup').style.display = 'none';
    
    if (expenseId) {
        title.innerHTML = '<i class="fas fa-edit"></i> Editar Despesa';
        loadExpenseData(expenseId);
    } else {
        title.innerHTML = '<i class="fas fa-money-bill-wave"></i> Nova Despesa';
    }
    
    updateCategorySelect();
    modal.classList.add('show');
}

/**
 * Carrega dados da despesa para edição
 */
async function loadExpenseData(expenseId) {
    try {
        const { data: expense, error } = await supabaseClient
            .from('expenses')
            .select('*')
            .eq('id', expenseId)
            .single();
        
        if (error) throw error;
        
        if (expense) {
            document.getElementById('expenseId').value = expense.id;
            document.getElementById('expenseDescription').value = expense.description;
            document.getElementById('expenseValue').value = formatMoneyValue(expense.value);
            document.getElementById('expenseDate').value = expense.date;
            document.getElementById('expenseObservation').value = expense.observation || '';
            
            // Selecionar tipo
            const typeRadio = document.querySelector(`input[name="expenseType"][value="${expense.type}"]`);
            if (typeRadio) typeRadio.checked = true;
            
            updateCategorySelect();
            
            // Selecionar categoria
            setTimeout(() => {
                const categorySelect = document.getElementById('expenseCategory');
                if (categorySelect) {
                    // Verificar se a categoria existe na lista
                    const optionExists = Array.from(categorySelect.options).some(opt => opt.value === expense.category);
                    
                    if (optionExists) {
                        categorySelect.value = expense.category;
                    } else {
                        // Categoria personalizada
                        categorySelect.value = 'outros';
                        document.getElementById('customCategoryGroup').style.display = 'block';
                        document.getElementById('customCategory').value = expense.category;
                    }
                }
            }, 100);
        }
        
    } catch (error) {
        console.error('Erro ao carregar despesa:', error);
        alert('Erro ao carregar dados da despesa');
    }
}

/**
 * Manipula o envio do formulário de despesa
 */
async function handleExpenseSubmit(e) {
    e.preventDefault();
    
    const expenseId = document.getElementById('expenseId').value;
    const typeRadio = document.querySelector('input[name="expenseType"]:checked');
    const type = typeRadio ? typeRadio.value : 'fixed';
    
    let category = document.getElementById('expenseCategory').value;
    const customCategory = document.getElementById('customCategory').value.trim();
    
    // Se selecionou "outros", usar a categoria personalizada
    if (category === 'outros' && customCategory) {
        category = customCategory;
    }
    
    const description = document.getElementById('expenseDescription').value.trim();
    const value = parseMoneyValue(document.getElementById('expenseValue').value);
    const date = document.getElementById('expenseDate').value;
    const observation = document.getElementById('expenseObservation').value.trim();
    
    // Validações
    if (!type) {
        alert('Selecione o tipo de despesa');
        return;
    }
    
    if (!category) {
        alert('Selecione ou digite uma categoria');
        return;
    }
    
    if (!description) {
        alert('A descrição é obrigatória');
        return;
    }
    
    if (!value || value <= 0) {
        alert('Informe um valor válido');
        return;
    }
    
    if (!date) {
        alert('Selecione a data');
        return;
    }
    
    const expenseData = {
        type: type,
        category: category,
        description: description,
        value: value,
        date: date,
        observation: observation || null
    };
    
    try {
        const submitBtn = document.querySelector('#expenseForm button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        
        if (expenseId) {
            // Atualizar despesa existente
            const { error } = await supabaseClient
                .from('expenses')
                .update({
                    ...expenseData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', expenseId);
            
            if (error) throw error;
            
            showToast('Despesa atualizada com sucesso!', 'success');
        } else {
            // Nova despesa
            const { error } = await supabaseClient
                .from('expenses')
                .insert({
                    ...expenseData,
                    created_at: new Date().toISOString()
                });
            
            if (error) throw error;
            
            showToast('Despesa registrada com sucesso!', 'success');
        }
        
        closeExpenseModal();
        await refreshExpensesList();
        
    } catch (error) {
        console.error('Erro ao salvar despesa:', error);
        alert('Erro ao salvar despesa: ' + error.message);
    } finally {
        const submitBtn = document.querySelector('#expenseForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Despesa';
        }
    }
}

/**
 * Atualiza a lista de despesas
 */
async function refreshExpensesList(searchTerm = '') {
    const tbody = document.getElementById('expensesTableBody');
    
    try {
        // Obter filtros ativos
        const activePeriod = document.querySelector('.filter-btn.active')?.dataset?.period || 'today';
        const filterType = document.getElementById('filterType')?.value || 'all';
        const filterCategory = document.getElementById('filterCategory')?.value || 'all';
        
        let query = supabaseClient
            .from('expenses')
            .select('*')
            .order('date', { ascending: false })
            .order('created_at', { ascending: false });
        
        // Filtro de período
        if (activePeriod !== 'all') {
            const { startDate, endDate } = getDateRange(activePeriod);
            query = query
                .gte('date', startDate.split('T')[0])
                .lte('date', endDate.split('T')[0]);
        }
        
        // Filtro de tipo
        if (filterType !== 'all') {
            query = query.eq('type', filterType);
        }
        
        // Filtro de categoria
        if (filterCategory !== 'all') {
            query = query.eq('category', filterCategory);
        }
        
        // Busca por texto
        if (searchTerm) {
            query = query.or(`description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        expensesList = data || [];
        
        // Atualizar cards de resumo
        updateExpensesSummary(expensesList);
        
        if (expensesList.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center" style="padding: 40px;">
                        <i class="fas fa-receipt" style="font-size: 48px; color: #cbd5e0; display: block; margin-bottom: 15px;"></i>
                        <p style="color: #718096; font-size: 16px;">Nenhuma despesa encontrada</p>
                        <button class="btn-primary" onclick="showExpenseModal()" style="margin-top: 15px;">
                            <i class="fas fa-plus"></i> Registrar Despesa
                        </button>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = expensesList.map(expense => {
            const value = parseFloat(expense.value) || 0;
            let valueClass = 'expense-value-low';
            if (value > 500) valueClass = 'expense-value-high';
            else if (value > 100) valueClass = 'expense-value-medium';
            
            // Buscar ícone da categoria
            const categoryInfo = findCategoryInfo(expense.category, expense.type);
            
            return `
                <tr>
                    <td>
                        <span style="white-space: nowrap;">
                            <i class="far fa-calendar-alt" style="color: #718096; margin-right: 5px;"></i>
                            ${formatDateShort(expense.date)}
                        </span>
                    </td>
                    <td>
                        <strong>${expense.description}</strong>
                        ${expense.observation ? `
                            <br><small style="color: #718096;" title="${expense.observation}">
                                <i class="fas fa-sticky-note"></i> ${expense.observation.substring(0, 50)}${expense.observation.length > 50 ? '...' : ''}
                            </small>
                        ` : ''}
                    </td>
                    <td>
                        <span class="category-icon category-${expense.type}">
                            <i class="fas ${categoryInfo.icon}"></i>
                        </span>
                        ${categoryInfo.name}
                    </td>
                    <td>
                        <span class="expense-type-badge type-${expense.type}">
                            <i class="fas ${expense.type === 'fixed' ? 'fa-lock' : 'fa-random'}"></i>
                            ${expense.type === 'fixed' ? 'Fixa' : 'Variável'}
                        </span>
                    </td>
                    <td>
                        <span class="${valueClass}">
                            ${formatCurrency(value)}
                        </span>
                    </td>
                    <td>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn-primary btn-sm" onclick="editExpense('${expense.id}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-secondary btn-sm" onclick="viewExpense('${expense.id}')" title="Visualizar">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-danger btn-sm" onclick="deleteExpense('${expense.id}')" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erro ao carregar despesas:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #e53e3e; display: block; margin-bottom: 15px;"></i>
                    <p style="color: #e53e3e;">Erro ao carregar despesas</p>
                    <small style="color: #718096;">${error.message}</small>
                    <br>
                    <button class="btn-primary" onclick="refreshExpensesList()" style="margin-top: 15px;">
                        <i class="fas fa-sync"></i> Tentar Novamente
                    </button>
                </td>
            </tr>
        `;
    }
}

/**
 * Atualiza os cards de resumo
 */
function updateExpensesSummary(expenses) {
    const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.value) || 0), 0);
    const fixedExpenses = expenses
        .filter(exp => exp.type === 'fixed')
        .reduce((sum, exp) => sum + (parseFloat(exp.value) || 0), 0);
    const variableExpenses = expenses
        .filter(exp => exp.type === 'variable')
        .reduce((sum, exp) => sum + (parseFloat(exp.value) || 0), 0);
    const totalCount = expenses.length;
    
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('fixedExpenses').textContent = formatCurrency(fixedExpenses);
    document.getElementById('variableExpenses').textContent = formatCurrency(variableExpenses);
    document.getElementById('totalCount').textContent = totalCount;
}

/**
 * Busca informações da categoria
 */
function findCategoryInfo(categoryId, type) {
    const categories = type === 'fixed' ? DEFAULT_CATEGORIES.fixed : DEFAULT_CATEGORIES.variable;
    const found = categories.find(c => c.id === categoryId);
    
    if (found) return found;
    
    // Categoria personalizada
    return {
        name: categoryId || 'Sem categoria',
        icon: type === 'fixed' ? 'fa-tag' : 'fa-tags'
    };
}

/**
 * Edita uma despesa
 */
async function editExpense(expenseId) {
    showExpenseModal(expenseId);
}

/**
 * Visualiza detalhes da despesa
 */
async function viewExpense(expenseId) {
    try {
        const { data: expense, error } = await supabaseClient
            .from('expenses')
            .select('*')
            .eq('id', expenseId)
            .single();
        
        if (error) throw error;
        
        const categoryInfo = findCategoryInfo(expense.category, expense.type);
        
        const detailsDiv = document.getElementById('expenseDetails');
        detailsDiv.innerHTML = `
            <div style="padding: 20px;">
                <div style="text-align: center; margin-bottom: 25px;">
                    <div class="category-icon category-${expense.type}" style="width: 60px; height: 60px; font-size: 24px; margin: 0 auto 10px;">
                        <i class="fas ${categoryInfo.icon}"></i>
                    </div>
                    <h3>${expense.description}</h3>
                    <span class="expense-type-badge type-${expense.type}">
                        ${expense.type === 'fixed' ? 'Despesa Fixa' : 'Despesa Variável'}
                    </span>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div style="text-align: center; padding: 20px; background: #f7fafc; border-radius: 8px;">
                        <small style="color: #718096;">Categoria</small>
                        <div style="font-size: 18px; font-weight: 600; color: #2d3748; margin-top: 5px;">
                            ${categoryInfo.name}
                        </div>
                    </div>
                    
                    <div style="text-align: center; padding: 20px; background: #f7fafc; border-radius: 8px;">
                        <small style="color: #718096;">Valor</small>
                        <div style="font-size: 24px; font-weight: 700; color: #e53e3e; margin-top: 5px;">
                            ${formatCurrency(expense.value)}
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; padding: 15px; background: #f7fafc; border-radius: 8px; margin-bottom: 15px;">
                    <small style="color: #718096;">Data</small>
                    <div style="font-size: 18px; font-weight: 600;">
                        <i class="far fa-calendar-alt"></i> ${formatDate(expense.date)}
                    </div>
                </div>
                
                ${expense.observation ? `
                    <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <h4 style="margin-bottom: 10px; color: #744210;">
                            <i class="fas fa-sticky-note"></i> Observações
                        </h4>
                        <p style="color: #2d3748;">${expense.observation}</p>
                    </div>
                ` : ''}
                
                <div style="text-align: center; padding-top: 15px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 13px;">
                    <p>Registrado em: ${formatDate(expense.created_at)}</p>
                    ${expense.updated_at ? `<p>Atualizado em: ${formatDate(expense.updated_at)}</p>` : ''}
                </div>
                
                <div class="form-actions" style="margin-top: 20px;">
                    <button class="btn-secondary" onclick="closeModal('viewExpenseModal')">
                        <i class="fas fa-times"></i> Fechar
                    </button>
                    <button class="btn-primary" onclick="closeModal('viewExpenseModal'); editExpense('${expense.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('viewExpenseModal').classList.add('show');
        
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        alert('Erro ao carregar detalhes da despesa');
    }
}

/**
 * Exclui uma despesa
 */
async function deleteExpense(expenseId) {
    const expense = expensesList.find(e => e.id === expenseId);
    
    if (!expense) {
        alert('Despesa não encontrada');
        return;
    }
    
    const categoryInfo = findCategoryInfo(expense.category, expense.type);
    
    const confirmed = confirm(
        `⚠️ Tem certeza que deseja excluir esta despesa?\n\n` +
        `Descrição: ${expense.description}\n` +
        `Categoria: ${categoryInfo.name}\n` +
        `Valor: ${formatCurrency(expense.value)}\n` +
        `Data: ${formatDateShort(expense.date)}\n\n` +
        `Esta ação não pode ser desfeita!`
    );
    
    if (!confirmed) return;
    
    try {
        const { error } = await supabaseClient
            .from('expenses')
            .delete()
            .eq('id', expenseId);
        
        if (error) throw error;
        
        showToast('Despesa excluída com sucesso!', 'success');
        await refreshExpensesList();
        
    } catch (error) {
        console.error('Erro ao excluir despesa:', error);
        alert('Erro ao excluir despesa: ' + error.message);
    }
}

/**
 * Busca despesas
 */
async function searchExpenses() {
    const searchTerm = document.getElementById('searchExpense').value.trim();
    await refreshExpensesList(searchTerm);
}

/**
 * Fecha o modal de despesa
 */
function closeExpenseModal() {
    document.getElementById('expenseModal').classList.remove('show');
    document.getElementById('expenseForm').reset();
}

/**
 * Obtém range de datas para filtros
 */
function getDateRange(period) {
    const now = new Date();
    let startDate, endDate;
    
    switch(period) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;
        case '7days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            endDate = now;
            break;
        case '30days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            endDate = now;
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = now;
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = now;
            break;
        default:
            startDate = new Date(2000, 0, 1);
            endDate = now;
    }
    
    return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
    };
}

// Funções utilitárias

/**
 * Formata valor monetário
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

/**
 * Formata valor para input
 */
function formatMoneyValue(value) {
    if (!value && value !== 0) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toFixed(2).replace('.', ',');
}

/**
 * Converte string monetária para número
 */
function parseMoneyValue(value) {
    if (!value) return 0;
    const cleaned = value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

/**
 * Formata input monetário
 */
function formatMoneyInput(input) {
    let value = input.value.replace(/\D/g, '');
    if (value === '') {
        input.value = '';
        return;
    }
    const num = parseFloat(value) / 100;
    input.value = num.toFixed(2).replace('.', ',');
}

/**
 * Formata data curta
 */
function formatDateShort(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Formata data completa
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Mostra notificação toast
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#38a169' : type === 'error' ? '#e53e3e' : '#3182ce'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Fecha modal ao clicar fora
 */
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

/**
 * Debounce
 */
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

/**
 * Máscara de telefone
 */
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

// Exportar funções globais
window.showExpenseModal = showExpenseModal;
window.editExpense = editExpense;
window.viewExpense = viewExpense;
window.deleteExpense = deleteExpense;
window.closeExpenseModal = closeExpenseModal;
window.showCustomCategoryInput = showCustomCategoryInput;
window.onCategoryChange = onCategoryChange;
window.updateCategorySelect = updateCategorySelect;
window.formatMoneyInput = formatMoneyInput;

console.log('✅ Módulo de Despesas carregado');