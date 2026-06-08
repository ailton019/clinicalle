// js/sales.js - Módulo de Vendas com Busca por Digitação e Desconto
console.log('📦 Carregando sales.js...');

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let todosClientes = [];
let todosProdutos = [];

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================
function loadSales() {
    console.log('🛒 loadSales() chamada!');
    
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) {
        console.error('❌ contentArea não encontrado');
        return;
    }
    
    document.getElementById('pageTitle').textContent = 'Vendas';
    
    contentArea.innerHTML = `
        <!-- Cards de Resumo -->
        <div class="stats-grid" style="margin-bottom: 30px;">
            <div class="stat-card success">
                <div class="stat-icon"><i class="fas fa-dollar-sign"></i></div>
                <div class="stat-value" id="totalFaturamento">R$ 0,00</div>
                <div class="stat-label">Faturamento Total</div>
            </div>
            <div class="stat-card primary">
                <div class="stat-icon"><i class="fas fa-shopping-cart"></i></div>
                <div class="stat-value" id="totalVendas">0</div>
                <div class="stat-label">Total de Vendas</div>
            </div>
            <div class="stat-card info">
                <div class="stat-icon"><i class="fas fa-receipt"></i></div>
                <div class="stat-value" id="ticketMedio">R$ 0,00</div>
                <div class="stat-label">Ticket Médio</div>
            </div>
            <div class="stat-card warning" onclick="showGoalModal()" style="cursor: pointer;" title="Clique para definir meta mensal">
                <div class="stat-icon"><i class="fas fa-bullseye"></i></div>
                <div class="stat-value" id="metaMensal">R$ 0,00</div>
                <div class="stat-label">Meta do Mês</div>
                <div id="metaProgresso" style="margin-top: 8px; font-size: 12px; color: #718096;">
                    <span style="color: #3182ce; cursor: pointer;">📌 Clique para definir meta</span>
                </div>
            </div>
        </div>
        
        <!-- Filtros -->
        <div class="filters-bar">
            <button class="filter-btn active" data-period="today">Hoje</button>
            <button class="filter-btn" data-period="7days">7 Dias</button>
            <button class="filter-btn" data-period="30days">30 Dias</button>
            <button class="filter-btn" data-period="month">Este Mês</button>
            <button class="filter-btn" data-period="all">Todos</button>
        </div>
        
        <!-- Tabela de Vendas -->
        <div class="table-container">
            <div class="table-header">
                <h2>Registro de Vendas</h2>
                <div class="table-actions">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="searchSale" placeholder="Buscar por cliente ou produto...">
                    </div>
                    <button class="btn-primary" onclick="showSaleModal()">
                        <i class="fas fa-plus"></i> Nova Venda
                    </button>
                </div>
            </div>
            
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Cliente</th>
                            <th>Produto</th>
                            <th>Qtd</th>
                            <th>Valor Unit.</th>
                            <th>Desconto</th>
                            <th>Valor Total</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="salesTableBody">
                        <tr>
                            <td colspan="8" style="text-align: center; padding: 40px;">
                                <i class="fas fa-spinner fa-spin"></i> Carregando...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- ============================================ -->
        <!-- MODAL DE VENDA -->
        <!-- ============================================ -->
        <div id="saleModal" class="modal">
            <div class="modal-content" style="max-width: 650px;">
                <div class="modal-header">
                    <h3><i class="fas fa-shopping-cart"></i> Nova Venda</h3>
                    <button class="modal-close" onclick="closeModal('saleModal')">&times;</button>
                </div>
                
                <form id="saleForm" onsubmit="return salvarVenda(event)">
                
                    <!-- CAMPO CLIENTE COM BUSCA -->
                    <div class="form-group">
                        <label><i class="fas fa-user"></i> Cliente *</label>
                        <div style="position: relative;">
                            <input type="text" 
                                   id="saleClientSearch" 
                                   placeholder="🔍 Digite para buscar cliente..."
                                   autocomplete="off"
                                   style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px;"
                                   oninput="filtrarClientes()"
                                   onfocus="mostrarListaClientes()">
                            <input type="hidden" id="saleClient" required>
                            <div id="clientesLista" 
                                 style="display: none; position: absolute; top: 100%; left: 0; right: 0; 
                                        max-height: 200px; overflow-y: auto; background: white; 
                                        border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px; 
                                        z-index: 1000; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                            </div>
                        </div>
                    </div>
                    
                    <!-- CAMPO PRODUTO COM BUSCA -->
                    <div class="form-group">
                        <label><i class="fas fa-box"></i> Produto *</label>
                        <div style="position: relative;">
                            <input type="text" 
                                   id="saleProductSearch" 
                                   placeholder="🔍 Digite para buscar produto..."
                                   autocomplete="off"
                                   style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px;"
                                   oninput="filtrarProdutos()"
                                   onfocus="mostrarListaProdutos()">
                            <input type="hidden" id="saleProduct" required>
                            <div id="produtosLista" 
                                 style="display: none; position: absolute; top: 100%; left: 0; right: 0; 
                                        max-height: 200px; overflow-y: auto; background: white; 
                                        border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px; 
                                        z-index: 1000; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                            </div>
                        </div>
                        <div id="productInfo" style="display:none; margin-top:8px; padding:10px; background:#f0fff4; border-radius:6px;">
                            <span id="infoCode" style="font-weight:600;"></span> - 
                            <span id="infoPrice" style="color:#38a169; font-weight:600;"></span>
                        </div>
                    </div>
                    
                    <!-- QUANTIDADE E VALOR UNITÁRIO -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label><i class="fas fa-hashtag"></i> Quantidade *</label>
                            <input type="number" id="saleQuantity" required min="1" value="1" 
                                   onchange="calcularTotal()" oninput="calcularTotal()"
                                   style="padding: 12px; font-size: 16px;">
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-tag"></i> Valor Unitário *</label>
                            <input type="text" id="saleUnitValue" required placeholder="0,00" readonly 
                                   style="background:#f7fafc; padding: 12px; font-size: 16px; font-weight: 600;">
                        </div>
                    </div>
                    
                    <!-- ============================================ -->
                    <!-- CAMPO DE DESCONTO -->
                    <!-- ============================================ -->
                    <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #fefcbf;">
                        <label style="font-weight: 600; color: #744210; margin-bottom: 10px; display: block;">
                            <i class="fas fa-tags"></i> Desconto
                        </label>
                        
                        <!-- Seleção do tipo de desconto -->
                        <div style="display: flex; gap: 15px; margin-bottom: 10px;">
                            <label style="cursor: pointer; display: flex; align-items: center; gap: 5px; font-weight: 500;">
                                <input type="radio" name="discountType" value="percent" checked onchange="toggleDiscountType()">
                                <span>Porcentagem (%)</span>
                            </label>
                            <label style="cursor: pointer; display: flex; align-items: center; gap: 5px; font-weight: 500;">
                                <input type="radio" name="discountType" value="real" onchange="toggleDiscountType()">
                                <span>Valor em Reais (R$)</span>
                            </label>
                        </div>
                        
                        <!-- Input de desconto -->
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="text" 
                                   id="saleDiscount" 
                                   value="0,00"
                                   placeholder="0,00"
                                   style="flex: 1; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 16px; font-weight: 600;"
                                   oninput="calcularTotal()">
                            <span id="discountSymbol" style="font-size: 20px; font-weight: 700; color: #744210; min-width: 30px; text-align: center;">%</span>
                        </div>
                        
                        <!-- Valor do desconto em R$ -->
                        <div id="discountValueDisplay" style="margin-top: 8px; text-align: right; font-size: 13px; color: #e53e3e; display: none;">
                            Desconto: <strong>R$ 0,00</strong>
                        </div>
                    </div>
                    
                    <!-- RESUMO DA VENDA -->
                    <div id="saleResumo" style="display:none; background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <table style="width: 100%; font-size: 14px;">
                            <tr>
                                <td style="color: #718096; padding: 3px 0;">Subtotal (${document.getElementById('saleQuantity')?.value || 1}x):</td>
                                <td style="text-align: right;" id="resumoSubtotal">R$ 0,00</td>
                            </tr>
                            <tr>
                                <td style="color: #718096; padding: 3px 0;">Desconto:</td>
                                <td style="text-align: right; color: #e53e3e;" id="resumoDesconto">- R$ 0,00</td>
                            </tr>
                            <tr>
                                <td colspan="2" style="border-top: 2px solid #e2e8f0; padding-top: 10px; margin-top: 5px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-weight: 700; font-size: 16px;">VALOR TOTAL:</span>
                                        <span id="totalValue" style="font-weight: 700; font-size: 24px; color: #38a169;">R$ 0,00</span>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <!-- DATA DA VENDA -->
                    <div class="form-group">
                        <label><i class="fas fa-calendar"></i> Data da Venda *</label>
                        <input type="datetime-local" id="saleDate" required 
                               style="padding: 12px; font-size: 14px;">
                    </div>
                    
                    <!-- BOTÕES -->
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeModal('saleModal')">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i> Registrar Venda
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Modal de Meta Mensal -->
        <div id="goalModal" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3><i class="fas fa-bullseye"></i> Meta Mensal</h3>
                    <button class="modal-close" onclick="closeModal('goalModal')">&times;</button>
                </div>
                
                <form id="goalForm" onsubmit="return salvarMeta(event)">
                    <input type="hidden" id="goalId">
                    
                    <div class="form-group">
                        <label>Mês de Referência *</label>
                        <input type="month" id="goalMonth" required style="width: 100%; padding: 12px;">
                    </div>
                    
                    <div class="form-group">
                        <label><i class="fas fa-dollar-sign"></i> Meta de Faturamento (R$) *</label>
                        <input type="text" id="goalRevenue" required placeholder="0,00" 
                               class="money-input" oninput="formatGoalMoney(this)">
                    </div>
                    
                    <div class="form-group">
                        <label><i class="fas fa-shopping-cart"></i> Meta de Vendas (Qtd) *</label>
                        <input type="number" id="goalSales" required min="1" placeholder="30">
                    </div>
                    
                    <div class="form-group">
                        <label><i class="fas fa-users"></i> Meta de Novos Clientes</label>
                        <input type="number" id="goalClients" min="0" placeholder="15">
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeModal('goalModal')">Cancelar</button>
                        <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Salvar Meta</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Configurar data atual
    document.getElementById('saleDate').value = new Date().toISOString().slice(0, 16);
    
    // Carregar dados iniciais
    carregarVendas();
    carregarMetaAtual();
    
    // Event listeners
    document.getElementById('searchSale').addEventListener('input', function() {
        carregarVendas(this.value);
    });
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            carregarVendas();
        });
    });
    
    // Fechar listas ao clicar fora
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#saleClientSearch') && !e.target.closest('#clientesLista')) {
            const lista = document.getElementById('clientesLista');
            if (lista) lista.style.display = 'none';
        }
        if (!e.target.closest('#saleProductSearch') && !e.target.closest('#produtosLista')) {
            const lista = document.getElementById('produtosLista');
            if (lista) lista.style.display = 'none';
        }
    });
    
    console.log('✅ Módulo de vendas carregado!');
}

// ============================================
// BUSCA DE CLIENTES
// ============================================

async function carregarTodosClientes() {
    try {
        const { data } = await supabaseClient
            .from('clients')
            .select('id, name, phone')
            .order('name');
        todosClientes = data || [];
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

async function carregarTodosProdutos() {
    try {
        const { data } = await supabaseClient
            .from('products')
            .select('id, code, description, sale_value')
            .eq('active', true)
            .order('description');
        todosProdutos = data || [];
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

function mostrarListaClientes() {
    carregarTodosClientes().then(() => {
        filtrarClientes();
        document.getElementById('clientesLista').style.display = 'block';
    });
}

function filtrarClientes() {
    const search = document.getElementById('saleClientSearch').value.toLowerCase();
    const lista = document.getElementById('clientesLista');
    
    const filtrados = todosClientes.filter(c => 
        c.name.toLowerCase().includes(search) || c.phone.includes(search)
    );
    
    if (filtrados.length === 0) {
        lista.innerHTML = '<div style="padding: 10px; color: #718096; text-align: center;">Nenhum cliente encontrado</div>';
    } else {
        lista.innerHTML = filtrados.map(c => `
            <div onclick="selecionarCliente('${c.id}', '${c.name.replace(/'/g, "\\'")}', '${c.phone || ''}')" 
                 style="padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #f0f0f0; transition: background 0.2s;"
                 onmouseover="this.style.background='#ebf8ff'" onmouseout="this.style.background='white'">
                <strong>${c.name}</strong><br>
                <small style="color: #718096;">📱 ${c.phone || 'Sem telefone'}</small>
            </div>
        `).join('');
    }
    lista.style.display = 'block';
}

function selecionarCliente(id, name, phone) {
    document.getElementById('saleClient').value = id;
    document.getElementById('saleClientSearch').value = name + (phone ? ' - ' + phone : '');
    document.getElementById('clientesLista').style.display = 'none';
}

// ============================================
// BUSCA DE PRODUTOS
// ============================================

function mostrarListaProdutos() {
    carregarTodosProdutos().then(() => {
        filtrarProdutos();
        document.getElementById('produtosLista').style.display = 'block';
    });
}

function filtrarProdutos() {
    const search = document.getElementById('saleProductSearch').value.toLowerCase();
    const lista = document.getElementById('produtosLista');
    
    const filtrados = todosProdutos.filter(p => 
        p.code.toLowerCase().includes(search) || p.description.toLowerCase().includes(search)
    );
    
    if (filtrados.length === 0) {
        lista.innerHTML = '<div style="padding: 10px; color: #718096; text-align: center;">Nenhum produto encontrado</div>';
    } else {
        lista.innerHTML = filtrados.map(p => `
            <div onclick="selecionarProduto('${p.id}', '${p.code}', '${p.description.replace(/'/g, "\\'")}', ${p.sale_value})" 
                 style="padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #f0f0f0; transition: background 0.2s;"
                 onmouseover="this.style.background='#f0fff4'" onmouseout="this.style.background='white'">
                <strong>${p.code}</strong> - ${p.description}<br>
                <small style="color: #38a169; font-weight: 600;">R$ ${parseFloat(p.sale_value).toFixed(2)}</small>
            </div>
        `).join('');
    }
    lista.style.display = 'block';
}

function selecionarProduto(id, code, description, price) {
    document.getElementById('saleProduct').value = id;
    document.getElementById('saleProductSearch').value = code + ' - ' + description;
    document.getElementById('produtosLista').style.display = 'none';
    
    document.getElementById('infoCode').textContent = code;
    document.getElementById('infoPrice').textContent = 'R$ ' + parseFloat(price).toFixed(2);
    document.getElementById('productInfo').style.display = 'block';
    document.getElementById('saleUnitValue').value = parseFloat(price).toFixed(2).replace('.', ',');
    
    // Resetar desconto ao trocar produto
    document.getElementById('saleDiscount').value = '0,00';
    document.querySelector('input[name="discountType"][value="percent"]').checked = true;
    document.getElementById('discountSymbol').textContent = '%';
    document.getElementById('discountValueDisplay').style.display = 'none';
    
    calcularTotal();
}

// ============================================
// TOGGLE TIPO DE DESCONTO
// ============================================

function toggleDiscountType() {
    const tipo = document.querySelector('input[name="discountType"]:checked')?.value;
    const symbol = document.getElementById('discountSymbol');
    const display = document.getElementById('discountValueDisplay');
    const input = document.getElementById('saleDiscount');
    
    if (tipo === 'percent') {
        symbol.textContent = '%';
        display.style.display = 'none';
        // Limitar a 100%
        if (parseFloat(input.value.replace(',', '.')) > 100) {
            input.value = '100,00';
        }
    } else {
        symbol.textContent = 'R$';
        display.style.display = 'block';
    }
    
    calcularTotal();
}

// ============================================
// CALCULAR TOTAL COM DESCONTO
// ============================================

function calcularTotal() {
    const qtd = parseInt(document.getElementById('saleQuantity').value) || 0;
    const valorUnit = parseFloat((document.getElementById('saleUnitValue').value || '0').replace(',', '.')) || 0;
    const discountInput = document.getElementById('saleDiscount');
    const discountValue = parseFloat((discountInput.value || '0').replace(',', '.')) || 0;
    const discountType = document.querySelector('input[name="discountType"]:checked')?.value || 'percent';
    
    const resumoDiv = document.getElementById('saleResumo');
    
    if (qtd > 0 && valorUnit > 0) {
        const subtotal = qtd * valorUnit;
        let descontoReal = 0;
        let descontoPercentual = 0;
        
        if (discountType === 'percent') {
            // Desconto em %
            descontoPercentual = Math.min(discountValue, 100); // Máximo 100%
            descontoReal = subtotal * (descontoPercentual / 100);
        } else {
            // Desconto em R$
            descontoReal = Math.min(discountValue, subtotal); // Não pode ser maior que o subtotal
            descontoPercentual = subtotal > 0 ? (descontoReal / subtotal) * 100 : 0;
        }
        
        const total = subtotal - descontoReal;
        
        // Atualizar display do desconto em R$
        document.getElementById('discountValueDisplay').style.display = discountType === 'real' ? 'block' : 'none';
        document.getElementById('discountValueDisplay').innerHTML = 
            `Desconto: <strong>R$ ${descontoReal.toFixed(2)}</strong> (${descontoPercentual.toFixed(1)}%)`;
        
        // Atualizar resumo
        resumoDiv.style.display = 'block';
        document.getElementById('resumoSubtotal').textContent = 'R$ ' + subtotal.toFixed(2).replace('.', ',');
        document.getElementById('resumoDesconto').textContent = '- R$ ' + descontoReal.toFixed(2).replace('.', ',');
        document.getElementById('totalValue').textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
        
        // Colorir total
        const totalEl = document.getElementById('totalValue');
        if (total > 500) totalEl.style.color = '#38a169';
        else if (total > 100) totalEl.style.color = '#d69e2e';
        else totalEl.style.color = '#e53e3e';
        
    } else {
        resumoDiv.style.display = 'none';
    }
}

// ============================================
// SALVAR VENDA COM DESCONTO
// ============================================

async function salvarVenda(e) {
    e.preventDefault();
    
    const clientId = document.getElementById('saleClient').value;
    const productId = document.getElementById('saleProduct').value;
    const quantity = parseInt(document.getElementById('saleQuantity').value);
    const unitValue = parseFloat((document.getElementById('saleUnitValue').value || '0').replace(',', '.'));
    const discountValue = parseFloat((document.getElementById('saleDiscount').value || '0').replace(',', '.')) || 0;
    const discountType = document.querySelector('input[name="discountType"]:checked')?.value || 'percent';
    const saleDate = document.getElementById('saleDate').value;
    
    // Validações
    if (!clientId) { alert('❌ Selecione um cliente!'); return false; }
    if (!productId) { alert('❌ Selecione um produto!'); return false; }
    if (!quantity || quantity < 1) { alert('❌ Quantidade inválida!'); return false; }
    if (!unitValue || unitValue <= 0) { alert('❌ Valor unitário inválido!'); return false; }
    
    // Calcular total com desconto
    const subtotal = quantity * unitValue;
    let discountPercent = 0;
    let discountReal = 0;
    
    if (discountType === 'percent') {
        discountPercent = Math.min(discountValue, 100);
        discountReal = subtotal * (discountPercent / 100);
    } else {
        discountReal = Math.min(discountValue, subtotal);
        discountPercent = subtotal > 0 ? (discountReal / subtotal) * 100 : 0;
    }
    
    const totalValue = subtotal - discountReal;
    
    if (totalValue < 0) { alert('❌ O desconto não pode ser maior que o valor total!'); return false; }
    
    // Confirmar venda
    const confirmed = confirm(
        `📋 CONFIRMAR VENDA\n\n` +
        `Subtotal: R$ ${subtotal.toFixed(2)}\n` +
        `Desconto: R$ ${discountReal.toFixed(2)} (${discountPercent.toFixed(1)}%)\n` +
        `TOTAL: R$ ${totalValue.toFixed(2)}\n\n` +
        `Confirmar registro?`
    );
    
    if (!confirmed) return false;
    
    try {
        const { error } = await supabaseClient
            .from('sales')
            .insert({
                client_id: clientId,
                product_id: productId,
                value: unitValue,
                quantity: quantity,
                discount_percent: parseFloat(discountPercent.toFixed(2)),
                discount_value: parseFloat(discountReal.toFixed(2)),
                total_value: parseFloat(totalValue.toFixed(2)),
                sale_date: saleDate,
                created_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        alert('✅ Venda registrada com sucesso!');
        closeModal('saleModal');
        carregarVendas();
        carregarMetaAtual();
        
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao registrar venda: ' + error.message);
    }
    
    return false;
}

// ============================================
// CARREGAR VENDAS
// ============================================

async function carregarVendas(searchTerm = '') {
    const tbody = document.getElementById('salesTableBody');
    
    try {
        const activePeriod = document.querySelector('.filter-btn.active')?.dataset?.period || 'today';
        
        let query = supabaseClient
            .from('sales')
            .select(`*, client:client_id (name), product:product_id (code, description)`)
            .order('created_at', { ascending: false });
        
        if (activePeriod !== 'all') {
            const { startDate, endDate } = getDateRange(activePeriod);
            query = query.gte('sale_date', startDate.split('T')[0]).lte('sale_date', endDate.split('T')[0]);
        }
        
        if (searchTerm) {
            query = query.or(`client.name.ilike.%${searchTerm}%,product.description.ilike.%${searchTerm}%`);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        const vendas = data || [];
        
        if (vendas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:40px;">
                <i class="fas fa-shopping-cart" style="font-size:48px; color:#cbd5e0;"></i>
                <p style="color:#718096; margin-top:15px;">Nenhuma venda encontrada</p>
            </td></tr>`;
            document.getElementById('totalFaturamento').textContent = 'R$ 0,00';
            document.getElementById('totalVendas').textContent = '0';
            document.getElementById('ticketMedio').textContent = 'R$ 0,00';
            return;
        }
        
        tbody.innerHTML = vendas.map(v => {
            const desconto = parseFloat(v.discount_value) || 0;
            const total = parseFloat(v.total_value) || 0;
            
            return `
            <tr>
                <td>${new Date(v.sale_date || v.created_at).toLocaleDateString('pt-BR')}</td>
                <td><strong>${v.client?.name || 'N/A'}</strong></td>
                <td>${v.product?.code || ''} - ${v.product?.description || 'N/A'}</td>
                <td style="text-align:center;">${v.quantity}x</td>
                <td>R$ ${parseFloat(v.value).toFixed(2)}</td>
                <td style="color: ${desconto > 0 ? '#e53e3e' : '#718096'};">
                    ${desconto > 0 ? '- R$ ' + desconto.toFixed(2) + ' (' + (v.discount_percent || 0).toFixed(1) + '%)' : '-'}
                </td>
                <td><strong>R$ ${total.toFixed(2)}</strong></td>
                <td>
                    <button class="btn-danger btn-sm" onclick="excluirVenda('${v.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `}).join('');
        
        const totalFaturamento = vendas.reduce((sum, v) => sum + parseFloat(v.total_value || 0), 0);
        document.getElementById('totalFaturamento').textContent = 'R$ ' + totalFaturamento.toFixed(2);
        document.getElementById('totalVendas').textContent = vendas.length;
        document.getElementById('ticketMedio').textContent = 'R$ ' + (vendas.length > 0 ? (totalFaturamento / vendas.length).toFixed(2) : '0,00');
        
    } catch (error) {
        console.error('Erro ao carregar vendas:', error);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Erro ao carregar vendas</td></tr>`;
    }
}

async function excluirVenda(id) {
    if (!confirm('Excluir esta venda?')) return;
    try {
        const { error } = await supabaseClient.from('sales').delete().eq('id', id);
        if (error) throw error;
        carregarVendas();
        carregarMetaAtual();
    } catch (error) {
        alert('Erro ao excluir: ' + error.message);
    }
}

// ============================================
// METAS MENSAIS
// ============================================

async function showGoalModal() {
    const now = new Date();
    document.getElementById('goalMonth').value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    
    try {
        const { data } = await supabaseClient
            .from('monthly_goals')
            .select('*')
            .eq('month', now.getMonth() + 1)
            .eq('year', now.getFullYear())
            .single();
        
        if (data) {
            document.getElementById('goalId').value = data.id;
            document.getElementById('goalRevenue').value = formatMoneyValue(data.revenue_goal);
            document.getElementById('goalSales').value = data.sales_goal;
            document.getElementById('goalClients').value = data.clients_goal || 0;
        } else {
            document.getElementById('goalId').value = '';
            document.getElementById('goalRevenue').value = '';
            document.getElementById('goalSales').value = '';
            document.getElementById('goalClients').value = '';
        }
    } catch (e) {
        document.getElementById('goalId').value = '';
    }
    document.getElementById('goalModal').classList.add('show');
}

async function salvarMeta(e) {
    e.preventDefault();
    const goalId = document.getElementById('goalId').value;
    const [year, month] = document.getElementById('goalMonth').value.split('-').map(Number);
    const revenueGoal = parseMoneyValue(document.getElementById('goalRevenue').value);
    const salesGoal = parseInt(document.getElementById('goalSales').value);
    const clientsGoal = parseInt(document.getElementById('goalClients').value) || 0;
    
    if (!revenueGoal || revenueGoal <= 0) { alert('Informe a meta!'); return false; }
    if (!salesGoal || salesGoal < 1) { alert('Informe a meta de vendas!'); return false; }
    
    try {
        const goalData = { month, year, revenue_goal: revenueGoal, sales_goal: salesGoal, clients_goal: clientsGoal };
        if (goalId) {
            await supabaseClient.from('monthly_goals').update({ ...goalData, updated_at: new Date().toISOString() }).eq('id', goalId);
        } else {
            await supabaseClient.from('monthly_goals').insert({ ...goalData, created_at: new Date().toISOString() });
        }
        alert('✅ Meta salva!');
        closeModal('goalModal');
        carregarMetaAtual();
    } catch (error) {
        alert('Erro: ' + error.message);
    }
    return false;
}

async function carregarMetaAtual() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    try {
        const { data: goal } = await supabaseClient.from('monthly_goals').select('*').eq('month', month).eq('year', year).single();
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date().toISOString().split('T')[0];
        const { data: vendasMes } = await supabaseClient.from('sales').select('*').gte('sale_date', startDate).lte('sale_date', endDate);
        
        const faturamentoAtual = (vendasMes || []).reduce((sum, v) => sum + parseFloat(v.total_value || 0), 0);
        const vendasAtual = (vendasMes || []).length;
        
        if (goal) {
            const percentual = goal.revenue_goal > 0 ? (faturamentoAtual / goal.revenue_goal) * 100 : 0;
            document.getElementById('metaMensal').textContent = formatCurrency(goal.revenue_goal);
            document.getElementById('metaProgresso').innerHTML = `
                <div style="margin-top:5px;">
                    <div style="display:flex;justify-content:space-between;font-size:11px;">
                        <span>💰 ${percentual.toFixed(1)}%</span>
                        <span>🛒 ${vendasAtual}/${goal.sales_goal}</span>
                    </div>
                    <div style="background:#e2e8f0;height:6px;border-radius:3px;margin-top:4px;">
                        <div style="background:${percentual>=100?'#38a169':percentual>=50?'#d69e2e':'#e53e3e'};height:100%;width:${Math.min(percentual,100)}%;border-radius:3px;"></div>
                    </div>
                    <div style="text-align:center;font-size:11px;margin-top:3px;color:#718096;">${formatCurrency(faturamentoAtual)} de ${formatCurrency(goal.revenue_goal)}</div>
                </div>`;
        } else {
            document.getElementById('metaMensal').textContent = 'R$ 0,00';
            document.getElementById('metaProgresso').innerHTML = '<span style="color:#3182ce;cursor:pointer;" onclick="showGoalModal()">📌 Clique para definir meta</span>';
        }
    } catch (error) {
        console.error('Erro ao carregar meta:', error);
    }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function showSaleModal() {
    document.getElementById('saleModal').classList.add('show');
    document.getElementById('saleDate').value = new Date().toISOString().slice(0, 16);
    document.getElementById('saleForm').reset();
    document.getElementById('saleQuantity').value = '1';
    document.getElementById('saleDiscount').value = '0,00';
    document.querySelector('input[name="discountType"][value="percent"]').checked = true;
    document.getElementById('discountSymbol').textContent = '%';
    document.getElementById('discountValueDisplay').style.display = 'none';
    document.getElementById('productInfo').style.display = 'none';
    document.getElementById('saleResumo').style.display = 'none';
    document.getElementById('saleClientSearch').value = '';
    document.getElementById('saleProductSearch').value = '';
    document.getElementById('saleClient').value = '';
    document.getElementById('saleProduct').value = '';
    document.getElementById('clientesLista').style.display = 'none';
    document.getElementById('produtosLista').style.display = 'none';
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('show');
}

function getDateRange(period) {
    const now = new Date();
    let start, end;
    switch(period) {
        case 'today': start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59); break;
        case '7days': start = new Date(now.getTime() - 7*24*60*60*1000); end = now; break;
        case '30days': start = new Date(now.getTime() - 30*24*60*60*1000); end = now; break;
        case 'month': start = new Date(now.getFullYear(), now.getMonth(), 1); end = now; break;
        default: start = new Date(2000, 0, 1); end = now;
    }
    return { startDate: start.toISOString(), endDate: end.toISOString() };
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function formatMoneyValue(value) {
    if (!value && value !== 0) return '';
    return parseFloat(value).toFixed(2).replace('.', ',');
}

function parseMoneyValue(value) {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}

function formatGoalMoney(input) {
    let value = input.value.replace(/\D/g, '');
    if (value === '') { input.value = ''; return; }
    input.value = (parseFloat(value) / 100).toFixed(2).replace('.', ',');
}

// Fechar modal ao clicar fora
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

// Exportar funções globais
window.showSaleModal = showSaleModal;
window.showGoalModal = showGoalModal;
window.closeModal = closeModal;
window.calcularTotal = calcularTotal;
window.toggleDiscountType = toggleDiscountType;
window.excluirVenda = excluirVenda;
window.formatGoalMoney = formatGoalMoney;
window.selecionarCliente = selecionarCliente;
window.selecionarProduto = selecionarProduto;
window.filtrarClientes = filtrarClientes;
window.filtrarProdutos = filtrarProdutos;
window.mostrarListaClientes = mostrarListaClientes;
window.mostrarListaProdutos = mostrarListaProdutos;

console.log('✅ Módulo de Vendas carregado!');