let equityChartInstance = null;

document.getElementById('backtestForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // UI Elements
    const btn = document.getElementById('runBtn');
    const btnText = btn.querySelector('.btn-text');
    const loader = document.getElementById('btnLoader');
    const errorBox = document.getElementById('errorBox');
    const errorMsg = document.getElementById('errorMessage');
    const metricsGrid = document.getElementById('metricsGrid');
    const chartWrapper = document.getElementById('chartWrapper');
    
    // Form Values
    const ticker = document.getElementById('ticker').value.trim();
    const startDate = document.getElementById('start_date').value;
    const endDate = document.getElementById('end_date').value;
    const initialCapital = parseFloat(document.getElementById('initial_capital').value);
    
    // Start Loading State
    btn.disabled = true;
    btnText.style.display = 'none';
    loader.style.display = 'block';
    errorBox.style.display = 'none';
    
    try {
        const response = await fetch('/api/backtest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ticker: ticker,
                start_date: startDate,
                end_date: endDate,
                initial_capital: initialCapital
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'An error occurred during backtesting');
        }
        
        // Render Metrics
        document.getElementById('metric-initial').textContent = `₹${data.metrics.initial_capital.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        
        const finalEquityStr = `₹${data.metrics.final_equity.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        document.getElementById('metric-final').textContent = finalEquityStr;
        document.getElementById('header-value').textContent = finalEquityStr;
        
        const returnPct = ((data.metrics.final_equity - data.metrics.initial_capital) / data.metrics.initial_capital) * 100;
        const returnPctStr = `${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(2)}%`;
        
        document.getElementById('metric-return').textContent = returnPctStr;
        document.getElementById('header-return').textContent = returnPctStr;
        
        if (returnPct >= 0) {
            document.getElementById('metric-return').className = 'text-green';
            document.getElementById('metric-final').className = 'text-green';
            document.getElementById('header-return').className = 'trend up';
        } else {
            document.getElementById('metric-return').className = 'text-red';
            document.getElementById('metric-final').className = 'text-red';
            document.getElementById('header-return').className = 'trend down';
        }
        
        document.getElementById('metric-trades').textContent = data.metrics.total_trades;
        
        // Show the sections
        metricsGrid.style.display = 'grid';
        chartWrapper.style.display = 'block';
        
        // Render Chart
        renderChart(data.equity_curve.dates, data.equity_curve.equity, data.equity_curve.stock_price);
        
    } catch (error) {
        errorMsg.textContent = error.message;
        errorBox.style.display = 'block';
    } finally {
        // Reset Loading State
        btn.disabled = false;
        btnText.style.display = 'block';
        loader.style.display = 'none';
    }
});

function renderChart(dates, equityValues, stockPrices) {
    const ctx = document.getElementById('equityChart').getContext('2d');
    
    if (equityChartInstance) {
        equityChartInstance.destroy();
    }
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
    
    equityChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Portfolio Equity',
                    data: equityValues,
                    borderColor: '#3B82F6',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: true,
                    tension: 0.1,
                    yAxisID: 'y'
                },
                {
                    label: 'Stock Price',
                    data: stockPrices,
                    borderColor: '#10B981',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: false,
                    tension: 0.1,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                legend: {
                    labels: { color: '#94A3B8' }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94A3B8', maxTicksLimit: 10 }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#3B82F6',
                        callback: function(value) {
                            return '₹' + value.toLocaleString();
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: {
                        color: '#10B981',
                        callback: function(value) {
                            return '₹' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}
