// Dashboard e Gráficos
let charts = {};

async function loadDashboard() {
    const contentArea = document.getElementById('contentArea');
    document.getElementById('pageTitle').textContent = 'Dashboard';
    
    contentArea.innerHTML = `
        <!-- Cards de Indicadores -->
        <div class="stats-grid">
            <div class="stat-card primary">
                <div class="stat-icon"><i class="fas fa-dollar-sign"></i></div>
                <div class="stat-value" id="totalRevenue">R$ 0,00</div>
                <div class="stat-label">Faturamento Bruto</div>
            </div>
            
            <div class="stat-card danger">
                <div class="stat-icon"><i class="fas fa-arrow-down"></i></div>
                <div class="stat-value" id="totalExpenses">R$ 0,00</div>
                <div class="stat-label">Total de Despesas</div>
            </div>
            
            <div class="stat-card success">
                <div class="stat-icon"><i class="fas fa-chart-bar"></i></div>
                <div class="stat-value" id="netProfit">R$ 0,00</div>
                <div class="stat-label">Lucro Líquido</div>
            </div>
            
            <div class="stat-card warning">
                <div class="stat-icon"><i class="fas fa-users"></i></div>
                <div class="stat-value" id="totalClients">0</div>
                <div class="stat-label">Clientes</div>
            </div>
            
            <div class="stat-card info">
                <div class="stat-icon"><i class="fas fa-box"></i></div>
                <div class="stat-value" id="totalProducts">0</div>
                <div class="stat-label">Produtos</div>
            </div>
        </div>
        
        <!-- Filtros -->
        <div class="filters-bar">
            <button class="filter-btn active" data-period="today">Hoje</button>
            <button class="filter-btn" data-period="7days">Últimos 7 dias</button>
            <button class="filter-btn" data-period="30days">Últimos 30 dias</button>
            <button class="filter-btn" data-period="month">Mês Atual</button>
            <button class="filter-btn" data-period="year">Ano Atual</button>
        </div>
        
        <!-- Gráficos -->
        <div class="charts-grid">
            <div class="chart-container">
                <h3>Receitas por Mês</h3>
                <canvas id="revenueChart"></canvas>
            </div>
            
            <div class="chart-container">
                <h3>Despesas por Mês</h3>
                <canvas id="expensesChart"></canvas>
            </div>
            
            <div class="chart-container">
                <h3>Lucro por Mês</h3>
                <canvas id="profitChart"></canvas>
            </div>
            
            <div class="chart-container">
                <h3>Comparativo Receita x Despesa</h3>
                <canvas id="comparisonChart"></canvas>
            </div>
        </div>
        
        <!-- Indicadores Financeiros -->
        <div class="stats-grid" style="margin-top: 30px;">
            <div class="stat-card">
                <div class="stat-label">Margem de Lucro</div>
                <div class="stat-value" id="profitMargin">0%</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-label">Percentual de Despesas</div>
                <div class="stat-value" id="expensePercentage">0%</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-label">Ticket Médio</div>
                <div class="stat-value" id="averageTicket">R$ 0,00</div>
            </div>
        </div>
    `;
    
    // Carregar dados iniciais
    await updateDashboard('today');
    
    // Event listeners para filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            // Remover active de todos
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // Adicionar active no clicado
            e.target.classList.add('active');
            
            await updateDashboard(e.target.dataset.period);
        });
    });
}

async function updateDashboard(period) {
    try {
        // Calcular datas baseado no período
        const { startDate, endDate } = getDateRange(period);
        
        // Buscar dados
        const [revenues, expenses, clients, products] = await Promise.all([
            DB.filterByDateRange('sales', startDate, endDate),
            DB.filterByDateRange('expenses', startDate, endDate),
            DB.select('clients'),
            DB.select('products')
        ]);
        
        // Calcular totais
        const totalRevenue = revenues.reduce((sum, sale) => sum + (sale.value * sale.quantity), 0);
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.value, 0);
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const expensePercentage = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
        const averageTicket = revenues.length > 0 ? totalRevenue / revenues.length : 0;
        
        // Atualizar cards
        document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
        document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
        document.getElementById('netProfit').textContent = formatCurrency(netProfit);
        document.getElementById('totalClients').textContent = clients.length;
        document.getElementById('totalProducts').textContent = products.length;
        
        // Atualizar indicadores
        document.getElementById('profitMargin').textContent = profitMargin.toFixed(2) + '%';
        document.getElementById('expensePercentage').textContent = expensePercentage.toFixed(2) + '%';
        document.getElementById('averageTicket').textContent = formatCurrency(averageTicket);
        
        // Atualizar gráficos
        await updateCharts(period);
        
        // Colorir lucro líquido
        const netProfitElement = document.getElementById('netProfit');
        netProfitElement.style.color = netProfit >= 0 ? 'var(--success)' : 'var(--danger)';
        
    } catch (error) {
        console.error('Erro ao atualizar dashboard:', error);
    }
}

async function updateCharts(period) {
    // Destruir gráficos existentes
    Object.values(charts).forEach(chart => chart.destroy());
    charts = {};
    
    // Calcular datas
    const { startDate, endDate } = getDateRange(period);
    
    // Buscar dados mensais para o período
    const [allSales, allExpenses] = await Promise.all([
        DB.filterByDateRange('sales', startDate, endDate),
        DB.filterByDateRange('expenses', startDate, endDate)
    ]);
    
    // Agrupar por mês
    const months = getMonthsInRange(startDate, endDate);
    const monthlyData = months.map(month => {
        const monthSales = allSales.filter(s => s.sale_date?.startsWith(month));
        const monthExpenses = allExpenses.filter(e => e.date?.startsWith(month));
        
        return {
            month: formatMonth(month),
            revenue: monthSales.reduce((sum, s) => sum + (s.value * s.quantity), 0),
            expenses: monthExpenses.reduce((sum, e) => sum + e.value, 0),
            profit: monthSales.reduce((sum, s) => sum + (s.value * s.quantity), 0) - 
                    monthExpenses.reduce((sum, e) => sum + e.value, 0)
        };
    });
    
    const labels = monthlyData.map(d => d.month);
    
    // Gráfico de Receitas
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    charts.revenue = new Chart(revenueCtx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Receitas',
                data: monthlyData.map(d => d.revenue),
                backgroundColor: 'rgba(56, 161, 105, 0.7)',
                borderColor: '#38a169',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
    
    // Gráfico de Despesas
    const expensesCtx = document.getElementById('expensesChart').getContext('2d');
    charts.expenses = new Chart(expensesCtx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Despesas',
                data: monthlyData.map(d => d.expenses),
                backgroundColor: 'rgba(229, 62, 62, 0.7)',
                borderColor: '#e53e3e',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
    
    // Gráfico de Lucro
    const profitCtx = document.getElementById('profitChart').getContext('2d');
    charts.profit = new Chart(profitCtx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Lucro',
                data: monthlyData.map(d => d.profit),
                borderColor: '#3182ce',
                backgroundColor: 'rgba(49, 130, 206, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
    
    // Gráfico Comparativo
    const comparisonCtx = document.getElementById('comparisonChart').getContext('2d');
    charts.comparison = new Chart(comparisonCtx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Receita',
                    data: monthlyData.map(d => d.revenue),
                    backgroundColor: 'rgba(56, 161, 105, 0.7)',
                    borderColor: '#38a169',
                    borderWidth: 1
                },
                {
                    label: 'Despesa',
                    data: monthlyData.map(d => d.expenses),
                    backgroundColor: 'rgba(229, 62, 62, 0.7)',
                    borderColor: '#e53e3e',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true
        }
    });
}

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
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = now;
    }
    
    return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
    };
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
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                   'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(month) - 1]}/${year}`;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}