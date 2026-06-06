// Dashboard functionality
class DashboardManager {
    constructor() {
        this.charts = {};
        this.init();
    }
    
    async init() {
        await this.loadIndicators();
        await this.loadCharts();
        this.setupAutoRefresh();
    }
    
    async loadIndicators() {
        try {
            // Get dashboard indicators from view
            const { data: indicators, error } = await supabase
                .from('dashboard_indicadores')
                .select('*')
                .single();
            
            if (error) throw error;
            
            // Update cards
            document.getElementById('faturamentoBruto').textContent = formatCurrency(indicators.faturamento_bruto);
            document.getElementById('totalDespesas').textContent = formatCurrency(indicators.total_despesas);
            document.getElementById('lucroAtual').textContent = formatCurrency(indicators.lucro_atual);
            document.getElementById('totalAtendimentos').textContent = indicators.total_atendimentos;
            
            // Calculate ticket médio
            const ticketMedio = indicators.total_atendimentos > 0 
                ? indicators.faturamento_bruto / indicators.total_atendimentos 
                : 0;
            document.getElementById('ticketMedio').textContent = formatCurrency(ticketMedio);
            
        } catch (error) {
            console.error('Error loading indicators:', error);
            showToast('Erro ao carregar indicadores', 'error');
        }
    }
    
    async loadCharts() {
        await this.loadReceitaPorMes();
        await this.loadDespesasPorCategoria();
        await this.loadProdutosMaisVendidos();
    }
    
    async loadReceitaPorMes() {
        const { data, error } = await supabase
            .from('movimentacoes_financeiras')
            .select('data, valor, tipo')
            .eq('tipo', 'receita')
            .gte('data', new Date(new Date().getFullYear(), 0, 1))
            .lte('data', new Date(new Date().getFullYear(), 11, 31));
        
        if (error) {
            console.error('Error loading monthly revenue:', error);
            return;
        }
        
        // Group by month
        const monthlyData = new Array(12).fill(0);
        data.forEach(item => {
            const month = new Date(item.data).getMonth();
            monthlyData[month] += item.valor;
        });
        
        const ctx = document.getElementById('receitaPorMesChart').getContext('2d');
        this.charts.receitaPorMes = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                datasets: [{
                    label: 'Receita (R$)',
                    data: monthlyData,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.raw) } }
                }
            }
        });
    }
    
    async loadDespesasPorCategoria() {
        const { data, error } = await supabase
            .from('movimentacoes_financeiras')
            .select('categoria, valor')
            .eq('tipo', 'despesa')
            .gte('data', new Date(new Date().getFullYear(), new Date().getMonth(), 1));
        
        if (error) {
            console.error('Error loading expenses by category:', error);
            return;
        }
        
        // Group by category
        const categoryMap = new Map();
        data.forEach(item => {
            categoryMap.set(item.categoria, (categoryMap.get(item.categoria) || 0) + item.valor);
        });
        
        const categories = Array.from(categoryMap.keys());
        const values = Array.from(categoryMap.values());
        
        const ctx = document.getElementById('despesasCategoriaChart').getContext('2d');
        this.charts.despesasCategoria = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#6366f1', '#10b981', '#f59e0b', '#ef4444', 
                        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.raw) } }
                }
            }
        });
    }
    
    async loadProdutosMaisVendidos() {
        // This would require a sales table, for demo we'll use mock data
        const mockData = [
            { nome: 'Hialurônico', quantidade: 45 },
            { nome: 'Toxina Botulínica', quantidade: 38 },
            { nome: 'Vitamina C', quantidade: 30 },
            { nome: 'Ácido Glicólico', quantidade: 25 },
            { nome: 'Retinol', quantidade: 20 }
        ];
        
        const ctx = document.getElementById('produtosVendidosChart').getContext('2d');
        this.charts.produtosVendidos = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: mockData.map(p => p.nome),
                datasets: [{
                    label: 'Quantidade Vendida',
                    data: mockData.map(p => p.quantidade),
                    backgroundColor: '#6366f1'
                }]
            },
            options: {
                responsive: true,
                indexAxis: 'y'
            }
        });
    }
    
    setupAutoRefresh() {
        // Refresh data every 30 seconds
        setInterval(() => {
            this.loadIndicators();
        }, 30000);
    }
}

// Initialize dashboard when page loads
if (document.getElementById('dashboardView')) {
    const dashboard = new DashboardManager();
}