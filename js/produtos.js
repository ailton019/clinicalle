// js/produtos.js - Módulo de Produtos e Serviços
console.log('📦 Carregando módulo de produtos...');

let productsList = [];
let currentTypeFilter = 'all';

// ============================================
// FUNÇÃO PRINCIPAL - Carrega a página
// ============================================
async function loadProducts() {
    console.log('📦 loadProducts() chamada!');
    document.getElementById('pageTitle').textContent = 'Produtos e Serviços';
    
    // Adicionar estilos
    addProductsStyles();
    
    // Carregar dados
    await refreshProductsList();
    
    // Eventos
    document.getElementById('searchProduct')?.addEventListener('input', debounce(searchProducts, 300));
    
    document.querySelectorAll('.type-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            currentTypeFilter = btn.dataset.type;
            document.querySelectorAll('.type-filters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            await refreshProductsList();
        });
    });

    // Form submit listener
    const form = document.getElementById('productForm');
    if (form) {
        form.removeEventListener('submit', handleProductSubmit);
        form.addEventListener('submit', handleProductSubmit);
    }
    
    // Custo e Venda input margin preview
    const costInput = document.getElementById('productCost');
    const priceInput = document.getElementById('productPrice');
    if (costInput) costInput.addEventListener('input', updateMarginPreview);
    if (priceInput) priceInput.addEventListener('input', updateMarginPreview);
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
            padding-left: 36px;
            width: 100%;
        }
        
        .type-filters {
            display: flex;
            gap: 10px;
        }
        
        .stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 24px;
        }
        
        .stat-mini-card {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .stat-mini-value {
            font-size: 24px;
            font-weight: 700;
            color: var(--prussian-blue);
        }
        
        .stat-mini-label {
            font-size: 14px;
            color: #718096;
            margin-top: 5px;
        }
        
        .type-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .type-badge.product {
            background: #ebf8ff;
            color: #2b6cb0;
        }
        
        .type-badge.service {
            background: #faf5ff;
            color: #6b46c1;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .status-badge.active {
            background: #e6fffa;
            color: #319795;
        }
        
        .status-badge.inactive {
            background: #fff5f5;
            color: #e53e3e;
        }
        
        .info-box {
            background: #f7fafc;
            padding: 12px;
            border-radius: 8px;
            flex: 1;
            min-width: 120px;
            text-align: center;
        }
        
        .info-box.full-width {
            flex: 1 1 100%;
            text-align: left;
            margin-top: 15px;
        }
        
        .info-label {
            font-size: 12px;
            color: #718096;
            margin-bottom: 5px;
        }
        
        .info-value {
            font-size: 16px;
            font-weight: 600;
            color: var(--prussian-blue);
        }
        
        /* Dark mode */
        body.dark-mode .stat-mini-card,
        body.dark-mode .info-box {
            background: #1f2937;
        }
        
        body.dark-mode .stat-mini-value,
        body.dark-mode .info-value {
            color: #f9fafb;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Carrega a lista do Supabase
 */
async function refreshProductsList(searchTerm = '') {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    try {
        let query = supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (currentTypeFilter !== 'all') {
            query = query.eq('type', currentTypeFilter);
        }
        
        if (searchTerm) {
            query = query.or(`code.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        productsList = data || [];
        
        // Atualizar estatísticas rápidas
        updateStats();
        
        if (productsList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 40px; color: #718096;">
                <i class="fas fa-box-open" style="font-size: 48px; color: #cbd5e0; margin-bottom: 10px;"></i>
                <p>Nenhum item encontrado</p>
            </td></tr>`;
            return;
        }
        
        tbody.innerHTML = productsList.map(item => {
            const cost = parseFloat(item.cost_value) || 0;
            const price = parseFloat(item.sale_value) || 0;
            const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
            
            return `
                <tr>
                    <td><code>${item.code}</code></td>
                    <td>
                        <span class="type-badge ${item.type}">
                            <i class="fas ${item.type === 'product' ? 'fa-box' : 'fa-hand-sparkles'}"></i>
                            ${item.type === 'product' ? 'Produto' : 'Serviço'}
                        </span>
                    </td>
                    <td><strong>${item.description}</strong></td>
                    <td>${formatCurrency(cost)}</td>
                    <td><strong>${formatCurrency(price)}</strong></td>
                    <td style="font-weight: 600; color: ${margin >= 50 ? '#38a169' : margin >= 30 ? '#d69e2e' : '#e53e3e'};">
                        ${margin.toFixed(1)}%
                    </td>
                    <td>
                        <span class="status-badge ${item.active ? 'active' : 'inactive'}">
                            ${item.active ? 'Ativo' : 'Inativo'}
                        </span>
                    </td>
                    <td>
                        <button class="btn-primary btn-sm" onclick="viewProductDetails('${item.id}')" title="Visualizar Detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-primary btn-sm" onclick="editProduct('${item.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-danger btn-sm" onclick="deleteProduct('${item.id}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erro ao carregar itens:', error);
        tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="color: #e53e3e; padding: 20px;">
            <i class="fas fa-exclamation-triangle"></i> Erro ao carregar: ${error.message}
        </td></tr>`;
    }
}

/**
 * Atualiza cards de contagem
 */
function updateStats() {
    const totalItems = productsList.length;
    const totalProducts = productsList.filter(p => p.type === 'product').length;
    const totalServices = productsList.filter(p => p.type === 'service').length;
    
    const totalItemsEl = document.getElementById('totalItems');
    const totalProductsEl = document.getElementById('totalProducts');
    const totalServicesEl = document.getElementById('totalServices');
    
    if (totalItemsEl) totalItemsEl.textContent = totalItems;
    if (totalProductsEl) totalProductsEl.textContent = totalProducts;
    if (totalServicesEl) totalServicesEl.textContent = totalServices;
}

/**
 * Filtro de busca por digitação
 */
async function searchProducts() {
    const search = document.getElementById('searchProduct').value;
    await refreshProductsList(search);
}

/**
 * Mostra modal de cadastro/edição
 */
async function showProductModal(itemId = null) {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('productModalTitle');
    if (!modal) return;
    
    // Resetar formulário
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('marginPreview').style.display = 'none';
    document.getElementById('productFields').style.display = 'block';
    document.getElementById('serviceFields').style.display = 'none';
    document.querySelector('input[value="product"]').checked = true;
    
    if (itemId) {
        title.innerHTML = '<i class="fas fa-edit"></i> Editar Item';
        await loadProductData(itemId);
    } else {
        title.innerHTML = '<i class="fas fa-plus"></i> Novo Item';
        const code = await generateProductCode();
        document.getElementById('productCode').value = code;
    }
    
    modal.classList.add('show');
}

/**
 * Fecha modal de produto
 */
function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('show');
}

/**
 * Alterna campos entre produto e serviço
 */
function toggleItemFields() {
    const isProduct = document.querySelector('input[name="itemType"]:checked').value === 'product';
    
    document.getElementById('productFields').style.display = isProduct ? 'block' : 'none';
    document.getElementById('serviceFields').style.display = isProduct ? 'none' : 'block';
    
    const title = document.getElementById('productModalTitle');
    const isEditing = document.getElementById('productId').value !== '';
    
    if (title) {
        if (isEditing) {
            title.innerHTML = `<i class="fas fa-edit"></i> Editar ${isProduct ? 'Produto' : 'Serviço'}`;
        } else {
            title.innerHTML = `<i class="fas ${isProduct ? 'fa-box' : 'fa-hand-sparkles'}"></i> Novo ${isProduct ? 'Produto' : 'Serviço'}`;
        }
    }
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
        // Zerar campos de serviço por segurança
        itemData.service_duration = null;
        itemData.service_professional = null;
        itemData.service_materials = null;
    } else {
        itemData.service_duration = parseInt(document.getElementById('serviceDuration').value) || null;
        itemData.service_professional = document.getElementById('serviceProfessional').value || null;
        itemData.service_materials = document.getElementById('serviceMaterials').value || null;
        // Zerar campos de produto por segurança
        itemData.unit = 'un';
        itemData.stock = 0;
        itemData.min_stock = 0;
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
        document.getElementById('marginValue').textContent = margin.toFixed(1) + '%';
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
        <div style="padding: 10px 0;">
            <div style="text-align: center; margin-bottom: 20px;">
                <span class="type-badge ${item.type}">
                    <i class="fas ${item.type === 'product' ? 'fa-box' : 'fa-hand-sparkles'}"></i>
                    ${item.type === 'product' ? 'Produto' : 'Serviço'}
                </span>
                <h3 style="margin-top: 10px; font-size: 18px; color: var(--prussian-blue);">${item.description}</h3>
                <code>${item.code}</code>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div class="info-box">
                    <div class="info-label">Valor Custo</div>
                    <div class="info-value">${formatCurrency(cost)}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Valor Venda</div>
                    <div class="info-value">${formatCurrency(price)}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Margem Lucro</div>
                    <div class="info-value" style="color: ${margin >= 50 ? '#38a169' : margin >= 30 ? '#d69e2e' : '#e53e3e'}">
                        ${margin.toFixed(1)}%
                    </div>
                </div>
            </div>
    `;
    
    if (item.type === 'product') {
        detailsHtml += `
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                <div class="info-box">
                    <div class="info-label">Estoque</div>
                    <div class="info-value">${item.stock || 0} ${item.unit || 'un'}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Estoque Mín</div>
                    <div class="info-value">${item.min_stock || 5} ${item.unit || 'un'}</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Status</div>
                    <div class="info-value" style="font-size: 13px;">
                        ${(item.stock || 0) <= (item.min_stock || 5) ? 
                            '<span style="color: #e53e3e; font-weight: 600;">⚠️ Baixo</span>' : 
                            '<span style="color: #38a169; font-weight: 600;">✓ OK</span>'}
                    </div>
                </div>
            </div>
        `;
    } else {
        detailsHtml += `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="info-box">
                    <div class="info-label">Duração</div>
                    <div class="info-value">${item.service_duration || 'Não informado'} min</div>
                </div>
                <div class="info-box">
                    <div class="info-label">Profissional</div>
                    <div class="info-value" style="font-size: 14px;">${item.service_professional || 'Não definido'}</div>
                </div>
            </div>
            ${item.service_materials ? `
                <div class="info-box full-width" style="text-align: left; margin-top: 10px;">
                    <div class="info-label">Materiais Utilizados</div>
                    <div class="info-value" style="font-weight: 400; font-size: 14px;">${item.service_materials.replace(/\n/g, '<br>')}</div>
                </div>
            ` : ''}
        `;
    }
    
    detailsHtml += `
        <div class="form-actions" style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
            <button class="btn-secondary" onclick="closeDetailsModal()">Fechar</button>
            <button class="btn-primary" onclick="closeDetailsModal(); editProduct('${item.id}')">Editar</button>
        </div>
    </div>`;
    
    const modal = document.getElementById('detailsModal');
    if (!modal) return;
    
    document.getElementById('detailsContent').innerHTML = detailsHtml;
    modal.classList.add('show');
}

/**
 * Fecha modal de detalhes
 */
function closeDetailsModal() {
    const modal = document.getElementById('detailsModal');
    if (modal) modal.classList.remove('show');
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
window.showProductModal = showProductModal;
window.closeProductModal = closeProductModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.viewProductDetails = viewProductDetails;
window.closeDetailsModal = closeDetailsModal;
window.toggleItemFields = toggleItemFields;

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('productsTableBody')) {
        setTimeout(() => {
            loadProducts();
        }, 300);
    }
});

console.log('✅ Módulo de produtos carregado!');
