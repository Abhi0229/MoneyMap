// MoneyMap Finance Tracker
// Real-time updates, count-up animation, budget progress bars, PDF export

'use strict';

// ── State ──────────────────────────────────────────────────────────────────
let income = 0;
let budgets = { Food: 0, Bills: 0, EMI: 0, Entertainment: 0 };
let expenses = { Food: 0, Bills: 0, EMI: 0, Entertainment: 0 };
let budgetChart = null;
let expensesChart = null;

// Chart colors — matches design system
const COLORS = {
    Food:          '#00C896',
    Bills:         '#3B82F6',
    EMI:           '#F59E0B',
    Entertainment: '#EF4444',
};
const COLOR_LIST = Object.values(COLORS);

// ── Formatters ─────────────────────────────────────────────────────────────
function fmt(n) {
    return Math.abs(n).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function fmtSigned(n) {
    return (n < 0 ? '-' : '') + fmt(n);
}

// ── Count-up Animation ─────────────────────────────────────────────────────
function countUp(el, endVal, duration = 500) {
    if (!el) return;
    const startVal = parseFloat(el.dataset.rawValue || '0') || 0;
    el.dataset.rawValue = String(endVal);

    if (startVal === endVal) {
        el.textContent = fmt(endVal);
        return;
    }

    const startTime = performance.now();

    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = startVal + (endVal - startVal) * eased;
        el.textContent = fmt(Math.abs(current));
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ── Income ─────────────────────────────────────────────────────────────────
function setIncome() {
    const val = parseFloat(document.getElementById('incomeInput').value);
    if (isNaN(val) || val < 0) return;
    income = val;
    updateAll();
}

// ── Budget ─────────────────────────────────────────────────────────────────
function setBudget() {
    budgets.Food          = parseFloat(document.getElementById('foodBudget').value) || 0;
    budgets.Bills         = parseFloat(document.getElementById('billsBudget').value) || 0;
    budgets.EMI           = parseFloat(document.getElementById('emiBudget').value) || 0;
    budgets.Entertainment = parseFloat(document.getElementById('entertainmentBudget').value) || 0;
    updateAll();
}

// ── Expenses ───────────────────────────────────────────────────────────────
function addExpense() {
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    if (isNaN(amount) || amount <= 0) return;
    const category = document.getElementById('expenseCategory').value;
    expenses[category] += amount;
    document.getElementById('expenseAmount').value = '';
    updateAll();
}

function removeExpense() {
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    if (isNaN(amount) || amount <= 0) return;
    const category = document.getElementById('expenseCategory').value;
    expenses[category] = Math.max(0, expenses[category] - amount);
    document.getElementById('expenseAmount').value = '';
    updateAll();
}

// ── Master Update — runs every time state changes ──────────────────────────
function updateAll() {
    updateKPIs();
    updateSummary();
    updateBudgetProgress();
    updateBudgetChart();
    updateExpensesChart();
}

// ── KPI Cards ──────────────────────────────────────────────────────────────
function updateKPIs() {
    const totalExp  = Object.values(expenses).reduce((a, b) => a + b, 0);
    const monthly   = income - totalExp;
    const totalBudg = Object.values(budgets).reduce((a, b) => a + b, 0);
    const health    = totalBudg > 0
        ? Math.max(0, Math.round((1 - totalExp / totalBudg) * 100))
        : null;

    countUp(document.getElementById('kpi-income'),   income);
    countUp(document.getElementById('kpi-expenses'), totalExp);
    countUp(document.getElementById('kpi-savings'),  Math.abs(monthly));

    const savingsEl = document.getElementById('kpi-savings');
    if (savingsEl) {
        savingsEl.style.color = monthly >= 0 ? 'var(--accent)' : 'var(--red)';
    }

    const healthEl = document.getElementById('kpi-health');
    if (healthEl) {
        if (health === null) {
            healthEl.textContent = '—';
            healthEl.style.color = 'var(--text-secondary)';
        } else {
            healthEl.textContent = health + '%';
            healthEl.style.color = health >= 60 ? 'var(--accent)' : health >= 30 ? 'var(--yellow)' : 'var(--red)';
        }
        healthEl.dataset.rawValue = String(health ?? 0);
    }
}

// ── Summary Grid ───────────────────────────────────────────────────────────
function updateSummary() {
    const totalBudg = Object.values(budgets).reduce((a, b) => a + b, 0);
    const totalExp  = Object.values(expenses).reduce((a, b) => a + b, 0);
    const monthly   = income - totalExp;
    const yearly    = monthly * 12;
    const util      = totalBudg > 0 ? (totalExp / totalBudg) * 100 : 0;

    countUp(document.getElementById('totalIncome'),   income);
    countUp(document.getElementById('totalBudget'),   totalBudg);
    countUp(document.getElementById('totalExpenses'), totalExp);

    const utilEl = document.getElementById('budgetUtilization');
    if (utilEl) utilEl.textContent = util.toFixed(2);

    // Monthly savings
    const monthEl = document.getElementById('monthlySavings');
    if (monthEl) {
        countUp(monthEl, Math.abs(monthly));
        monthEl.className = 'summary-value ' + (monthly >= 0 ? 'accent-val' : 'negative-val');
    }

    // Yearly savings
    const yearEl = document.getElementById('yearlySavings');
    if (yearEl) {
        countUp(yearEl, Math.abs(yearly));
        yearEl.className = 'summary-value ' + (yearly >= 0 ? 'accent-val' : 'negative-val');
    }
}

// ── Budget Progress Bars ───────────────────────────────────────────────────
function updateBudgetProgress() {
    const container = document.getElementById('budget-progress-list');
    if (!container) return;

    const categories = Object.keys(budgets);
    const anyBudget = categories.some(c => budgets[c] > 0);

    if (!anyBudget) {
        container.innerHTML = '<div class="progress-empty">Set budgets and add expenses to see health.</div>';
        return;
    }

    container.innerHTML = categories.map(cat => {
        const budget  = budgets[cat];
        const expense = expenses[cat];
        const pct     = budget > 0 ? (expense / budget) * 100 : 0;
        const over    = budget > 0 && expense > budget;
        const barPct  = Math.min(pct, 100);

        // Color: green → yellow → red
        const barColor = pct < 75
            ? 'var(--accent)'
            : pct < 100
                ? 'var(--yellow)'
                : 'var(--red)';

        return `
            <div class="progress-item">
                <div class="progress-header">
                    <span class="progress-cat">${cat}</span>
                    <div class="progress-meta">
                        ${over ? '<span class="warn-badge">Over Budget</span>' : ''}
                        <span class="progress-values">${budget > 0 ? 'Rs. ' + fmt(expense) + ' / Rs. ' + fmt(budget) : 'No budget set'}</span>
                    </div>
                </div>
                <div class="progress-bar-track">
                    <div class="progress-bar-fill" style="width: ${barPct}%; background: ${barColor};"></div>
                </div>
                <div class="progress-footer">
                    <span class="progress-pct" style="color: ${barColor}">
                        ${budget > 0 ? barPct.toFixed(0) + '%' : '—'}
                    </span>
                    ${over ? `<span style="font-size:11px; color: var(--red);">-Rs. ${fmt(expense - budget)} over</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ── Budget Pie Chart ───────────────────────────────────────────────────────
function updateBudgetChart() {
    const ctx = document.getElementById('budgetPieChart');
    const emptyEl = document.getElementById('pie-empty');
    if (!ctx) return;

    const hasData = Object.values(budgets).some(v => v > 0);

    if (emptyEl) emptyEl.classList.toggle('hidden', hasData);
    ctx.style.display = hasData ? 'block' : 'none';

    if (!hasData) {
        if (budgetChart) { budgetChart.destroy(); budgetChart = null; }
        return;
    }

    const data = Object.values(budgets);
    const labels = Object.keys(budgets);

    if (budgetChart) {
        budgetChart.data.datasets[0].data = data;
        budgetChart.update('active');
        return;
    }

    budgetChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: COLOR_LIST,
                borderColor: '#1A1D23',
                borderWidth: 3,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#9DA3AE',
                        padding: 20,
                        font: { size: 12, family: 'Inter' },
                        usePointStyle: true,
                        pointStyleWidth: 8
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return ` ${ctx.label}: Rs. ${fmt(ctx.parsed)}`;
                        }
                    }
                }
            }
        }
    });
}

// ── Expenses Bar Chart ─────────────────────────────────────────────────────
function updateExpensesChart() {
    const ctx = document.getElementById('expensesBarChart');
    const emptyEl = document.getElementById('bar-empty');
    if (!ctx) return;

    const hasData = Object.values(expenses).some(v => v > 0);

    if (emptyEl) emptyEl.classList.toggle('hidden', hasData);
    ctx.style.display = hasData ? 'block' : 'none';

    const data = Object.values(expenses);

    if (expensesChart) {
        expensesChart.data.datasets[0].data = data;
        expensesChart.update('active');
        return;
    }

    expensesChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(expenses),
            datasets: [{
                label: 'Expenses (Rs.)',
                data,
                backgroundColor: COLOR_LIST,
                borderRadius: 6,
                borderSkipped: false,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            return ` Rs. ${fmt(ctx.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#9DA3AE', font: { size: 12, family: 'Inter' } },
                    grid: { color: 'rgba(42,45,53,0.5)', drawBorder: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#9DA3AE',
                        font: { size: 12, family: 'Inter' },
                        callback: function(val) {
                            if (!Number.isInteger(val)) return null;
                            return val >= 1000
                                ? 'Rs. ' + (val / 1000).toFixed(0) + 'k'
                                : 'Rs. ' + val;
                        }
                    },
                    grid: { color: 'rgba(42,45,53,0.5)', drawBorder: false }
                }
            }
        }
    });
}

// ── PDF Export ─────────────────────────────────────────────────────────────
function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc  = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const totalBudg = Object.values(budgets).reduce((a, b) => a + b, 0);
    const totalExp  = Object.values(expenses).reduce((a, b) => a + b, 0);
    const monthly   = income - totalExp;
    const yearly    = monthly * 12;
    const util      = totalBudg > 0 ? (totalExp / totalBudg) * 100 : 0;

    // Header
    doc.setFillColor(0, 200, 150);
    doc.rect(0, 0, pageW, 22, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('MoneyMap - Personal Finance Report', pageW / 2, 14, { align: 'center' });

    const now = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Generated: ' + now, pageW - 14, 30, { align: 'right' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Financial Summary (INR)', 14, 36);
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 39, pageW - 14, 39);

    const rows = [
        ['Total Income',       'Rs. ' + fmt(income)],
        ['Total Budget',       'Rs. ' + fmt(totalBudg)],
        ['Total Expenses',     'Rs. ' + fmt(totalExp)],
        ['Budget Utilization', util.toFixed(2) + '%'],
        ['Monthly Savings',    (monthly < 0 ? '-' : '') + 'Rs. ' + fmt(Math.abs(monthly))],
        ['Yearly Savings',     (yearly < 0 ? '-' : '') + 'Rs. ' + fmt(Math.abs(yearly))],
    ];

    let y = 48;
    rows.forEach(function(row, i) {
        if (i % 2 === 0) { doc.setFillColor(248, 248, 248); doc.rect(14, y - 5, pageW - 28, 10, 'F'); }
        doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(80, 80, 80);
        doc.text(row[0], 18, y);
        const isNeg = row[0].includes('Savings') && row[1].startsWith('-');
        doc.setTextColor(row[0].includes('Savings') ? (isNeg ? 220 : 0) : 20, row[0].includes('Savings') ? (isNeg ? 50 : 160) : 20, row[0].includes('Savings') ? (isNeg ? 50 : 120) : 20);
        doc.setFont('helvetica', 'bold');
        doc.text(row[1], pageW - 18, y, { align: 'right' });
        y += 12;
    });

    const chartY = y + 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(30, 30, 30);
    doc.text('Budget & Expense Charts', 14, chartY);
    doc.line(14, chartY + 3, pageW - 14, chartY + 3);

    const pieEl = document.getElementById('budgetPieChart');
    const barEl = document.getElementById('expensesBarChart');

    html2canvas(pieEl, { backgroundColor: '#ffffff', scale: 2 }).then(function(pie) {
        doc.addImage(pie.toDataURL('image/png'), 'PNG', 14, chartY + 8, 85, 65);
        html2canvas(barEl, { backgroundColor: '#ffffff', scale: 2 }).then(function(bar) {
            doc.addImage(bar.toDataURL('image/png'), 'PNG', 107, chartY + 8, 90, 65);
            doc.setFontSize(8); doc.setTextColor(160, 160, 160);
            doc.text('MoneyMap  |  Personal Finance Tracker', pageW / 2, pageH - 8, { align: 'center' });
            doc.save('MoneyMap_Finance_Report.pdf');
        });
    });
}

// ── Init ───────────────────────────────────────────────────────────────────
updateAll();
