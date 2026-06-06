// js/sales.js - Módulo de Vendas Simplificado
console.log('📦 Carregando sales.js...');

// Função principal que é chamada pelo menu
function loadSales() {
    console.log('🛒 loadSales() chamada!');
    
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) {
        console.error('❌ contentArea não encontrado');
        return;
    }
    
    document.getElementById('pageTitle').textContent = 'Vendas';
    
    // HTML básico do módulo
    contentArea.innerHTML = `
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
        </div>
        
        <div class="filters-bar">
            <button class="filter-btn active" data-period="today">Hoje</button>
            <button class="filter-btn" data-period="7days">7 Dias</button>
            <button class="filter-btn" data-period="30days">30 Dias</button>
            <button class="filter-btn" data-period="month">Este Mês</button>
            <button class="filter-btn" data-period="all">Todos</button>
        </div>
        
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
                            <th>Valor Total</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="salesTableBody">
                        <tr>
                            <td colspan="7" style="text-align: center; padding: 40px;">
                                <i class="fas fa-spinner fa-spin"></i> Carregando...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Modal de Venda -->
        <div id="saleModal" class="modal">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3><i class="fas fa-shopping-cart"></i> Nova Venda</h3>
                    <button class="modal-close" onclick="closeModal('saleModal')">&times;</button>
                </div>
                
                <form id="saleForm" onsubmit="return salvarVenda(event)">
                    <div class="form-group">
                        <label>Cliente *</label>
                        <select id="saleClient" required>
                            <option value="">Selecione um cliente...</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Produto *</label>
                        <select id="saleProduct" required onchange="onProductChange()">
                            <option value="">Selecione um produto...</option>
                        </select>
                        <div id="productInfo" style="display:none; margin-top:8px; padding:8px; background:#f0fff4; border-radius:6px;">
                            <span id="infoCode" style="font-weight:600;"></span> - 
                            <span id="infoPrice" style="color:#38a169; font-weight:600;"></span>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="form-group">
                            <label>Quantidade *</label>
                            <input type="number" id="saleQuantity" required min="1" value="1" onchange="calcularTotal()" oninput="calcularTotal()">
                        </div>
                        <div class="form-group">
                            <label>Valor Unitário *</label>
                            <input type="text" id="saleUnitValue" required placeholder="0,00" readonly style="background:#f7fafc;">
                        </div>
                    </div>
                    
                    <div id="saleTotal" style="display:none; background:#f0fff4; padding:20px; border-radius:8px; text-align:center; margin-bottom:20px; border:2px solid #38a169;">
                        <div style="font-size:14px; color:#718096;">VALOR TOTAL</div>
                        <div id="totalValue" style="font-size:32px; font-weight:700; color:#38a169;">R$ 0,00</div>
                    </div>
                    
                    <div class="form-group">
                        <label>Data da Venda *</label>
                        <input type="datetime-local" id="saleDate" required>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeModal('saleModal')">Cancelar</button>
                        <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Registrar Venda</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Configurar data atual
    document.getElementById('saleDate').value = new Date().toISOString().slice(0, 16);
    
    // Carregar dados
    carregarClientesSelect();
    carregarProdutosSelect();
    carregarVendas();
    
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
    
    console.log('✅ Módulo de vendas carregado!');
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function carregarClientesSelect() {
    try {
        const { data, error } = await supabaseClient
            .from('clients')
            .select('id, name, phone')
            .order('name');
        
        if (error) throw error;
        
        const select = document.getElementById('saleClient');
        select.innerHTML = '<option value="">Selecione um cliente...</option>' +
            (data || []).map(c => `<option value="${c.id}">${c.name} - ${c.phone || 'Sem telefone'}</option>`).join('');
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

async function carregarProdutosSelect() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('id, code, description, sale_value')
            .eq('active', true)
            .order('description');
        
        if (error) throw error;
        
        const select = document.getElementById('saleProduct');
        const produtos = data || [];
        
        if (produtos.length === 0) {
            select.innerHTML = '<option value="">Nenhum produto cadastrado</option>';
        } else {
            select.innerHTML = '<option value="">Selecione um produto...</option>' +
                produtos.map(p => 
                    `<option value="${p.id}" data-price="${p.sale_value}" data-code="${p.code}">
                        ${p.code} - ${p.description} - R$ ${parseFloat(p.sale_value).toFixed(2)}
                    </option>`
                ).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

function onProductChange() {
    const select = document.getElementById('saleProduct');
    const option = select.options[select.selectedIndex];
    const productInfo = document.getElementById('productInfo');
    const unitValue = document.getElementById('saleUnitValue');
    
    if (select.value && option) {
        const price = option.dataset.price;
        document.getElementById('infoCode').textContent = option.dataset.code;
        document.getElementById('infoPrice').textContent = 'R$ ' + parseFloat(price).toFixed(2);
        productInfo.style.display = 'block';
        unitValue.value = parseFloat(price).toFixed(2).replace('.', ',');
        calcularTotal();
    } else {
        productInfo.style.display = 'none';
        unitValue.value = '';
        document.getElementById('saleTotal').style.display = 'none';
    }
}

function calcularTotal() {
    const qtd = parseInt(document.getElementById('saleQuantity').value) || 0;
    const valor = parseFloat((document.getElementById('saleUnitValue').value || '').replace(',', '.')) || 0;
    const totalDiv = document.getElementById('saleTotal');
    
    if (qtd > 0 && valor > 0) {
        const total = qtd * valor;
        totalDiv.style.display = 'block';
        document.getElementById('totalValue').textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
    } else {
        totalDiv.style.display = 'none';
    }
}

async function salvarVenda(e) {
    e.preventDefault();
    
    const clientId = document.getElementById('saleClient').value;
    const productId = document.getElementById('saleProduct').value;
    const quantity = parseInt(document.getElementById('saleQuantity').value);
    const unitValue = parseFloat((document.getElementById('saleUnitValue').value || '').replace(',', '.'));
    const saleDate = document.getElementById('saleDate').value;
    
    if (!clientId) { alert('Selecione um cliente!'); return false; }
    if (!productId) { alert('Selecione um produto!'); return false; }
    if (!quantity || quantity < 1) { alert('Quantidade inválida!'); return false; }
    if (!unitValue || unitValue <= 0) { alert('Valor inválido!'); return false; }
    
    const totalValue = quantity * unitValue;
    
    try {
        const { error } = await supabaseClient
            .from('sales')
            .insert({
                client_id: clientId,
                product_id: productId,
                value: unitValue,
                quantity: quantity,
                total_value: totalValue,
                sale_date: saleDate,
                created_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        alert('✅ Venda registrada com sucesso!');
        closeModal('saleModal');
        carregarVendas();
        
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao registrar venda: ' + error.message);
    }
    
    return false;
}

async function carregarVendas(searchTerm = '') {
    const tbody = document.getElementById('salesTableBody');
    
    try {
        const activePeriod = document.querySelector('.filter-btn.active')?.dataset?.period || 'today';
        
        let query = supabaseClient
            .from('sales')
            .select(`
                *,
                client:client_id (name),
                product:product_id (code, description)
            `)
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
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px;">
                <i class="fas fa-shopping-cart" style="font-size:48px; color:#cbd5e0;"></i>
                <p style="color:#718096; margin-top:15px;">Nenhuma venda encontrada</p>
            </td></tr>`;
            
            document.getElementById('totalFaturamento').textContent = 'R$ 0,00';
            document.getElementById('totalVendas').textContent = '0';
            document.getElementById('ticketMedio').textContent = 'R$ 0,00';
            return;
        }
        
        tbody.innerHTML = vendas.map(v => `
            <tr>
                <td>${new Date(v.sale_date || v.created_at).toLocaleDateString('pt-BR')}</td>
                <td><strong>${v.client?.name || 'N/A'}</strong></td>
                <td>${v.product?.code || ''} - ${v.product?.description || 'N/A'}</td>
                <td style="text-align:center;">${v.quantity}x</td>
                <td>R$ ${parseFloat(v.value).toFixed(2)}</td>
                <td><strong>R$ ${parseFloat(v.total_value).toFixed(2)}</strong></td>
                <td>
                    <button class="btn-danger btn-sm" onclick="excluirVenda('${v.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Atualizar cards
        const totalFaturamento = vendas.reduce((sum, v) => sum + parseFloat(v.total_value || 0), 0);
        document.getElementById('totalFaturamento').textContent = 'R$ ' + totalFaturamento.toFixed(2);
        document.getElementById('totalVendas').textContent = vendas.length;
        document.getElementById('ticketMedio').textContent = 'R$ ' + (vendas.length > 0 ? (totalFaturamento / vendas.length).toFixed(2) : '0,00');
        
    } catch (error) {
        console.error('Erro ao carregar vendas:', error);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Erro ao carregar vendas</td></tr>`;
    }
}

async function excluirVenda(id) {
    if (!confirm('Excluir esta venda?')) return;
    
    try {
        const { error } = await supabaseClient.from('sales').delete().eq('id', id);
        if (error) throw error;
        carregarVendas();
    } catch (error) {
        alert('Erro ao excluir: ' + error.message);
    }
}

function showSaleModal() {
    document.getElementById('saleModal').classList.add('show');
    document.getElementById('saleDate').value = new Date().toISOString().slice(0, 16);
    document.getElementById('productInfo').style.display = 'none';
    document.getElementById('saleTotal').style.display = 'none';
    document.getElementById('saleForm').reset();
    document.getElementById('saleQuantity').value = '1';
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('show');
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

// Fechar modal ao clicar fora
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

// Log final
console.log('✅ loadSales disponível:', typeof loadSales);
console.log('✅ showSaleModal disponível:', typeof showSaleModal);