// js/dashboard.js - Dashboard com Metas
console.log('📦 Carregando dashboard...');

let charts = {};

// ============================================
// CARREGAR DASHBOARD
// ============================================
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
                <div class="stat-icon"><i class="fas fa-bullseye"></i></div>
                <div class="stat-value" id="dashMeta">R$ 0,00</div>
                <div class="stat-label">Meta do Mês</div>
                <div id="dashMetaProgress" style="margin-top: 8px; font-size: 12px; color: #718096;"></div>
            </div>
            
            <div class="stat-card info">
                <div class="stat-icon"><i class="fas fa-users"></i></div>
                <div class="stat-value" id="totalClients">0</div>
                <div class="stat-label">Clientes</div>
            </div>
            
            <div class="stat-card" style="border-left: 4px solid #805ad5;">
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
    await updateDashboard('month');
    
    // Event listeners para filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            await updateDashboard(e.target.dataset.period);
        });
    });
}

// ============================================
// ATUALIZAR DASHBOARD
// ============================================
async function updateDashboard(period) {
    console.log('📊 Atualizando dashboard - período:', period);
    
    try {
        const { startDate, endDate } = getDateRange(period);
        
        // Buscar vendas no período
        const { data: vendas, error: errorVendas } = await supabaseClient
            .from('sales')
            .select('*')
            .gte('sale_date', startDate.split('T')[0])
            .lte('sale_date', endDate.split('T')[0]);
        
        if (errorVendas) throw errorVendas;
        
        // Buscar despesas no período
        const { data: despesas, error: errorDespesas } = await supabaseClient
            .from('expenses')
            .select('*')
            .gte('date', startDate.split('T')[0])
            .lte('date', endDate.split('T')[0]);
        
        if (errorDespesas) throw errorDespesas;
        
        // Buscar total de clientes
        const { count: totalClientes, error: errorClientes } = await supabaseClient
            .from('clients')
            .select('*', { count: 'exact', head: true });
        
        if (errorClientes) throw errorClientes;
        
        // Buscar total de produtos ativos
        const { count: totalProdutos, error: errorProdutos } = await supabaseClient
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('active', true);
        
        if (errorProdutos) throw errorProdutos;
        
        // Calcular totais
        const totalRevenue = (vendas || []).reduce((sum, v) => {
            return sum + (parseFloat(v.total_value) || (parseFloat(v.value) * parseInt(v.quantity)));
        }, 0);
        
        const totalExpenses = (despesas || []).reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const expensePercentage = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
        const averageTicket = (vendas || []).length > 0 ? totalRevenue / vendas.length : 0;
        
        console.log('📈 Totais:', {
            receita: totalRevenue,
            despesas: totalExpenses,
            lucro: netProfit,
            clientes: totalClientes,
            produtos: totalProdutos,
            ticket: averageTicket
        });
        
        // Atualizar cards
        document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
        document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
        document.getElementById('netProfit').textContent = formatCurrency(netProfit);
        document.getElementById('totalClients').textContent = totalClientes || 0;
        document.getElementById('totalProducts').textContent = totalProdutos || 0;
        
        // Atualizar indicadores
        document.getElementById('profitMargin').textContent = profitMargin.toFixed(2) + '%';
        document.getElementById('expensePercentage').textContent = expensePercentage.toFixed(2) + '%';
        document.getElementById('averageTicket').textContent = formatCurrency(averageTicket);
        
        // Colorir lucro
        const netProfitElement = document.getElementById('netProfit');
        if (netProfit >= 0) {
            netProfitElement.style.color = '#38a169';
        } else {
            netProfitElement.style.color = '#e53e3e';
        }
        
        // Carregar meta
        await carregarMetaDashboard();
        
        // Atualizar gráficos
        await updateCharts(period);
        
    } catch (error) {
        console.error('❌ Erro ao atualizar dashboard:', error);
    }
}

// ============================================
// META NO DASHBOARD
// ============================================
async function carregarMetaDashboard() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    try {
        // Buscar meta do mês
        const { data: goal } = await supabaseClient
            .from('monthly_goals')
            .select('*')
            .eq('month', month)
            .eq('year', year)
            .single();
        
        // Buscar faturamento atual do mês
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date().toISOString().split('T')[0];
        
        const { data: vendasMes } = await supabaseClient
            .from('sales')
            .select('*')
            .gte('sale_date', startDate)
            .lte('sale_date', endDate);
        
        const faturamentoAtual = (vendasMes || []).reduce((sum, v) => 
            sum + (parseFloat(v.total_value) || parseFloat(v.value) * parseInt(v.quantity)), 0);
        
        if (goal) {
            const percentual = goal.revenue_goal > 0 ? (faturamentoAtual / goal.revenue_goal) * 100 : 0;
            
            document.getElementById('dashMeta').textContent = formatCurrency(goal.revenue_goal);
            document.getElementById('dashMetaProgress').innerHTML = `
                <div style="font-size: 11px; color: #718096;">
                    Alcançado: ${formatCurrency(faturamentoAtual)}
                </div>
                <div style="background: #e2e8f0; height: 6px; border-radius: 3px; margin-top: 4px;">
                    <div style="background: ${percentual >= 100 ? '#38a169' : percentual >= 50 ? '#d69e2e' : '#e53e3e'}; 
                         height: 100%; width: ${Math.min(percentual, 100)}%; 
                         border-radius: 3px; transition: width 0.5s;">
                    </div>
                </div>
                <div style="text-align: center; font-size: 13px; margin-top: 3px; font-weight: 600;
                     color: ${percentual >= 100 ? '#38a169' : percentual >= 50 ? '#d69e2e' : '#e53e3e'};">
                    ${percentual.toFixed(1)}%
                </div>
            `;
        } else {
            document.getElementById('dashMeta').textContent = 'R$ 0,00';
            document.getElementById('dashMetaProgress').innerHTML = `
                <span style="color: #3182ce; font-size: 12px;">📌 Defina uma meta em Vendas</span>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar meta:', error);
        document.getElementById('dashMeta').textContent = 'R$ 0,00';
        document.getElementById('dashMetaProgress').innerHTML = '';
    }
}

// ============================================
// ATUALIZAR GRÁFICOS
// ============================================
async function updateCharts(period) {
    // Destruir gráficos existentes
    Object.values(charts).forEach(chart => {
        try { chart.destroy(); } catch(e) {}
    });
    charts = {};
    
    const { startDate, endDate } = getDateRange(period);
    
    // Buscar todas as vendas e despesas do período
    const { data: allSales } = await supabaseClient
        .from('sales')
        .select('*')
        .gte('sale_date', startDate.split('T')[0])
        .lte('sale_date', endDate.split('T')[0]);
    
    const { data: allExpenses } = await supabaseClient
        .from('expenses')
        .select('*')
        .gte('date', startDate.split('T')[0])
        .lte('date', endDate.split('T')[0]);
    
    const vendas = allSales || [];
    const despesas = allExpenses || [];
    
    // Agrupar por mês
    const months = getMonthsInRange(startDate, endDate);
    const monthlyData = months.map(month => {
        const monthSales = vendas.filter(s => (s.sale_date || s.created_at).startsWith(month));
        const monthExpenses = despesas.filter(e => (e.date || e.created_at).startsWith(month));
        
        return {
            month: formatMonth(month),
            revenue: monthSales.reduce((sum, s) => sum + (parseFloat(s.total_value) || parseFloat(s.value) * parseInt(s.quantity)), 0),
            expenses: monthExpenses.reduce((sum, e) => sum + parseFloat(e.value || 0), 0),
            profit: 0
        };
    });
    
    // Calcular lucro
    monthlyData.forEach(d => {
        d.profit = d.revenue - d.expenses;
    });
    
    const labels = monthlyData.map(d => d.month);
    
    // Verificar se os canvas existem
    const revenueCanvas = document.getElementById('revenueChart');
    const expensesCanvas = document.getElementById('expensesChart');
    const profitCanvas = document.getElementById('profitChart');
    const comparisonCanvas = document.getElementById('comparisonChart');
    
    if (!revenueCanvas || !expensesCanvas || !profitCanvas || !comparisonCanvas) {
        console.warn('⚠️ Canvas dos gráficos não encontrados');
        return;
    }
    
    // Gráfico de Receitas
    charts.revenue = new Chart(revenueCanvas.getContext('2d'), {
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
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
    
    // Gráfico de Despesas
    charts.expenses = new Chart(expensesCanvas.getContext('2d'), {
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
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
    
    // Gráfico de Lucro
    charts.profit = new Chart(profitCanvas.getContext('2d'), {
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
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
    
    // Gráfico Comparativo
    charts.comparison = new Chart(comparisonCanvas.getContext('2d'), {
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
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
    
    console.log('📊 Gráficos atualizados!');
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================
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

console.log('✅ Dashboard carregado!');