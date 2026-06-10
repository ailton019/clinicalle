/**
 * Dashboard - Clínica Estética ERP
 * Versão: 3.0 - Definitiva (com limpeza completa de gráficos)
 */

console.log('📦 Carregando dashboard...');

// Variáveis globais do dashboard
let charts = {
    revenue: null,
    expenses: null,
    profit: null,
    comparison: null
};
let currentPeriod = 'month';
let refreshInterval = null;

/**
 * Carrega a página de dashboard
 */
async function loadDashboard() {
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.textContent = 'Dashboard';
    
    contentArea.innerHTML = `
        <div class="dashboard-container">
            <!-- Cards de Estatísticas Principais -->
            <div class="stats-grid">
                <div class="stat-card primary">
                    <div class="stat-icon"><i class="fas fa-dollar-sign"></i></div>
                    <div class="stat-value" id="totalRevenue">R$ 0,00</div>
                    <div class="stat-label">Faturamento Bruto</div>
                    <div class="stat-change" id="revenueChange"></div>
                </div>
                
                <div class="stat-card danger">
                    <div class="stat-icon"><i class="fas fa-arrow-down"></i></div>
                    <div class="stat-value" id="totalExpenses">R$ 0,00</div>
                    <div class="stat-label">Total de Despesas</div>
                    <div class="stat-change" id="expensesChange"></div>
                </div>
                
                <div class="stat-card success">
                    <div class="stat-icon"><i class="fas fa-chart-bar"></i></div>
                    <div class="stat-value" id="netProfit">R$ 0,00</div>
                    <div class="stat-label">Lucro Líquido</div>
                    <div class="stat-change" id="profitChange"></div>
                </div>
                
                <div class="stat-card warning">
                    <div class="stat-icon"><i class="fas fa-bullseye"></i></div>
                    <div class="stat-value" id="dashMeta">R$ 0,00</div>
                    <div class="stat-label">Meta do Mês</div>
                    <div id="dashMetaProgress" style="margin-top: 8px;"></div>
                </div>
                
                <div class="stat-card info">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div class="stat-value" id="totalClients">0</div>
                    <div class="stat-label">Clientes Ativos</div>
                    <div class="stat-change" id="clientsChange"></div>
                </div>
                
                <div class="stat-card purple">
                    <div class="stat-icon"><i class="fas fa-box"></i></div>
                    <div class="stat-value" id="totalProducts">0</div>
                    <div class="stat-label">Produtos em Estoque</div>
                    <div class="stat-change" id="productsChange"></div>
                </div>
            </div>
            
            <!-- Filtros de Período -->
            <div class="filters-bar">
                <button class="filter-btn ${currentPeriod === 'today' ? 'active' : ''}" data-period="today">
                    <i class="fas fa-calendar-day"></i> Hoje
                </button>
                <button class="filter-btn ${currentPeriod === '7days' ? 'active' : ''}" data-period="7days">
                    <i class="fas fa-calendar-week"></i> Últimos 7 dias
                </button>
                <button class="filter-btn ${currentPeriod === '30days' ? 'active' : ''}" data-period="30days">
                    <i class="fas fa-calendar-alt"></i> Últimos 30 dias
                </button>
                <button class="filter-btn ${currentPeriod === 'month' ? 'active' : ''}" data-period="month">
                    <i class="fas fa-calendar-month"></i> Mês Atual
                </button>
                <button class="filter-btn ${currentPeriod === 'year' ? 'active' : ''}" data-period="year">
                    <i class="fas fa-calendar-year"></i> Ano Atual
                </button>
            </div>
            
            <!-- Gráficos -->
            <div class="charts-grid">
                <div class="chart-container">
                    <div class="chart-header">
                        <h3><i class="fas fa-chart-line"></i> Receitas por Mês</h3>
                        <button class="chart-action" onclick="exportChart('revenue')">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                    <canvas id="revenueChart"></canvas>
                </div>
                
                <div class="chart-container">
                    <div class="chart-header">
                        <h3><i class="fas fa-chart-line"></i> Despesas por Mês</h3>
                        <button class="chart-action" onclick="exportChart('expenses')">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                    <canvas id="expensesChart"></canvas>
                </div>
                
                <div class="chart-container">
                    <div class="chart-header">
                        <h3><i class="fas fa-chart-line"></i> Lucro por Mês</h3>
                        <button class="chart-action" onclick="exportChart('profit')">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                    <canvas id="profitChart"></canvas>
                </div>
                
                <div class="chart-container">
                    <div class="chart-header">
                        <h3><i class="fas fa-chart-bar"></i> Comparativo Receita x Despesa</h3>
                        <button class="chart-action" onclick="exportChart('comparison')">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                    <canvas id="comparisonChart"></canvas>
                </div>
            </div>
            
            <!-- Cards de Indicadores Adicionais -->
            <div class="indicators-grid">
                <div class="indicator-card">
                    <div class="indicator-icon"><i class="fas fa-chart-pie"></i></div>
                    <div class="indicator-info">
                        <div class="indicator-label">Margem de Lucro</div>
                        <div class="indicator-value" id="profitMargin">0%</div>
                    </div>
                </div>
                
                <div class="indicator-card">
                    <div class="indicator-icon"><i class="fas fa-percent"></i></div>
                    <div class="indicator-info">
                        <div class="indicator-label">Percentual de Despesas</div>
                        <div class="indicator-value" id="expensePercentage">0%</div>
                    </div>
                </div>
                
                <div class="indicator-card">
                    <div class="indicator-icon"><i class="fas fa-ticket-alt"></i></div>
                    <div class="indicator-info">
                        <div class="indicator-label">Ticket Médio</div>
                        <div class="indicator-value" id="averageTicket">R$ 0,00</div>
                    </div>
                </div>
                
                <div class="indicator-card">
                    <div class="indicator-icon"><i class="fas fa-hand-holding-usd"></i></div>
                    <div class="indicator-info">
                        <div class="indicator-label">Lucro por Cliente</div>
                        <div class="indicator-value" id="profitPerClient">R$ 0,00</div>
                    </div>
                </div>
            </div>
            
            <!-- Últimas Vendas -->
            <div class="recent-activities">
                <div class="section-header">
                    <h3><i class="fas fa-clock"></i> Últimas Vendas</h3>
                    <a href="#" onclick="navigateTo('sales'); return false;" class="view-all">
                        Ver todas <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
                <div class="activities-list" id="recentSales">
                    <div class="loading-spinner-small">
                        <i class="fas fa-spinner fa-pulse"></i> Carregando...
                    </div>
                </div>
            </div>
        </div>
    `;
    
    addDashboardStyles();
    
    // Aguardar DOM
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await updateDashboard(currentPeriod);
    
    // Eventos dos filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            currentPeriod = e.currentTarget.dataset.period;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            await updateDashboard(currentPeriod);
        });
    });
    
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => updateDashboard(currentPeriod), 30000);
}

function addDashboardStyles() {
    if (document.getElementById('dashboardStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'dashboardStyles';
    style.textContent = `
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; border-radius: 16px; padding: 20px; position: relative; transition: all 0.3s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .stat-card .stat-icon { position: absolute; right: 20px; top: 20px; font-size: 32px; opacity: 0.2; }
        .stat-card .stat-value { font-size: 28px; font-weight: 700; margin: 10px 0 5px; }
        .stat-card .stat-label { font-size: 14px; color: #718096; }
        .stat-card .stat-change { font-size: 12px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0; }
        .stat-card.primary .stat-value { color: #3182ce; }
        .stat-card.danger .stat-value { color: #e53e3e; }
        .stat-card.success .stat-value { color: #38a169; }
        .stat-card.warning .stat-value { color: #d69e2e; }
        .stat-card.info .stat-value { color: #805ad5; }
        .stat-card.purple .stat-value { color: #9f7aea; }
        .filters-bar { display: flex; gap: 10px; margin-bottom: 30px; flex-wrap: wrap; background: white; padding: 15px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .filter-btn { padding: 8px 16px; border: 1px solid #e2e8f0; background: white; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; font-size: 14px; }
        .filter-btn:hover { border-color: #3182ce; background: #ebf8ff; }
        .filter-btn.active { background: #3182ce; border-color: #3182ce; color: white; }
        .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .chart-container { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .chart-header h3 { font-size: 16px; font-weight: 600; margin: 0; }
        .chart-action { background: none; border: none; cursor: pointer; color: #718096; padding: 5px; border-radius: 4px; }
        .chart-action:hover { background: #f7fafc; color: #3182ce; }
        .indicators-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .indicator-card { background: white; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .indicator-icon { width: 50px; height: 50px; background: #ebf8ff; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #3182ce; }
        .indicator-info { flex: 1; }
        .indicator-label { font-size: 12px; color: #718096; margin-bottom: 5px; }
        .indicator-value { font-size: 20px; font-weight: 700; }
        .recent-activities { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .section-header h3 { font-size: 16px; font-weight: 600; margin: 0; }
        .view-all { font-size: 13px; color: #3182ce; text-decoration: none; }
        .activities-list { max-height: 400px; overflow-y: auto; }
        .activity-item { display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid #e2e8f0; }
        .activity-item:hover { background: #f7fafc; }
        .activity-info { flex: 1; }
        .activity-title { font-weight: 500; margin-bottom: 4px; }
        .activity-date { font-size: 12px; color: #718096; }
        .activity-value { font-weight: 600; color: #38a169; }
        .loading-spinner-small { text-align: center; padding: 20px; color: #718096; }
        
        body.dark-mode .stat-card, body.dark-mode .filters-bar, body.dark-mode .chart-container,
        body.dark-mode .indicator-card, body.dark-mode .recent-activities { background: #1f2937; }
        body.dark-mode .stat-card .stat-label, body.dark-mode .indicator-label { color: #9ca3af; }
        body.dark-mode .filter-btn { background: #374151; border-color: #4b5563; color: #f9fafb; }
        body.dark-mode .filter-btn:hover { background: #4b5563; }
        body.dark-mode .activity-item:hover { background: #374151; }
        
        @media (max-width: 768px) {
            .charts-grid { grid-template-columns: 1fr; }
            .stats-grid { grid-template-columns: 1fr; }
            .indicators-grid { grid-template-columns: 1fr; }
        }
    `;
    document.head.appendChild(style);
}

/**
 * LIMPEZA COMPLETA DOS GRÁFICOS
 */
function destroyAllCharts() {
    const canvasIds = ['revenueChart', 'expensesChart', 'profitChart', 'comparisonChart'];
    
    // Destruir via objeto charts
    Object.keys(charts).forEach(chartKey => {
        if (charts[chartKey]) {
            try {
                if (typeof charts[chartKey].destroy === 'function') {
                    charts[chartKey].destroy();
                }
                if (typeof charts[chartKey].clear === 'function') {
                    charts[chartKey].clear();
                }
            } catch (e) {
                console.warn(`Erro ao destruir ${chartKey}:`, e);
            }
            charts[chartKey] = null;
        }
    });
    
    // Limpar e recriar os canvases
    canvasIds.forEach(canvasId => {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            // Substituir o canvas por um novo para garantir limpeza total
            const parent = canvas.parentNode;
            const newCanvas = document.createElement('canvas');
            newCanvas.id = canvasId;
            newCanvas.width = canvas.width;
            newCanvas.height = canvas.height;
            parent.replaceChild(newCanvas, canvas);
        }
    });
    
    charts = { revenue: null, expenses: null, profit: null, comparison: null };
    console.log('📊 Todos os gráficos foram destruídos e canvases recriados');
}

async function updateDashboard(period) {
    console.log('📊 Atualizando dashboard - período:', period);
    
    try {
        const { startDate, endDate } = getDateRange(period);
        
        const [vendas, despesas, clientes, produtos, vendasAnterior] = await Promise.all([
            fetchSales(startDate, endDate),
            fetchExpenses(startDate, endDate),
            fetchTotalClients(),
            fetchTotalProducts(),
            fetchPreviousPeriodSales(startDate, endDate)
        ]);
        
        const totalRevenue = calculateTotalRevenue(vendas);
        const totalExpenses = calculateTotalExpenses(despesas);
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const expensePercentage = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
        const averageTicket = vendas.length > 0 ? totalRevenue / vendas.length : 0;
        const profitPerClient = clientes > 0 ? netProfit / clientes : 0;
        
        const revenueChange = calculateChange(totalRevenue, vendasAnterior.revenue);
        const expensesChange = calculateChange(totalExpenses, vendasAnterior.expenses);
        const profitChange = calculateChange(netProfit, vendasAnterior.profit);
        
        console.log('📈 Totais:', { receita: totalRevenue, despesas: totalExpenses, lucro: netProfit });
        
        updateStatCard('totalRevenue', totalRevenue, revenueChange);
        updateStatCard('totalExpenses', totalExpenses, expensesChange);
        updateStatCard('netProfit', netProfit, profitChange);
        
        const totalClientsEl = document.getElementById('totalClients');
        if (totalClientsEl) totalClientsEl.textContent = clientes || 0;
        
        const totalProductsEl = document.getElementById('totalProducts');
        if (totalProductsEl) totalProductsEl.textContent = produtos || 0;
        
        const netProfitElement = document.getElementById('netProfit');
        if (netProfitElement) netProfitElement.style.color = netProfit >= 0 ? '#38a169' : '#e53e3e';
        
        const profitMarginEl = document.getElementById('profitMargin');
        if (profitMarginEl) profitMarginEl.textContent = profitMargin.toFixed(2) + '%';
        
        const expensePercentageEl = document.getElementById('expensePercentage');
        if (expensePercentageEl) expensePercentageEl.textContent = expensePercentage.toFixed(2) + '%';
        
        const averageTicketEl = document.getElementById('averageTicket');
        if (averageTicketEl) averageTicketEl.textContent = formatCurrency(averageTicket);
        
        const profitPerClientEl = document.getElementById('profitPerClient');
        if (profitPerClientEl) profitPerClientEl.textContent = formatCurrency(profitPerClient);
        
        await loadMonthlyGoal();
        
        // LIMPEZA COMPLETA antes de recriar
        destroyAllCharts();
        
        // Aguardar para garantir que os canvases foram recriados
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await updateCharts(period);
        await loadRecentSales();
        
    } catch (error) {
        console.error('❌ Erro:', error);
        if (window.showToast) window.showToast('Erro ao carregar dados', 'error');
    }
}

async function fetchSales(startDate, endDate) {
    try {
        const { data, error } = await supabaseClient
            .from('sales')
            .select('*')
            .gte('sale_date', startDate.split('T')[0])
            .lte('sale_date', endDate.split('T')[0]);
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro vendas:', error);
        return [];
    }
}

async function fetchExpenses(startDate, endDate) {
    try {
        const { data, error } = await supabaseClient
            .from('expenses')
            .select('*')
            .gte('date', startDate.split('T')[0])
            .lte('date', endDate.split('T')[0]);
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro despesas:', error);
        return [];
    }
}

async function fetchTotalClients() {
    try {
        const { count, error } = await supabaseClient.from('clients').select('*', { count: 'exact', head: true });
        if (error) throw error;
        return count || 0;
    } catch (error) {
        return 0;
    }
}

async function fetchTotalProducts() {
    try {
        const { count, error } = await supabaseClient.from('products').select('*', { count: 'exact', head: true }).eq('active', true);
        if (error) throw error;
        return count || 0;
    } catch (error) {
        return 0;
    }
}

async function fetchPreviousPeriodSales(currentStart, currentEnd) {
    try {
        const currentStartDate = new Date(currentStart);
        const currentEndDate = new Date(currentEnd);
        const duration = currentEndDate - currentStartDate;
        const previousStart = new Date(currentStartDate.getTime() - duration);
        const previousEnd = new Date(currentEndDate.getTime() - duration);
        
        const { data: sales } = await supabaseClient.from('sales').select('*')
            .gte('sale_date', previousStart.toISOString().split('T')[0])
            .lte('sale_date', previousEnd.toISOString().split('T')[0]);
        const { data: expenses } = await supabaseClient.from('expenses').select('*')
            .gte('date', previousStart.toISOString().split('T')[0])
            .lte('date', previousEnd.toISOString().split('T')[0]);
        
        return {
            revenue: calculateTotalRevenue(sales || []),
            expenses: calculateTotalExpenses(expenses || []),
            profit: calculateTotalRevenue(sales || []) - calculateTotalExpenses(expenses || [])
        };
    } catch (error) {
        return { revenue: 0, expenses: 0, profit: 0 };
    }
}

function calculateTotalRevenue(sales) {
    if (!sales || sales.length === 0) return 0;
    return sales.reduce((sum, sale) => sum + (parseFloat(sale.total_value) || 0), 0);
}

function calculateTotalExpenses(expenses) {
    if (!expenses || expenses.length === 0) return 0;
    return expenses.reduce((sum, expense) => sum + Math.abs(parseFloat(expense.value) || 0), 0);
}

function calculateChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}

function updateStatCard(elementId, value, change) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.textContent = formatCurrency(value);
    
    const changeId = elementId.replace('total', '').toLowerCase() + 'Change';
    const changeElement = document.getElementById(changeId);
    if (changeElement) {
        const changeAbs = Math.abs(change).toFixed(1);
        const changeIcon = change >= 0 ? '<i class="fas fa-arrow-up"></i>' : '<i class="fas fa-arrow-down"></i>';
        const changeColor = change >= 0 ? '#38a169' : '#e53e3e';
        changeElement.innerHTML = `<span style="color: ${changeColor}">${changeIcon} ${changeAbs}%</span> vs período anterior`;
    }
}

async function loadMonthlyGoal() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    try {
        const { data: goal } = await supabaseClient.from('monthly_goals').select('*').eq('month', month).eq('year', year).single();
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date().toISOString().split('T')[0];
        const { data: vendasMes } = await supabaseClient.from('sales').select('*').gte('sale_date', startDate).lte('sale_date', endDate);
        const faturamentoAtual = calculateTotalRevenue(vendasMes || []);
        
        const metaElement = document.getElementById('dashMeta');
        const progressElement = document.getElementById('dashMetaProgress');
        
        if (metaElement && progressElement) {
            if (goal && goal.revenue_goal > 0) {
                const percentual = (faturamentoAtual / goal.revenue_goal) * 100;
                metaElement.textContent = formatCurrency(goal.revenue_goal);
                progressElement.innerHTML = `
                    <div style="font-size: 11px; margin-bottom: 4px;">Alcançado: ${formatCurrency(faturamentoAtual)}</div>
                    <div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: ${percentual >= 100 ? '#38a169' : percentual >= 50 ? '#d69e2e' : '#e53e3e'}; 
                             height: 100%; width: ${Math.min(percentual, 100)}%; border-radius: 4px;"></div>
                    </div>
                    <div style="text-align: center; font-size: 13px; margin-top: 5px; font-weight: 600;">${percentual.toFixed(1)}% da meta</div>
                `;
            } else {
                metaElement.textContent = formatCurrency(0);
                progressElement.innerHTML = `<span style="color:#3182ce;cursor:pointer;" onclick="showGoalModal?.()">📌 Clique para definir meta</span>`;
            }
        }
    } catch (error) {
        console.error('Erro meta:', error);
    }
}

async function updateCharts(period) {
    const { startDate, endDate } = getDateRange(period);
    
    const [allSales, allExpenses] = await Promise.all([
        supabaseClient.from('sales').select('*').gte('sale_date', startDate.split('T')[0]).lte('sale_date', endDate.split('T')[0]),
        supabaseClient.from('expenses').select('*').gte('date', startDate.split('T')[0]).lte('date', endDate.split('T')[0])
    ]);
    
    const vendas = allSales.data || [];
    const despesas = allExpenses.data || [];
    
    const months = getMonthsInRange(startDate, endDate);
    const monthlyData = months.map(month => ({
        month: formatMonth(month),
        revenue: calculateTotalRevenue(vendas.filter(s => (s.sale_date || s.created_at).startsWith(month))),
        expenses: calculateTotalExpenses(despesas.filter(e => (e.date || e.created_at).startsWith(month))),
        profit: 0
    }));
    
    monthlyData.forEach(d => d.profit = d.revenue - d.expenses);
    
    const labels = monthlyData.map(d => d.month);
    const revenueData = monthlyData.map(d => d.revenue);
    const expensesData = monthlyData.map(d => d.expenses);
    const profitData = monthlyData.map(d => d.profit);
    
    // Criar novos gráficos com os canvases já limpos
    try {
        const revenueCanvas = document.getElementById('revenueChart');
        if (revenueCanvas && revenueData.length > 0) {
            charts.revenue = new Chart(revenueCanvas.getContext('2d'), {
                type: 'bar',
                data: { labels, datasets: [{ label: 'Receitas', data: revenueData, backgroundColor: 'rgba(56, 161, 105, 0.7)', borderColor: '#38a169', borderWidth: 1, borderRadius: 8 }] },
                options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.raw) } } }, scales: { y: { beginAtZero: true, ticks: { callback: v => formatCurrency(v) } } } }
            });
        }
        
        const expensesCanvas = document.getElementById('expensesChart');
        if (expensesCanvas && expensesData.length > 0) {
            charts.expenses = new Chart(expensesCanvas.getContext('2d'), {
                type: 'bar',
                data: { labels, datasets: [{ label: 'Despesas', data: expensesData, backgroundColor: 'rgba(229, 62, 62, 0.7)', borderColor: '#e53e3e', borderWidth: 1, borderRadius: 8 }] },
                options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.raw) } } }, scales: { y: { beginAtZero: true, ticks: { callback: v => formatCurrency(v) } } } }
            });
        }
        
        const profitCanvas = document.getElementById('profitChart');
        if (profitCanvas && profitData.length > 0) {
            charts.profit = new Chart(profitCanvas.getContext('2d'), {
                type: 'line',
                data: { labels, datasets: [{ label: 'Lucro', data: profitData, borderColor: '#3182ce', backgroundColor: 'rgba(49, 130, 206, 0.1)', tension: 0.4, fill: true, pointBackgroundColor: '#3182ce', pointBorderColor: 'white', pointRadius: 4, pointHoverRadius: 6 }] },
                options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.raw) } } }, scales: { y: { ticks: { callback: v => formatCurrency(v) } } } }
            });
        }
        
        const comparisonCanvas = document.getElementById('comparisonChart');
        if (comparisonCanvas && revenueData.length > 0 && expensesData.length > 0) {
            charts.comparison = new Chart(comparisonCanvas.getContext('2d'), {
                type: 'bar',
                data: { labels, datasets: [{ label: 'Receita', data: revenueData, backgroundColor: 'rgba(56, 161, 105, 0.7)', borderColor: '#38a169', borderWidth: 1, borderRadius: 8 }, { label: 'Despesa', data: expensesData, backgroundColor: 'rgba(229, 62, 62, 0.7)', borderColor: '#e53e3e', borderWidth: 1, borderRadius: 8 }] },
                options: { responsive: true, maintainAspectRatio: true, plugins: { tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.raw) } } }, scales: { y: { beginAtZero: true, ticks: { callback: v => formatCurrency(v) } } } }
            });
        }
        
        console.log('📊 Gráficos criados com sucesso!');
    } catch (error) {
        console.error('Erro ao criar gráficos:', error);
    }
}

async function loadRecentSales() {
    const container = document.getElementById('recentSales');
    if (!container) return;
    
    try {
        const { data: sales, error } = await supabaseClient.from('sales').select('*, clients (name)').order('sale_date', { ascending: false }).limit(5);
        if (error) throw error;
        
        if (!sales || sales.length === 0) {
            container.innerHTML = `<div class="activity-item"><div class="activity-info"><div class="activity-title">Nenhuma venda registrada</div></div></div>`;
            return;
        }
        
        container.innerHTML = sales.map(sale => `<div class="activity-item"><div class="activity-info"><div class="activity-title">${sale.clients?.name || 'Cliente'}</div><div class="activity-date">${formatDate(sale.sale_date)}</div></div><div class="activity-value">${formatCurrency(sale.total_value)}</div></div>`).join('');
    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = `<div class="activity-item"><div class="activity-info"><div class="activity-title">Erro ao carregar</div></div></div>`;
    }
}

async function exportChart(chartName) {
    const chart = charts[chartName];
    if (!chart?.canvas) return;
    try {
        const link = document.createElement('a');
        link.download = `dashboard_${chartName}_${new Date().toISOString().split('T')[0]}.png`;
        link.href = chart.canvas.toDataURL();
        link.click();
        if (window.showToast) window.showToast('Gráfico exportado!', 'success');
    } catch (error) {
        console.error('Erro exportar:', error);
    }
}

function getDateRange(period) {
    const now = new Date();
    let startDate, endDate;
    switch(period) {
        case 'today': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59); break;
        case '7days': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); endDate = now; break;
        case '30days': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); endDate = now; break;
        case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); endDate = now; break;
        case 'year': startDate = new Date(now.getFullYear(), 0, 1); endDate = now; break;
        default: startDate = new Date(now.getFullYear(), now.getMonth(), 1); endDate = now;
    }
    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
}

function getMonthsInRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = [];
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
        months.push(current.toISOString().substring(0, 7));
        current.setMonth(current.getMonth() + 1);
    }
    return months;
}

function formatMonth(monthStr) {
    const [year, month] = monthStr.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(month) - 1]}/${year}`;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

window.loadDashboard = loadDashboard;
window.updateDashboard = updateDashboard;
window.exportChart = exportChart;

console.log('✅ Dashboard carregado!');