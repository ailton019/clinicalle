/**
 * products.js - Gerenciamento de Produtos e Serviços
 * Versão corrigida com todas as colunas necessárias
 */

console.log('📦 Carregando módulo de produtos...');

// Variáveis globais
let productsList = [];
let currentTypeFilter = 'all';

/**
 * Carrega a página de produtos/serviços
 */
async function loadProducts() {
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;
    
    document.getElementById('pageTitle').textContent = 'Produtos e Serviços';
    
    contentArea.innerHTML = `
        <div class="page-header">
            <h2>Gerenciamento de Produtos e Serviços</h2>
            <button class="btn-primary" onclick="showProductModal()">
                <i class="fas fa-plus"></i> Novo Item
            </button>
        </div>
        
        <!-- Filtros -->
        <div class="filters-section">
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" id="searchProduct" placeholder="Buscar por código ou descrição...">
            </div>
            
            <div class="type-filters">
                <button class="filter-btn ${currentTypeFilter === 'all' ? 'active' : ''}" data-type="all">
                    <i class="fas fa-th-large"></i> Todos
                </button>
                <button class="filter-btn ${currentTypeFilter === 'product' ? 'active' : ''}" data-type="product">
                    <i class="fas fa-box"></i> Produtos
                </button>
                <button class="filter-btn ${currentTypeFilter === 'service' ? 'active' : ''}" data-type="service">
                    <i class="fas fa-hand-sparkles"></i> Serviços
                </button>
            </div>
        </div>
        
        <!-- Estatísticas -->
        <div class="stats-row">
            <div class="stat-mini-card">
                <div class="stat-mini-value" id="totalItems">0</div>
                <div class="stat-mini-label">Total de Itens</div>
            </div>
            <div class="stat-mini-card">
                <div class="stat-mini-value" id="totalProducts">0</div>
                <div class="stat-mini-label">Produtos</div>
            </div>
            <div class="stat-mini-card">
                <div class="stat-mini-value" id="totalServices">0</div>
                <div class="stat-mini-label">Serviços</div>
            </div>
        </div>
        
        <!-- Tabela -->
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Tipo</th>
                        <th>Descrição</th>
                        <th>Valor Custo</th>
                        <th>Valor Venda</th>
                        <th>Margem</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="productsTableBody">
                    <tr><td colspan="8" class="text-center">Carregando...</td></tr>
                </tbody>
            </table>
        </div>
    `;
    
    // Adicionar estilos
    addProductsStyles();
    
    // Carregar dados
    await refreshProductsList();
    
    // Eventos
    document.getElementById('searchProduct')?.addEventListener('input', debounce(searchProducts, 300));
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            currentTypeFilter = btn.dataset.type;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            await refreshProductsList();
        });
    });
}

/**
 * Adiciona estilos específicos
 */
function addProductsStyles() {
    if (document.getElementById('productsStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'productsStyles';
    style.textContent = `
        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .filters-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .search-box {
            flex: 1;
            max-width: 300px;
            position: relative;
        }
        
        .search-box i {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #a0aec0;
        }
        
        .search-box input {
            width: 100%;
            padding: 10px 12px 10px 36px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            font-size: 14px;
        }
        
        .type-filters {
            display: flex;
            gap: 10px;
        }
        
        .filter-btn {
            padding: 8px 16px;
            border: 1px solid #e2e8f0;
            background: white;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .filter-btn.active {
            background: #3182ce;
            border-color: #3182ce;
            color: white;
        }
        
        .stats-row {
            display: flex;
            gap: 15px;
            margin-bottom: 24px;
        }
        
        .stat-mini-card {
            background: #f7fafc;
            padding: 12px 20px;
            border-radius: 10px;
            text-align: center;
            flex: 1;
        }
        
        .stat-mini-value {
            font-size: 24px;
            font-weight: 700;
            color: #2d3748;
        }
        
        .stat-mini-label {
            font-size: 12px;
            color: #718096;
            margin-top: 4px;
        }
        
        .type-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .type-badge.product {
            background: #c6f6d5;
            color: #22543d;
        }
        
        .type-badge.service {
            background: #fed7d7;
            color: #742a2a;
        }
        
        .margin-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .margin-high { background: #c6f6d5; color: #22543d; }
        .margin-medium { background: #fefcbf; color: #744210; }
        .margin-low { background: #fed7d7; color: #822727; }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            font-size: 14px;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            font-size: 14px;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #3182ce;
        }
        
        .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }
        
        @media (max-width: 768px) {
            .filters-section {
                flex-direction: column;
            }
            
            .search-box {
                max-width: 100%;
            }
            
            .form-row {
                grid-template-columns: 1fr;
            }
            
            .stats-row {
                flex-direction: column;
            }
        }
        
        body.dark-mode .stat-mini-card {
            background: #2d3748;
        }
        
        body.dark-mode .stat-mini-value {
            color: #f7fafc;
        }
        
        body.dark-mode .search-box input {
            background: #2d3748;
            border-color: #4a5568;
            color: #f7fafc;
        }
        
        body.dark-mode .filter-btn {
            background: #2d3748;
            border-color: #4a5568;
            color: #f7fafc;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Atualiza lista de produtos
 */
async function refreshProductsList() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    const searchTerm = document.getElementById('searchProduct')?.value || '';
    
    try {
        let query = supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        // Filtro por tipo
        if (currentTypeFilter !== 'all') {
            query = query.eq('type', currentTypeFilter);
        }
        
        // Filtro por busca
        if (searchTerm) {
            query = query.or(`code.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }
        
        const { data: products, error } = await query;
        
        if (error) throw error;
        
        productsList = products || [];
        
        // Atualizar estatísticas
        updateStatistics();
        
        if (productsList.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="8" class="text-center" style="padding: 60px;">
                    <i class="fas fa-box-open" style="font-size: 48px; color: #cbd5e0;"></i>
                    <p style="margin-top: 15px;">Nenhum item cadastrado</p>
                    <button class="btn-primary" onclick="showProductModal()" style="margin-top: 10px;">
                        <i class="fas fa-plus"></i> Cadastrar Primeiro Item
                    </button>
                </td></tr>
            `;
            return;
        }
        
        tbody.innerHTML = productsList.map(item => {
            const cost = parseFloat(item.cost_value) || 0;
            const price = parseFloat(item.sale_value) || 0;
            const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
            
            let marginClass = 'margin-high';
            if (margin < 30) marginClass = 'margin-low';
            else if (margin < 50) marginClass = 'margin-medium';
            
            const typeIcon = item.type === 'product' ? 'fa-box' : 'fa-hand-sparkles';
            const typeLabel = item.type === 'product' ? 'Produto' : 'Serviço';
            const typeClass = item.type === 'product' ? 'product' : 'service';
            
            return `
                <tr>
                    <td><code>${item.code}</code></td>
                    <td><span class="type-badge ${typeClass}"><i class="fas ${typeIcon}"></i> ${typeLabel}</span></td>
                    <td>
                        <strong>${item.description}</strong>
                        ${item.type === 'service' && item.service_duration ? 
                            `<br><small>⏱️ ${item.service_duration} min</small>` : ''}
                        ${item.type === 'product' ? 
                            `<br><small>📦 Estoque: ${item.stock || 0} ${item.unit || 'un'}</small>` : ''}
                    </td>
                    <td>${formatCurrency(cost)}</td>
                    <td><strong>${formatCurrency(price)}</strong></td>
                    <td><span class="margin-badge ${marginClass}">${margin.toFixed(1)}%</span></td>
                    <td>
                        <span class="status-badge ${item.active ? 'active' : 'inactive'}">
                            ${item.active ? 'Ativo' : 'Inativo'}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon" onclick="editProduct('${item.id}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon" onclick="viewProductDetails('${item.id}')" title="Visualizar">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-icon delete" onclick="deleteProduct('${item.id}')" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erro ao carregar itens:', error);
        tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="color: #e53e3e;">Erro ao carregar: ${error.message}</td></tr>`;
    }
}

/**
 * Atualiza estatísticas
 */
function updateStatistics() {
    const totalItems = productsList.length;
    const totalProducts = productsList.filter(p => p.type === 'product').length;
    const totalServices = productsList.filter(p => p.type === 'service').length;
    
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('totalServices').textContent = totalServices;
}

/**
 * Busca produtos
 */
async function searchProducts() {
    await refreshProductsList();
}

/**
 * Mostra modal de cadastro/edição
 */
async function showProductModal(itemId = null) {
    // Primeiro, garantir que o modal existe
    let modal = document.getElementById('productModal');
    
    if (!modal) {
        // Criar modal
        modal = document.createElement('div');
        modal.id = 'productModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3 id="productModalTitle">Novo Item</h3>
                    <button class="modal-close" onclick="closeProductModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="productForm">
                        <input type="hidden" id="productId">
                        
                        <div class="form-group">
                            <label>Tipo do Item *</label>
                            <div style="display: flex; gap: 15px;">
                                <label style="display: flex; align-items: center; gap: 5px;">
                                    <input type="radio" name="itemType" value="product" checked onchange="toggleItemFields()">
                                    <i class="fas fa-box"></i> Produto
                                </label>
                                <label style="display: flex; align-items: center; gap: 5px;">
                                    <input type="radio" name="itemType" value="service" onchange="toggleItemFields()">
                                    <i class="fas fa-hand-sparkles"></i> Serviço
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Código</label>
                            <input type="text" id="productCode" readonly style="background: #f7fafc;">
                        </div>
                        
                        <div class="form-group">
                            <label>Descrição *</label>
                            <input type="text" id="productDescription" required>
                        </div>
                        
                        <!-- Campos de Produto -->
                        <div id="productFields">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Unidade</label>
                                    <select id="productUnit">
                                        <option value="un">Unidade</option>
                                        <option value="cx">Caixa</option>
                                        <option value="kg">Quilograma</option>
                                        <option value="g">Grama</option>
                                        <option value="ml">Mililitro</option>
                                        <option value="l">Litro</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Estoque</label>
                                    <input type="number" id="productStock" value="0" min="0">
                                </div>
                                <div class="form-group">
                                    <label>Estoque Mínimo</label>
                                    <input type="number" id="productMinStock" value="5" min="0">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Campos de Serviço -->
                        <div id="serviceFields" style="display: none;">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Duração (minutos)</label>
                                    <input type="number" id="serviceDuration" placeholder="60" min="0">
                                </div>
                                <div class="form-group">
                                    <label>Profissional</label>
                                    <input type="text" id="serviceProfessional" placeholder="Nome do profissional">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Materiais Utilizados</label>
                                <textarea id="serviceMaterials" rows="3" placeholder="Liste os materiais necessários..."></textarea>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Valor de Custo (R$)</label>
                                <input type="number" id="productCost" step="0.01" min="0" value="0">
                            </div>
                            <div class="form-group">
                                <label>Valor de Venda (R$)</label>
                                <input type="number" id="productPrice" step="0.01" min="0" value="0">
                            </div>
                        </div>
                        
                        <div id="marginPreview" style="display: none; padding: 12px; background: #f0fff4; border-radius: 8px; margin-top: 15px;">
                            <strong>📊 Margem de Lucro:</strong> <span id="marginValue">0%</span>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="closeProductModal()">Cancelar</button>
                            <button type="submit" class="btn-primary">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Adicionar eventos
        document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
        document.getElementById('productCost').addEventListener('input', updateMarginPreview);
        document.getElementById('productPrice').addEventListener('input', updateMarginPreview);
    }
    
    // Resetar formulário
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('marginPreview').style.display = 'none';
    document.getElementById('productFields').style.display = 'block';
    document.getElementById('serviceFields').style.display = 'none';
    document.querySelector('input[value="product"]').checked = true;
    
    if (itemId) {
        document.getElementById('productModalTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Item';
        await loadProductData(itemId);
    } else {
        document.getElementById('productModalTitle').innerHTML = '<i class="fas fa-plus"></i> Novo Item';
        const code = await generateProductCode();
        document.getElementById('productCode').value = code;
    }
    
    modal.style.display = 'flex';
}

/**
 * Fecha modal de produto
 */
function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.style.display = 'none';
}

/**
 * Alterna campos entre produto e serviço
 */
function toggleItemFields() {
    const isProduct = document.querySelector('input[name="itemType"]:checked').value === 'product';
    
    document.getElementById('productFields').style.display = isProduct ? 'block' : 'none';
    document.getElementById('serviceFields').style.display = isProduct ? 'none' : 'block';
    
    document.getElementById('productModalTitle').innerHTML = isProduct ? 
        '<i class="fas fa-box"></i> Novo Produto' : 
        '<i class="fas fa-hand-sparkles"></i> Novo Serviço';
}

/**
 * Gera código automático
 */
async function generateProductCode() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('code')
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (error) throw error;
        
        let nextNumber = 1;
        if (data && data.length > 0) {
            const match = data[0].code.match(/\d+$/);
            if (match) nextNumber = parseInt(match[0]) + 1;
        }
        
        return `ITEM-${String(nextNumber).padStart(6, '0')}`;
    } catch (error) {
        console.error('Erro ao gerar código:', error);
        return `ITEM-${Date.now()}`;
    }
}

/**
 * Carrega dados do produto para edição
 */
async function loadProductData(itemId) {
    try {
        const { data: item, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('id', itemId)
            .single();
        
        if (error) throw error;
        
        if (item) {
            document.getElementById('productId').value = item.id;
            document.getElementById('productCode').value = item.code;
            document.getElementById('productDescription').value = item.description;
            document.getElementById('productCost').value = item.cost_value || 0;
            document.getElementById('productPrice').value = item.sale_value || 0;
            
            // Selecionar tipo
            const typeRadio = document.querySelector(`input[name="itemType"][value="${item.type}"]`);
            if (typeRadio) {
                typeRadio.checked = true;
                toggleItemFields();
            }
            
            // Campos de produto
            if (item.unit) document.getElementById('productUnit').value = item.unit;
            if (item.stock !== undefined) document.getElementById('productStock').value = item.stock;
            if (item.min_stock !== undefined) document.getElementById('productMinStock').value = item.min_stock;
            
            // Campos de serviço
            if (item.service_duration) document.getElementById('serviceDuration').value = item.service_duration;
            if (item.service_professional) document.getElementById('serviceProfessional').value = item.service_professional;
            if (item.service_materials) document.getElementById('serviceMaterials').value = item.service_materials;
            
            updateMarginPreview();
        }
    } catch (error) {
        console.error('Erro ao carregar item:', error);
        alert('Erro ao carregar dados do item');
    }
}

/**
 * Manipula envio do formulário
 */
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const itemId = document.getElementById('productId').value;
    const itemType = document.querySelector('input[name="itemType"]:checked').value;
    const description = document.getElementById('productDescription').value.trim();
    const costValue = parseFloat(document.getElementById('productCost').value) || 0;
    const saleValue = parseFloat(document.getElementById('productPrice').value) || 0;
    
    if (!description) {
        alert('A descrição é obrigatória');
        return;
    }
    
    if (saleValue <= 0) {
        alert('O valor de venda deve ser maior que zero');
        return;
    }
    
    // Dados base
    const itemData = {
        description: description,
        cost_value: costValue,
        sale_value: saleValue,
        type: itemType,
        active: true,
        updated_at: new Date().toISOString()
    };
    
    // Adicionar campos específicos
    if (itemType === 'product') {
        itemData.unit = document.getElementById('productUnit').value;
        itemData.stock = parseInt(document.getElementById('productStock').value) || 0;
        itemData.min_stock = parseInt(document.getElementById('productMinStock').value) || 5;
    } else {
        itemData.service_duration = parseInt(document.getElementById('serviceDuration').value) || null;
        itemData.service_professional = document.getElementById('serviceProfessional').value || null;
        itemData.service_materials = document.getElementById('serviceMaterials').value || null;
    }
    
    try {
        const submitBtn = document.querySelector('#productForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        }
        
        if (itemId) {
            // Atualizar
            const { error } = await supabaseClient
                .from('products')
                .update(itemData)
                .eq('id', itemId);
            
            if (error) throw error;
            alert('Item atualizado com sucesso!');
        } else {
            // Criar novo
            itemData.code = document.getElementById('productCode').value;
            itemData.created_at = new Date().toISOString();
            
            const { error } = await supabaseClient
                .from('products')
                .insert(itemData);
            
            if (error) throw error;
            alert('Item cadastrado com sucesso!');
        }
        
        closeProductModal();
        await refreshProductsList();
        
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar: ' + error.message);
    } finally {
        const submitBtn = document.querySelector('#productForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Salvar';
        }
    }
}

/**
 * Atualiza preview da margem
 */
function updateMarginPreview() {
    const cost = parseFloat(document.getElementById('productCost').value) || 0;
    const price = parseFloat(document.getElementById('productPrice').value) || 0;
    const preview = document.getElementById('marginPreview');
    
    if (cost > 0 && price > 0) {
        const margin = ((price - cost) / price) * 100;
        document.getElementById('marginValue').textContent = margin.toFixed(2) + '%';
        preview.style.display = 'block';
        
        // Cor da margem
        const marginSpan = document.getElementById('marginValue');
        if (margin >= 50) marginSpan.style.color = '#38a169';
        else if (margin >= 30) marginSpan.style.color = '#d69e2e';
        else marginSpan.style.color = '#e53e3e';
    } else {
        preview.style.display = 'none';
    }
}

/**
 * Edita produto
 */
async function editProduct(itemId) {
    await showProductModal(itemId);
}

/**
 * Visualiza detalhes
 */
async function viewProductDetails(itemId) {
    const item = productsList.find(p => p.id === itemId);
    if (!item) return;
    
    const cost = parseFloat(item.cost_value) || 0;
    const price = parseFloat(item.sale_value) || 0;
    const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
    
    let detailsHtml = `
        <div style="padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <span class="type-badge ${item.type}">
                    <i class="fas ${item.type === 'product' ? 'fa-box' : 'fa-hand-sparkles'}"></i>
                    ${item.type === 'product' ? 'Produto' : 'Serviço'}
                </span>
                <h3 style="margin-top: 10px;">${item.description}</h3>
                <code>${item.code}</code>
            </div>
            
            <div class="form-row">
                <div class="info-box">
                    <div class="info-label">Valor de Custo</div>
                    <div class="info-value">${formatCurrency(cost)}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Valor de Venda</div>
                    <div class="info-value">${formatCurrency(price)}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Margem de Lucro</div>
                    <div class="info-value" style="color: ${margin >= 50 ? '#38a169' : margin >= 30 ? '#d69e2e' : '#e53e3e'}">
                        ${margin.toFixed(2)}%
                    </div>
                </div>
            </div>
    `;
    
    if (item.type === 'product') {
        detailsHtml += `
            <div class="form-row">
                <div class="info-box">
                    <div class="info-label">Estoque</div>
                    <div class="info-value">${item.stock || 0} ${item.unit || 'un'}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Estoque Mínimo</div>
                    <div class="info-value">${item.min_stock || 5} ${item.unit || 'un'}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Status</div>
                    <div class="info-value">
                        ${(item.stock || 0) <= (item.min_stock || 5) ? 
                            '<span style="color: #e53e3e;">⚠️ Estoque Baixo</span>' : 
                            '<span style="color: #38a169;">✓ Estoque OK</span>'}
                    </div>
                </div>
            </div>
        `;
    } else {
        detailsHtml += `
            <div class="form-row">
                <div class="info-box">
                    <div class="info-label">Duração</div>
                    <div class="info-value">${item.service_duration || 'Não informado'} min</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Profissional</div>
                    <div class="info-value">${item.service_professional || 'Não definido'}</div>
                </div>
            </div>
            ${item.service_materials ? `
                <div class="info-box full-width">
                    <div class="info-label">Materiais Utilizados</div>
                    <div class="info-value">${item.service_materials.replace(/\n/g, '<br>')}</div>
                </div>
            ` : ''}
        `;
    }
    
    detailsHtml += `
        <div class="form-actions">
            <button class="btn-secondary" onclick="closeDetailsModal()">Fechar</button>
            <button class="btn-primary" onclick="closeDetailsModal(); editProduct('${item.id}')">Editar</button>
        </div>
    </div>`;
    
    // Criar modal de detalhes
    let modal = document.getElementById('viewDetailsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'viewDetailsModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Detalhes do Item</h3>
                    <button class="modal-close" onclick="closeDetailsModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="detailsContent"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    document.getElementById('detailsContent').innerHTML = detailsHtml;
    modal.style.display = 'flex';
}

/**
 * Fecha modal de detalhes
 */
function closeDetailsModal() {
    const modal = document.getElementById('viewDetailsModal');
    if (modal) modal.style.display = 'none';
}

/**
 * Exclui produto
 */
async function deleteProduct(itemId) {
    const item = productsList.find(p => p.id === itemId);
    if (!item) return;
    
    const confirmed = confirm(`Tem certeza que deseja excluir "${item.description}"?`);
    if (!confirmed) return;
    
    try {
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', itemId);
        
        if (error) throw error;
        
        alert('Item excluído com sucesso!');
        await refreshProductsList();
        
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir: ' + error.message);
    }
}

/**
 * Debounce para search
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
 * Formata moeda
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

// Exportar funções
window.loadProducts = loadProducts;
window.showProductModal = showProductModal;
window.closeProductModal = closeProductModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.viewProductDetails = viewProductDetails;
window.closeDetailsModal = closeDetailsModal;
window.toggleItemFields = toggleItemFields;

console.log('✅ Módulo de produtos carregado!');