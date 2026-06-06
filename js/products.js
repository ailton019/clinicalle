// js/products.js - Módulo de Produtos
// Gerencia o CRUD de produtos com código automático
// Função de salvar produto
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const productId = document.getElementById('productId')?.value;
    const productData = {
        description: document.getElementById('productDescription')?.value?.trim(),
        cost_value: parseFloat((document.getElementById('productCost')?.value || '0').replace(',', '.')),
        sale_value: parseFloat((document.getElementById('productPrice')?.value || '0').replace(',', '.')),
        active: true
    };
    
    if (!productData.description) {
        alert('Descrição é obrigatória!');
        return;
    }
    
    console.log('📤 Enviando produto:', productData);
    
    try {
        let result;
        
        if (productId) {
            result = await supabaseClient
                .from('products')
                .update({ ...productData, updated_at: new Date().toISOString() })
                .eq('id', productId)
                .select();
        } else {
            const code = document.getElementById('productCode')?.value;
            result = await supabaseClient
                .from('products')
                .insert({ ...productData, code: code, created_at: new Date().toISOString() })
                .select();
        }
        
        console.log('✅ Resultado:', result);
        
        if (result.error) throw result.error;
        
        alert('✅ Produto salvo com sucesso!');
        closeModal('productModal');
        await refreshProductsList();
        
    } catch (error) {
        console.error('❌ Erro:', error);
        alert('Erro ao salvar: ' + error.message);
    }
}
// Variáveis globais do módulo
let productsList = [];
let editingProductId = null;

/**
 * Carrega a página de produtos
 */
async function loadProducts() {
    const contentArea = document.getElementById('contentArea');
    document.getElementById('pageTitle').textContent = 'Produtos';
    
    contentArea.innerHTML = `
        <div class="table-container">
            <div class="table-header">
                <h2>Gerenciamento de Produtos</h2>
                <div class="table-actions">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="searchProduct" placeholder="Buscar por código ou descrição...">
                    </div>
                    <button class="btn-primary" onclick="showProductModal()">
                        <i class="fas fa-plus"></i> Novo Produto
                    </button>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Descrição</th>
                        <th>Valor de Custo</th>
                        <th>Valor de Venda</th>
                        <th>Margem</th>
                        <th>Data Cadastro</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="productsTableBody">
                    <tr>
                        <td colspan="7" class="text-center">
                            <i class="fas fa-spinner fa-spin"></i> Carregando...
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <!-- Modal de Produto -->
        <div id="productModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="productModalTitle">Novo Produto</h3>
                    <button class="modal-close" onclick="closeModal('productModal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="productForm">
                    <input type="hidden" id="productId">
                    
                    <div class="form-group">
                        <label>Código</label>
                        <input type="text" id="productCode" readonly 
                               placeholder="Gerado automaticamente"
                               style="background-color: #f7fafc; color: #718096;">
                        <small style="color: #718096; display: block; margin-top: 5px;">
                            <i class="fas fa-info-circle"></i> 
                            O código é gerado automaticamente pelo sistema
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label>Descrição do Produto *</label>
                        <input type="text" id="productDescription" 
                               required 
                               placeholder="Ex: Creme Hidratante Facial 50ml"
                               maxlength="200">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Valor de Custo (R$) *</label>
                            <input type="text" id="productCost" 
                                   required 
                                   placeholder="0,00"
                                   class="money-input"
                                   oninput="formatMoneyInput(this)">
                        </div>
                        
                        <div class="form-group">
                            <label>Valor de Venda (R$) *</label>
                            <input type="text" id="productPrice" 
                                   required 
                                   placeholder="0,00"
                                   class="money-input"
                                   oninput="formatMoneyInput(this)">
                        </div>
                    </div>
                    
                    <!-- Preview da margem -->
                    <div id="marginPreview" style="display: none; margin-bottom: 20px;">
                        <div style="background: #f0fff4; padding: 15px; border-radius: 8px; border-left: 4px solid #38a169;">
                            <strong>📊 Margem de Lucro:</strong>
                            <span id="marginValue" style="font-size: 20px; margin-left: 10px; color: #38a169;">0%</span>
                            <br>
                            <small style="color: #718096;">
                                Lucro estimado: <span id="profitValue">R$ 0,00</span>
                            </small>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeModal('productModal')">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i> Salvar Produto
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Modal de Visualização -->
        <div id="viewProductModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Detalhes do Produto</h3>
                    <button class="modal-close" onclick="closeModal('viewProductModal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="productDetails"></div>
            </div>
        </div>
    `;
    
    // Carregar lista de produtos
    await refreshProductsList();
    
    // Event listeners
    document.getElementById('searchProduct').addEventListener('input', debounce(searchProducts, 300));
    document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
    
    // Atualizar margem quando os valores mudarem
    document.getElementById('productCost').addEventListener('input', updateMarginPreview);
    document.getElementById('productPrice').addEventListener('input', updateMarginPreview);
    
    // Adicionar CSS extra para o formulário
    addProductStyles();
}

/**
 * Adiciona estilos específicos para o módulo de produtos
 */
function addProductStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .money-input {
            font-size: 18px;
            font-weight: 600;
        }
        
        .margin-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 13px;
        }
        
        .margin-high {
            background: #c6f6d5;
            color: #22543d;
        }
        
        .margin-medium {
            background: #fefcbf;
            color: #744210;
        }
        
        .margin-low {
            background: #fed7d7;
            color: #822727;
        }
        
        .clickable-row {
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .clickable-row:hover {
            background-color: #ebf8ff;
        }
        
        @media (max-width: 768px) {
            .form-row {
                grid-template-columns: 1fr;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Atualiza a lista de produtos na tabela
 */
async function refreshProductsList(searchTerm = '') {
    const tbody = document.getElementById('productsTableBody');
    
    try {
        let products;
        
        if (searchTerm) {
            // Buscar com filtro
            const { data, error } = await supabaseClient
                .from('products')
                .select('*')
                .or(`code.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            products = data;
        } else {
            // Buscar todos
            const { data, error } = await supabaseClient
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            products = data;
        }
        
        productsList = products || [];
        
        if (productsList.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center" style="padding: 40px;">
                        <i class="fas fa-box-open" style="font-size: 48px; color: #cbd5e0; display: block; margin-bottom: 15px;"></i>
                        <p style="color: #718096; font-size: 16px;">Nenhum produto cadastrado</p>
                        <button class="btn-primary" onclick="showProductModal()" style="margin-top: 15px;">
                            <i class="fas fa-plus"></i> Cadastrar Primeiro Produto
                        </button>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = productsList.map(product => {
            const cost = parseFloat(product.cost_value) || 0;
            const price = parseFloat(product.sale_value) || 0;
            const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
            
            let marginClass = 'margin-high';
            if (margin < 30) marginClass = 'margin-low';
            else if (margin < 50) marginClass = 'margin-medium';
            
            return `
                <tr>
                    <td>
                        <span style="font-family: monospace; background: #edf2f7; padding: 4px 8px; border-radius: 4px; font-weight: 600;">
                            ${product.code}
                        </span>
                    </td>
                    <td>
                        <strong>${product.description}</strong>
                    </td>
                    <td>${formatCurrency(cost)}</td>
                    <td>
                        <strong style="color: #2d3748;">${formatCurrency(price)}</strong>
                    </td>
                    <td>
                        <span class="badge margin-badge ${marginClass}">
                            ${margin.toFixed(1)}%
                        </span>
                    </td>
                    <td>${formatDate(product.created_at)}</td>
                    <td>
                        <div style="display: flex; gap: 5px;">
                            <button class="btn-primary btn-sm" onclick="editProduct('${product.id}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-secondary btn-sm" onclick="viewProduct('${product.id}')" title="Visualizar">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-danger btn-sm" onclick="deleteProduct('${product.id}')" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center" style="padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #e53e3e; display: block; margin-bottom: 15px;"></i>
                    <p style="color: #e53e3e;">Erro ao carregar produtos</p>
                    <small style="color: #718096;">${error.message}</small>
                    <br>
                    <button class="btn-primary" onclick="refreshProductsList()" style="margin-top: 15px;">
                        <i class="fas fa-sync"></i> Tentar Novamente
                    </button>
                </td>
            </tr>
        `;
    }
}

/**
 * Busca produtos por termo
 */
async function searchProducts() {
    const searchTerm = document.getElementById('searchProduct').value.trim();
    await refreshProductsList(searchTerm);
}

/**
 * Mostra o modal de cadastro/edição
 */
async function showProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('productModalTitle');
    const form = document.getElementById('productForm');
    
    // Resetar formulário
    form.reset();
    document.getElementById('productId').value = '';
    document.getElementById('marginPreview').style.display = 'none';
    
    if (productId) {
        // Modo edição
        title.innerHTML = '<i class="fas fa-edit"></i> Editar Produto';
        await loadProductData(productId);
    } else {
        // Modo novo
        title.innerHTML = '<i class="fas fa-plus"></i> Novo Produto';
        
        // Gerar código automático
        const code = await generateProductCode();
        document.getElementById('productCode').value = code;
        
        // Focar no campo descrição
        setTimeout(() => {
            document.getElementById('productDescription').focus();
        }, 300);
    }
    
    modal.classList.add('show');
}

/**
 * Gera o próximo código de produto automaticamente
 */
async function generateProductCode() {
    try {
        // Buscar o último código gerado
        const { data, error } = await supabaseClient
            .from('products')
            .select('code')
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (error) throw error;
        
        let nextNumber = 1;
        
        if (data && data.length > 0) {
            // Extrair o número do código (formato: PROD-000001)
            const lastCode = data[0].code;
            const match = lastCode.match(/PROD-(\d+)/);
            
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }
        
        // Formatar com zeros à esquerda (6 dígitos)
        return `PROD-${String(nextNumber).padStart(6, '0')}`;
        
    } catch (error) {
        console.error('Erro ao gerar código:', error);
        // Fallback: usar timestamp
        return `PROD-${Date.now().toString().substring(5)}`;
    }
}

/**
 * Carrega os dados do produto para edição
 */
async function loadProductData(productId) {
    try {
        const { data: product, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
        
        if (error) throw error;
        
        if (product) {
            document.getElementById('productId').value = product.id;
            document.getElementById('productCode').value = product.code;
            document.getElementById('productDescription').value = product.description;
            document.getElementById('productCost').value = formatMoneyValue(product.cost_value);
            document.getElementById('productPrice').value = formatMoneyValue(product.sale_value);
            
            // Atualizar preview da margem
            updateMarginPreview();
        }
        
    } catch (error) {
        console.error('Erro ao carregar produto:', error);
        alert('Erro ao carregar dados do produto');
    }
}

/**
 * Manipula o envio do formulário
 */
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const description = document.getElementById('productDescription').value.trim();
    const costValue = parseMoneyValue(document.getElementById('productCost').value);
    const saleValue = parseMoneyValue(document.getElementById('productPrice').value);
    
    // Validações
    if (!description) {
        alert('A descrição do produto é obrigatória');
        return;
    }
    
    if (isNaN(costValue) || costValue < 0) {
        alert('Valor de custo inválido');
        return;
    }
    
    if (isNaN(saleValue) || saleValue <= 0) {
        alert('Valor de venda inválido');
        return;
    }
    
    if (saleValue < costValue) {
        const confirm = window.confirm(
            '⚠️ Atenção: O valor de venda é menor que o valor de custo!\n\n' +
            `Custo: ${formatCurrency(costValue)}\n` +
            `Venda: ${formatCurrency(saleValue)}\n\n` +
            'Isso resultará em prejuízo. Deseja continuar?'
        );
        if (!confirm) return;
    }
    
    // Verificar duplicidade (apenas para novos produtos)
    if (!productId) {
        const isDuplicate = await checkDuplicateProduct(description);
        if (isDuplicate) {
            alert('Já existe um produto com esta descrição. Por favor, use uma descrição diferente.');
            return;
        }
    }
    
    const productData = {
        description: description,
        cost_value: costValue,
        sale_value: saleValue,
        active: true
    };
    
    try {
        const submitBtn = document.querySelector('#productForm button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        
        if (productId) {
            // Atualizar produto existente
            const { error } = await supabaseClient
                .from('products')
                .update({
                    ...productData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', productId);
            
            if (error) throw error;
            
            showToast('Produto atualizado com sucesso!', 'success');
        } else {
            // Criar novo produto
            const code = document.getElementById('productCode').value;
            
            const { error } = await supabaseClient
                .from('products')
                .insert({
                    ...productData,
                    code: code,
                    created_at: new Date().toISOString()
                });
            
            if (error) throw error;
            
            showToast('Produto cadastrado com sucesso!', 'success');
        }
        
        closeModal('productModal');
        await refreshProductsList();
        
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        
        if (error.message.includes('duplicate key')) {
            alert('Já existe um produto com este código. Tente novamente.');
        } else {
            alert('Erro ao salvar produto: ' + error.message);
        }
    } finally {
        const submitBtn = document.querySelector('#productForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Produto';
        }
    }
}

/**
 * Verifica se já existe um produto com a mesma descrição
 */
async function checkDuplicateProduct(description) {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('id')
            .ilike('description', description)
            .limit(1);
        
        if (error) throw error;
        
        return data && data.length > 0;
    } catch (error) {
        console.error('Erro ao verificar duplicidade:', error);
        return false;
    }
}

/**
 * Edita um produto
 */
async function editProduct(productId) {
    showProductModal(productId);
}

/**
 * Visualiza detalhes do produto
 */
async function viewProduct(productId) {
    try {
        const { data: product, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
        
        if (error) throw error;
        
        const cost = parseFloat(product.cost_value) || 0;
        const price = parseFloat(product.sale_value) || 0;
        const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
        const profit = price - cost;
        
        const detailsDiv = document.getElementById('productDetails');
        detailsDiv.innerHTML = `
            <div style="padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="font-family: monospace; font-size: 18px; background: #edf2f7; display: inline-block; padding: 8px 16px; border-radius: 8px; margin-bottom: 10px;">
                        ${product.code}
                    </div>
                    <h3 style="margin: 10px 0;">${product.description}</h3>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
                    <div style="text-align: center; padding: 20px; background: #f7fafc; border-radius: 8px;">
                        <div style="color: #718096; font-size: 14px; margin-bottom: 5px;">Valor de Custo</div>
                        <div style="font-size: 24px; font-weight: 700; color: #e53e3e;">${formatCurrency(cost)}</div>
                    </div>
                    
                    <div style="text-align: center; padding: 20px; background: #f7fafc; border-radius: 8px;">
                        <div style="color: #718096; font-size: 14px; margin-bottom: 5px;">Valor de Venda</div>
                        <div style="font-size: 24px; font-weight: 700; color: #38a169;">${formatCurrency(price)}</div>
                    </div>
                    
                    <div style="text-align: center; padding: 20px; background: #f7fafc; border-radius: 8px;">
                        <div style="color: #718096; font-size: 14px; margin-bottom: 5px;">Lucro por Unidade</div>
                        <div style="font-size: 24px; font-weight: 700; color: #3182ce;">${formatCurrency(profit)}</div>
                    </div>
                </div>
                
                <div style="background: #f0fff4; padding: 20px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 14px; color: #718096; margin-bottom: 5px;">Margem de Lucro</div>
                    <div style="font-size: 36px; font-weight: 700; color: #38a169;">${margin.toFixed(2)}%</div>
                </div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #718096; font-size: 13px;">
                    <p>Cadastrado em: ${formatDate(product.created_at)}</p>
                    <p>Última atualização: ${formatDate(product.updated_at)}</p>
                </div>
                
                <div class="form-actions" style="margin-top: 20px;">
                    <button class="btn-secondary" onclick="closeModal('viewProductModal')">
                        <i class="fas fa-times"></i> Fechar
                    </button>
                    <button class="btn-primary" onclick="closeModal('viewProductModal'); editProduct('${product.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('viewProductModal').classList.add('show');
        
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        alert('Erro ao carregar detalhes do produto');
    }
}

/**
 * Exclui um produto
 */
async function deleteProduct(productId) {
    // Buscar informações do produto primeiro
    const product = productsList.find(p => p.id === productId);
    
    if (!product) {
        alert('Produto não encontrado');
        return;
    }
    
    const confirmed = confirm(
        `⚠️ Tem certeza que deseja excluir este produto?\n\n` +
        `Código: ${product.code}\n` +
        `Descrição: ${product.description}\n` +
        `Valor: ${formatCurrency(product.sale_value)}\n\n` +
        `Esta ação não pode ser desfeita!`
    );
    
    if (!confirmed) return;
    
    try {
        // Verificar se o produto está sendo usado em vendas
        const { data: salesData, error: salesError } = await supabaseClient
            .from('sales')
            .select('id')
            .eq('product_id', productId)
            .limit(1);
        
        if (salesError) throw salesError;
        
        if (salesData && salesData.length > 0) {
            const forceDelete = confirm(
                '⚠️ Este produto possui vendas registradas!\n\n' +
                'Se excluir, os registros de venda ficarão sem referência ao produto.\n\n' +
                'Recomendação: Apenas desative o produto.\n\n' +
                'Deseja realmente excluir?'
            );
            
            if (!forceDelete) return;
        }
        
        // Excluir produto
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', productId);
        
        if (error) throw error;
        
        showToast('Produto excluído com sucesso!', 'success');
        await refreshProductsList();
        
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir produto: ' + error.message);
    }
}

/**
 * Atualiza o preview da margem de lucro
 */
function updateMarginPreview() {
    const costInput = document.getElementById('productCost');
    const priceInput = document.getElementById('productPrice');
    const marginPreview = document.getElementById('marginPreview');
    const marginValue = document.getElementById('marginValue');
    const profitValue = document.getElementById('profitValue');
    
    const cost = parseMoneyValue(costInput.value);
    const price = parseMoneyValue(priceInput.value);
    
    if (cost > 0 && price > 0) {
        const margin = ((price - cost) / price) * 100;
        const profit = price - cost;
        
        marginPreview.style.display = 'block';
        marginValue.textContent = margin.toFixed(2) + '%';
        profitValue.textContent = formatCurrency(profit);
        
        // Colorir baseado na margem
        if (margin >= 50) {
            marginValue.style.color = '#38a169';
        } else if (margin >= 30) {
            marginValue.style.color = '#d69e2e';
        } else {
            marginValue.style.color = '#e53e3e';
        }
    } else {
        marginPreview.style.display = 'none';
    }
}

/**
 * Formata um valor monetário para exibição
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
    // Remove R$, espaços e converte vírgula para ponto
    const cleaned = value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

/**
 * Formata um campo input enquanto o usuário digita
 */
function formatMoneyInput(input) {
    let value = input.value.replace(/\D/g, ''); // Remove não dígitos
    
    if (value === '') {
        input.value = '';
        return;
    }
    
    // Converte para número e formata
    const num = parseFloat(value) / 100;
    input.value = num.toFixed(2).replace('.', ',');
    
    // Atualizar preview da margem
    updateMarginPreview();
}

/**
 * Fecha um modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Mostra uma notificação toast
 */
function showToast(message, type = 'info') {
    // Criar elemento toast
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
    
    // Remover após 3 segundos
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Fecha o modal ao clicar fora
 */
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

/**
 * Formata data para exibição
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
 * Formata valor monetário
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
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
 * Atualiza o esquema da tabela products no Supabase
 * Execute este SQL se a tabela ainda não existir:
 */
/*
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(200) NOT NULL,
    cost_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    sale_value DECIMAL(10,2) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para código automático (opcional, pois já geramos no JS)
CREATE OR REPLACE FUNCTION generate_product_code()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    IF NEW.code IS NULL THEN
        SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 6) AS INTEGER)), 0) + 1
        INTO next_num
        FROM products;
        
        NEW.code := 'PROD-' || LPAD(next_num::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_code
    BEFORE INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION generate_product_code();
*/

// Exportar funções para uso global
window.showProductModal = showProductModal;
window.editProduct = editProduct;
window.viewProduct = viewProduct;
window.deleteProduct = deleteProduct;
window.closeModal = closeModal;
window.formatMoneyInput = formatMoneyInput;