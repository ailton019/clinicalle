// js/vendas.js - Módulo de Vendas com Busca por Digitação, Desconto e Filtro de Data
console.log('📦 Carregando vendas.js...');

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let todosClientes = [];
let todosProdutos = [];
let saleItems = [];
let currentSearchTerm = '';
let currentDateFilter = 'today';
let customStartDate = null;
let customEndDate = null;

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================
function loadSales() {
    console.log('🛒 loadSales() chamada!');
    
    document.getElementById('pageTitle').textContent = 'Vendas';
    
    // Configurar data e hora atual no campo saleDate
    const dateInput = document.getElementById('saleDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().slice(0, 16);
    }
    
    // Carregar dados iniciais
    carregarTodosClientes();
    carregarTodosProdutos();
    carregarVendas();
    carregarMetaAtual();
    
    // Event listeners
    const searchInput = document.getElementById('searchSale');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            currentSearchTerm = e.target.value;
            carregarVendas();
        });
    }
    
    // Filtros de período
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentDateFilter = this.dataset.period;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar/esconder filtro personalizado
            const customFilter = document.getElementById('customDateFilter');
            if (customFilter) {
                customFilter.style.display = currentDateFilter === 'custom' ? 'flex' : 'none';
            }
            
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
// FILTRO PERSONALIZADO
// ============================================

function aplicarFiltroPersonalizado() {
    const startDate = document.getElementById('customStartDate').value;
    const endDate = document.getElementById('customEndDate').value;
    
    if (!startDate || !endDate) {
        alert('Selecione as datas de início e fim');
        return;
    }
    
    customStartDate = startDate;
    customEndDate = endDate;
    carregarVendas();
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
        console.log(`📋 ${todosClientes.length} clientes carregados`);
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
        console.log(`📦 ${todosProdutos.length} produtos carregados`);
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

function mostrarListaClientes() {
    if (todosClientes.length === 0) {
        carregarTodosClientes().then(() => filtrarClientes());
    } else {
        filtrarClientes();
    }
    document.getElementById('clientesLista').style.display = 'block';
}

function filtrarClientes() {
    const search = document.getElementById('saleClientSearch').value.toLowerCase();
    const lista = document.getElementById('clientesLista');
    
    const filtrados = todosClientes.filter(c => 
        c.name.toLowerCase().includes(search) || (c.phone && c.phone.includes(search))
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
    if (todosProdutos.length === 0) {
        carregarTodosProdutos().then(() => filtrarProdutos());
    } else {
        filtrarProdutos();
    }
    document.getElementById('produtosLista').style.display = 'block';
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
    const summaryDiv = document.getElementById('saleResumo');
    if (!summaryDiv) return;
    
    if (saleItems.length === 0) {
        summaryDiv.style.display = 'none';
        return;
    }
    
    const subtotal = saleItems.reduce((sum, item) => sum + item.subtotal, 0);
    const discountInput = document.getElementById('saleDiscount');
    const discountValue = parseFloat((discountInput.value || '0').replace(',', '.')) || 0;
    const discountType = document.querySelector('input[name="discountType"]:checked')?.value || 'percent';
    
    let descontoReal = 0;
    let descontoPercentual = 0;
    
    if (discountType === 'percent') {
        descontoPercentual = Math.min(discountValue, 100);
        descontoReal = subtotal * (descontoPercentual / 100);
    } else {
        descontoReal = Math.min(discountValue, subtotal);
        descontoPercentual = subtotal > 0 ? (descontoReal / subtotal) * 100 : 0;
    }
    
    const total = subtotal - descontoReal;
    
    const discountDisplay = document.getElementById('discountValueDisplay');
    if (discountDisplay) {
        discountDisplay.style.display = discountType === 'real' ? 'block' : 'none';
        discountDisplay.innerHTML = `Desconto: <strong>R$ ${descontoReal.toFixed(2)}</strong> (${descontoPercentual.toFixed(1)}%)`;
    }
    
    summaryDiv.style.display = 'block';
    document.getElementById('resumoSubtotal').textContent = 'R$ ' + subtotal.toFixed(2).replace('.', ',');
    document.getElementById('resumoDesconto').textContent = '- R$ ' + descontoReal.toFixed(2).replace('.', ',');
    document.getElementById('totalValue').textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
    
    const totalEl = document.getElementById('totalValue');
    if (totalEl) {
        if (total > 500) totalEl.style.color = '#38a169';
        else if (total > 100) totalEl.style.color = '#d69e2e';
        else totalEl.style.color = '#e53e3e';
    }
}

// ============================================
// ELEMENTOS DA SACOLA DE COMPRAS
// ============================================

function adicionarItemSacola() {
    const productId = document.getElementById('saleProduct').value;
    const productSearch = document.getElementById('saleProductSearch').value;
    const quantity = parseInt(document.getElementById('saleQuantity').value) || 0;
    const unitValue = parseFloat((document.getElementById('saleUnitValue').value || '0').replace(',', '.')) || 0;
    
    if (!productId || !productSearch) {
        alert('Selecione um produto/serviço antes de adicionar!');
        return;
    }
    
    if (quantity <= 0) {
        alert('A quantidade deve ser maior que zero!');
        return;
    }
    
    const existingItem = saleItems.find(item => item.product_id === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.subtotal = existingItem.quantity * existingItem.price;
    } else {
        saleItems.push({
            product_id: productId,
            product_name: productSearch.split(' - ').slice(1).join(' - ') || productSearch,
            code: productSearch.split(' - ')[0] || '',
            price: unitValue,
            quantity: quantity,
            subtotal: unitValue * quantity
        });
    }
    
    document.getElementById('saleProduct').value = '';
    document.getElementById('saleProductSearch').value = '';
    document.getElementById('saleQuantity').value = '1';
    document.getElementById('saleUnitValue').value = '';
    document.getElementById('productInfo').style.display = 'none';
    
    renderSacola();
    calcularTotal();
}

function removerItemSacola(index) {
    saleItems.splice(index, 1);
    renderSacola();
    calcularTotal();
}

function renderSacola() {
    const container = document.getElementById('sacolaItensContainer');
    const tbody = document.getElementById('sacolaTableBody');
    if (!container || !tbody) return;
    
    if (saleItems.length === 0) {
        container.style.display = 'none';
        tbody.innerHTML = '';
        return;
    }
    
    container.style.display = 'block';
    tbody.innerHTML = saleItems.map((item, index) => `
        <tr>
            <td style="padding: 8px;"><strong>${item.code}</strong> - ${item.product_name}</td>
            <td style="padding: 8px; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; text-align: right;">R$ ${item.price.toFixed(2).replace('.', ',')}</td>
            <td style="padding: 8px; text-align: right;"><strong>R$ ${item.subtotal.toFixed(2).replace('.', ',')}</strong></td>
            <td style="padding: 8px; text-align: center;">
                <button type="button" class="btn-danger btn-sm" onclick="removerItemSacola(${index})" style="padding: 4px 8px;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function limparFormularioVenda() {
    document.getElementById('saleForm')?.reset();
    document.getElementById('saleClient').value = '';
    document.getElementById('saleProduct').value = '';
    document.getElementById('productInfo').style.display = 'none';
    document.getElementById('saleResumo').style.display = 'none';
    document.getElementById('saleDate').value = new Date().toISOString().slice(0, 16);
    saleItems = [];
    renderSacola();
}

// ============================================
// SALVAR VENDA
// ============================================

async function salvarVenda(e) {
    e.preventDefault();
    
    const clientId = document.getElementById('saleClient').value;
    const paymentMethod = document.getElementById('salePaymentMethod').value;
    const saleDate = document.getElementById('saleDate').value;
    const discountValue = parseFloat((document.getElementById('saleDiscount').value || '0').replace(',', '.')) || 0;
    const discountType = document.querySelector('input[name="discountType"]:checked')?.value || 'percent';
    
    if (!clientId) { alert('❌ Selecione um cliente!'); return false; }
    if (saleItems.length === 0) { alert('❌ Adicione pelo menos um produto na sacola!'); return false; }
    if (!paymentMethod) { alert('❌ Selecione a forma de pagamento!'); return false; }
    if (!saleDate) { alert('❌ Selecione a data da venda!'); return false; }
    
    const subtotal = saleItems.reduce((sum, item) => sum + item.subtotal, 0);
    let discountReal = 0;
    let discountPercent = 0;
    
    if (discountType === 'percent') {
        discountPercent = Math.min(discountValue, 100);
        discountReal = subtotal * (discountPercent / 100);
    } else {
        discountReal = Math.min(discountValue, subtotal);
        discountPercent = subtotal > 0 ? (discountReal / subtotal) * 100 : 0;
    }
    
    const totalValue = subtotal - discountReal;
    if (totalValue < 0) { alert('❌ O desconto não pode ser maior que o valor total!'); return false; }
    
    const confirmed = confirm(
        `📋 CONFIRMAR VENDA MULTI-ITENS\n\n` +
        `Cliente: ${document.getElementById('saleClientSearch').value.split(' - ')[0]}\n` +
        `Itens na sacola: ${saleItems.length}\n` +
        `Forma de Pagto.: ${paymentMethod}\n` +
        `Data: ${new Date(saleDate).toLocaleString('pt-BR')}\n\n` +
        `Subtotal: R$ ${subtotal.toFixed(2)}\n` +
        `Desconto: R$ ${discountReal.toFixed(2)} (${discountPercent.toFixed(1)}%)\n` +
        `TOTAL: R$ ${totalValue.toFixed(2)}\n\n` +
        `Confirmar registro?`
    );
    
    if (!confirmed) return false;
    
    const discountRatio = subtotal > 0 ? discountReal / subtotal : 0;
    
    const salesToInsert = saleItems.map(item => {
        const itemSubtotal = item.price * item.quantity;
        const itemDiscountReal = itemSubtotal * discountRatio;
        const itemDiscountPercent = itemSubtotal > 0 ? (itemDiscountReal / itemSubtotal) * 100 : 0;
        const itemTotalValue = itemSubtotal - itemDiscountReal;
        
        return {
            client_id: clientId,
            product_id: item.product_id,
            value: item.price,
            quantity: item.quantity,
            discount_percent: parseFloat(itemDiscountPercent.toFixed(2)),
            discount_value: parseFloat(itemDiscountReal.toFixed(2)),
            total_value: parseFloat(itemTotalValue.toFixed(2)),
            sale_date: saleDate.split('T')[0],
            forma_pagamento: paymentMethod,
            created_at: new Date().toISOString()
        };
    });
    
    try {
        const submitBtn = document.querySelector('#saleForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
        }
        
        const { error } = await supabaseClient
            .from('sales')
            .insert(salesToInsert);
        
        if (error) throw error;
        
        alert('✅ Venda registrada com sucesso!');
        limparFormularioVenda();
        carregarVendas();
        carregarMetaAtual();
        
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao registrar venda: ' + error.message);
    } finally {
        const submitBtn = document.querySelector('#saleForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Registrar Venda';
        }
    }
    
    return false;
}

// ============================================
// CARREGAR VENDAS
// ============================================

async function carregarVendas() {
    const tbody = document.getElementById('salesTableBody');
    if (!tbody) return;
    
    try {
        let query = supabaseClient
            .from('sales')
            .select(`*, client:client_id (name), product:product_id (code, description)`)
            .order('sale_date', { ascending: false });
        
        // Aplicar filtro de data
        if (currentDateFilter === 'custom' && customStartDate && customEndDate) {
            query = query.gte('sale_date', customStartDate)
                         .lte('sale_date', customEndDate);
        } else if (currentDateFilter !== 'all') {
            const { startDate, endDate } = getDateRange(currentDateFilter);
            query = query.gte('sale_date', startDate.split('T')[0])
                         .lte('sale_date', endDate.split('T')[0]);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        let vendas = data || [];
        
        // Aplicar filtro de busca (cliente ou produto)
        if (currentSearchTerm) {
            const searchLower = currentSearchTerm.toLowerCase();
            vendas = vendas.filter(v => 
                (v.client?.name || '').toLowerCase().includes(searchLower) ||
                (v.product?.code || '').toLowerCase().includes(searchLower) ||
                (v.product?.description || '').toLowerCase().includes(searchLower)
            );
        }
        
        if (vendas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:40px;">
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
            const dataVenda = new Date(v.sale_date || v.created_at);
            
            return `
            <tr>
                <td>${dataVenda.toLocaleDateString('pt-BR')} ${dataVenda.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</td>
                <td><strong>${v.client?.name || 'N/A'}</strong></td>
                <td>${v.product?.code || ''} - ${v.product?.description || 'N/A'}</td>
                <td style="text-align:center;">${v.quantity}x</td>
                <td>R$ ${parseFloat(v.value).toFixed(2)}</td>
                <td style="color: ${desconto > 0 ? '#e53e3e' : '#718096'};">
                    ${desconto > 0 ? '- R$ ' + desconto.toFixed(2) + ' (' + (v.discount_percent || 0).toFixed(1) + '%)' : '-'}
                </td>
                <td><span style="background: rgba(91, 192, 190, 0.2); color: var(--tropical-teal); padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px;">${v.forma_pagamento || 'N/A'}</span></td>
                <td><strong>R$ ${total.toFixed(2)}</strong></td>
                <td>
                    <button class="btn-danger btn-sm" onclick="excluirVenda('${v.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
        
        const totalFaturamento = vendas.reduce((sum, v) => sum + parseFloat(v.total_value || 0), 0);
        document.getElementById('totalFaturamento').textContent = 'R$ ' + totalFaturamento.toFixed(2);
        document.getElementById('totalVendas').textContent = vendas.length;
        document.getElementById('ticketMedio').textContent = 'R$ ' + (vendas.length > 0 ? (totalFaturamento / vendas.length).toFixed(2) : '0,00');
        
    } catch (error) {
        console.error('Erro ao carregar vendas:', error);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Erro ao carregar vendas: ${error.message}</td></tr>`;
    }
}

async function excluirVenda(id) {
    if (!confirm('⚠️ Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.')) return;
    
    try {
        const { error } = await supabaseClient.from('sales').delete().eq('id', id);
        if (error) throw error;
        
        alert('✅ Venda excluída com sucesso!');
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
        } else {
            document.getElementById('goalId').value = '';
            document.getElementById('goalRevenue').value = '';
            document.getElementById('goalSales').value = '';
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
    
    if (!revenueGoal || revenueGoal <= 0) { alert('Informe a meta!'); return false; }
    if (!salesGoal || salesGoal < 1) { alert('Informe a meta de vendas!'); return false; }
    
    try {
        const goalData = { month, year, revenue_goal: revenueGoal, sales_goal: salesGoal };
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
    const searchInput = document.getElementById('saleClientSearch');
    if (searchInput) {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function limparFormularioVenda() {
    const form = document.getElementById('saleForm');
    if (form) form.reset();
    
    // Data atual automática
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const dateInput = document.getElementById('saleDate');
    if (dateInput) dateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    const qtyInput = document.getElementById('saleQuantity');
    if (qtyInput) qtyInput.value = '1';
    
    const discInput = document.getElementById('saleDiscount');
    if (discInput) discInput.value = '0,00';
    
    const discTypePercent = document.querySelector('input[name="discountType"][value="percent"]');
    if (discTypePercent) discTypePercent.checked = true;
    
    const discSymbol = document.getElementById('discountSymbol');
    if (discSymbol) discSymbol.textContent = '%';
    
    const discDisplay = document.getElementById('discountValueDisplay');
    if (discDisplay) discDisplay.style.display = 'none';
    
    const prodInfo = document.getElementById('productInfo');
    if (prodInfo) prodInfo.style.display = 'none';
    
    const saleResumo = document.getElementById('saleResumo');
    if (saleResumo) saleResumo.style.display = 'none';
    
    const clientSearch = document.getElementById('saleClientSearch');
    if (clientSearch) clientSearch.value = '';
    
    const prodSearch = document.getElementById('saleProductSearch');
    if (prodSearch) prodSearch.value = '';
    
    const clientHidden = document.getElementById('saleClient');
    if (clientHidden) clientHidden.value = '';
    
    const prodHidden = document.getElementById('saleProduct');
    if (prodHidden) prodHidden.value = '';
    
    const unitVal = document.getElementById('saleUnitValue');
    if (unitVal) unitVal.value = '';
    
    const paymentMethod = document.getElementById('salePaymentMethod');
    if (paymentMethod) paymentMethod.value = '';
    
    const clientesLista = document.getElementById('clientesLista');
    const produtosLista = document.getElementById('produtosLista');
    if (clientesLista) clientesLista.style.display = 'none';
    if (produtosLista) produtosLista.style.display = 'none';
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('show');
}

function getDateRange(period) {
    const now = new Date();
    let start, end;
    
    switch(period) {
        case 'today':
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;
        case '7days':
            start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            end = now;
            break;
        case '30days':
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            end = now;
            break;
        case 'month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = now;
            break;
        default:
            start = new Date(2000, 0, 1);
            end = now;
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
window.loadSales = loadSales;
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
window.aplicarFiltroPersonalizado = aplicarFiltroPersonalizado;
window.limparFormularioVenda = limparFormularioVenda;
window.adicionarItemSacola = adicionarItemSacola;
window.removerItemSacola = removerItemSacola;

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('salesTableBody')) {
        setTimeout(() => {
            loadSales();
        }, 300);
    }
});

console.log('✅ Módulo de Vendas carregado!');