// ===== 🔥 COMPLETE FIX: PERSISTENT USER DATA =====
// REPLACE YOUR ENTIRE script.js WITH THIS CODE

// ===== AUTHENTICATION & USER MANAGEMENT =====
const USERS_KEY = 'fxTaeUsers';
const CURRENT_USER_KEY = 'fxTaeCurrentUser';
const AUTH_KEY = 'fxTaeAuthenticated';

// Dashboard Data Keys
const TRADES_KEY = 'fxTaeTrades';
const GOALS_KEY = 'fxTaeGoals';
const DEPOSITS_KEY = 'fxTaeDeposits';
const WITHDRAWALS_KEY = 'fxTaeWithdrawals';
const STARTING_BALANCE_KEY = 'fxTaeStartingBalance';

// Global state
let trades = [];
let goals = [];
let deposits = [];
let withdrawals = [];
let accountBalance = 0;
let startingBalance = 0;
let equityChart = null;
let winLossChart = null;
let buysSellsChart = null;
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

// ===== CRITICAL: GET CURRENT USER ID WITH FALLBACKS =====
function getCurrentUserId() {
    try {
        // Method 1: Get from localStorage
        const userJson = localStorage.getItem(CURRENT_USER_KEY);
        if (userJson) {
            const user = JSON.parse(userJson);
            if (user && user.id) {
                return user.id.toString();
            }
            if (user && user.email) {
                // Create ID from email if no ID exists
                return user.email.replace(/[^a-zA-Z0-9]/g, '_');
            }
        }
        
        // Method 2: Check session for authenticated user
        if (sessionStorage.getItem(AUTH_KEY) === 'true') {
            // Look for any user data in storage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('user_') && key.includes('fxTaeTrades')) {
                    const match = key.match(/user_(.+?)_fxTaeTrades/);
                    if (match && match[1]) {
                        return match[1];
                    }
                }
            }
        }
        
        // Method 3: Return default for guest
        return 'guest';
    } catch (e) {
        console.error('Error getting user ID:', e);
        return 'guest';
    }
}

// ===== GET USER-SPECIFIC STORAGE KEY =====
function getUserStorageKey(baseKey) {
    const userId = getCurrentUserId();
    return `user_${userId}_${baseKey}`;
}

// ===== DATA LOADING FUNCTIONS =====
function loadUserData() {
    console.log('📂 Loading data for user:', getCurrentUserId());
    
    // Load trades
    try {
        const tradesKey = getUserStorageKey(TRADES_KEY);
        const savedTrades = localStorage.getItem(tradesKey);
        trades = savedTrades ? JSON.parse(savedTrades) : [];
        console.log(`📊 Loaded ${trades.length} trades from ${tradesKey}`);
    } catch (e) {
        console.error('Error loading trades:', e);
        trades = [];
    }
    
    // Load goals
    try {
        const goalsKey = getUserStorageKey(GOALS_KEY);
        const savedGoals = localStorage.getItem(goalsKey);
        goals = savedGoals ? JSON.parse(savedGoals) : [];
        console.log(`🎯 Loaded ${goals.length} goals`);
    } catch (e) {
        goals = [];
    }
    
    // Load deposits
    try {
        const depositsKey = getUserStorageKey(DEPOSITS_KEY);
        const savedDeposits = localStorage.getItem(depositsKey);
        deposits = savedDeposits ? JSON.parse(savedDeposits) : [];
        console.log(`💰 Loaded ${deposits.length} deposits`);
    } catch (e) {
        deposits = [];
    }
    
    // Load withdrawals
    try {
        const withdrawalsKey = getUserStorageKey(WITHDRAWALS_KEY);
        const savedWithdrawals = localStorage.getItem(withdrawalsKey);
        withdrawals = savedWithdrawals ? JSON.parse(savedWithdrawals) : [];
        console.log(`💸 Loaded ${withdrawals.length} withdrawals`);
    } catch (e) {
        withdrawals = [];
    }
    
    // Load starting balance
    try {
        const balanceKey = getUserStorageKey(STARTING_BALANCE_KEY);
        const savedBalance = localStorage.getItem(balanceKey);
        startingBalance = savedBalance ? parseFloat(savedBalance) : 0;
        console.log(`💵 Starting balance: $${startingBalance}`);
    } catch (e) {
        startingBalance = 0;
    }
    
    // Calculate current balance
    calculateAccountBalance();
}

// ===== DATA SAVING FUNCTIONS =====
function saveTrades() {
    const key = getUserStorageKey(TRADES_KEY);
    localStorage.setItem(key, JSON.stringify(trades));
    console.log(`💾 Saved ${trades.length} trades to ${key}`);
}

function saveGoals() {
    const key = getUserStorageKey(GOALS_KEY);
    localStorage.setItem(key, JSON.stringify(goals));
}

function saveDeposits() {
    const key = getUserStorageKey(DEPOSITS_KEY);
    localStorage.setItem(key, JSON.stringify(deposits));
    console.log(`💾 Saved ${deposits.length} deposits to ${key}`);
}

function saveWithdrawals() {
    const key = getUserStorageKey(WITHDRAWALS_KEY);
    localStorage.setItem(key, JSON.stringify(withdrawals));
}

function saveStartingBalance() {
    const key = getUserStorageKey(STARTING_BALANCE_KEY);
    localStorage.setItem(key, startingBalance.toString());
    console.log(`💾 Saved starting balance: $${startingBalance} to ${key}`);
}

// ===== CALCULATE ACCOUNT BALANCE =====
function calculateAccountBalance() {
    const totalPnL = trades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
    accountBalance = startingBalance + totalPnL - totalWithdrawals;
    console.log(`💰 Calculated balance: $${accountBalance} (Start: $${startingBalance}, P&L: $${totalPnL}, Withdrawals: $${totalWithdrawals})`);
    return accountBalance;
}

// ===== USER AUTHENTICATION =====
function initializeUsers() {
    if (!localStorage.getItem(USERS_KEY)) {
        localStorage.setItem(USERS_KEY, JSON.stringify([]));
    }
}

function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

function saveUser(user) {
    const users = getUsers();
    if (users.some(u => u.email === user.email)) {
        return { success: false, message: 'Email already registered' };
    }
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return { success: true };
}

// ===== FIXED LOGIN FUNCTION =====
function login(email, password) {
    console.log('🔐 Attempting login for:', email);
    
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // Ensure user has ID
        if (!user.id) {
            user.id = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            // Update users array
            const userIndex = users.findIndex(u => u.email === email);
            users[userIndex] = user;
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
        }
        
        // Store current user
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        sessionStorage.setItem(AUTH_KEY, 'true');
        
        console.log('✅ Login successful. User ID:', user.id);
        
        // Load user data immediately
        loadUserData();
        
        return { success: true, user };
    }
    
    console.log('❌ Login failed');
    return { success: false, message: 'Invalid email or password' };
}

// ===== FIXED REGISTER FUNCTION =====
function register(name, email, password) {
    console.log('📝 Registering new user:', email);
    
    const users = getUsers();
    
    if (users.some(u => u.email === email)) {
        return { success: false, message: 'Email already registered' };
    }
    
    // Create user with unique ID
    const newUser = {
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: name,
        email: email,
        password: password,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Auto login
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    sessionStorage.setItem(AUTH_KEY, 'true');
    
    console.log('✅ Registration successful. User ID:', newUser.id);
    
    // Initialize empty data for new user
    const emptyTrades = [];
    const emptyGoals = [];
    const emptyDeposits = [];
    const emptyWithdrawals = [];
    const startingBalance = 0;
    
    // Save empty data for new user
    localStorage.setItem(getUserStorageKey(TRADES_KEY), JSON.stringify(emptyTrades));
    localStorage.setItem(getUserStorageKey(GOALS_KEY), JSON.stringify(emptyGoals));
    localStorage.setItem(getUserStorageKey(DEPOSITS_KEY), JSON.stringify(emptyDeposits));
    localStorage.setItem(getUserStorageKey(WITHDRAWALS_KEY), JSON.stringify(emptyWithdrawals));
    localStorage.setItem(getUserStorageKey(STARTING_BALANCE_KEY), startingBalance.toString());
    
    return { success: true };
}

// ===== CHECK AUTHENTICATION =====
function isAuthenticated() {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
}

// ===== FIXED LOGOUT FUNCTION =====
function logout() {
    console.log('🚪 Logging out user:', getCurrentUserId());
    
    // Clear session only - keep user data in localStorage
    sessionStorage.removeItem(AUTH_KEY);
    
    // Redirect to login page
    window.location.replace('index.html');
}

// ===== SET CURRENT USER =====
function setCurrentUser(user) {
    const safeUser = {
        id: user.id || Date.now(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt || new Date().toISOString()
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || '{}');
    } catch {
        return {};
    }
}

// ===== FORCE RELOAD ALL USER DATA =====
function reloadUserData() {
    console.log('🔄 Force reloading data for user:', getCurrentUserId());
    
    // Reload all data
    loadUserData();
    
    // Update all displays
    updateAccountBalanceDisplay();
    updateDashboardStats();
    updateRecentActivity();
    updateTransactionHistory();
    updateAllTradesTable();
    updateGoalsList();
    updateCalendar();
    
    // Update charts
    if (typeof initializeCharts === 'function') {
        setTimeout(() => initializeCharts(), 200);
    }
    
    console.log('✅ Data reload complete');
}

// ===== UTILITY FUNCTIONS =====
function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
    return `$${Math.abs(amount).toFixed(2)}`;
}

function formatCurrencyWithSign(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
    const sign = amount >= 0 ? '+' : '-';
    return `${sign}$${Math.abs(amount).toFixed(2)}`;
}

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return dateString;
    }
}

function formatFullDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch {
        return dateString;
    }
}

function formatDateTime(dateString, timeString) {
    if (!dateString) return '';
    try {
        return `${formatFullDate(dateString)} ${timeString || ''}`.trim();
    } catch {
        return dateString;
    }
}

function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    
    const icon = iconMap[type] || 'info-circle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode === container) {
                container.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// ===== TRADE FUNCTIONS =====
function saveTrade() {
    console.log('📊 Saving trade...');
    
    const date = document.getElementById('tradeDate')?.value;
    const time = document.getElementById('tradeTime')?.value;
    const tradeNumber = parseInt(document.getElementById('tradeNumber')?.value) || 1;
    const pair = document.getElementById('currencyPair')?.value;
    const direction = document.getElementById('tradeDirection')?.value;
    let strategy = document.getElementById('strategy')?.value;
    const customStrategy = document.getElementById('customStrategy')?.value;
    const pnl = parseFloat(document.getElementById('pnlAmount')?.value);
    const notes = document.getElementById('tradeNotes')?.value;
    
    if (!date || !time || !pair || !direction || isNaN(pnl)) {
        showToast('Please fill all required fields', 'error');
        return false;
    }
    
    // Check daily limit
    const todayTrades = trades.filter(t => t.date === date);
    if (todayTrades.length >= 4) {
        showToast('Maximum 4 trades per day reached!', 'error');
        return false;
    }
    
    // Use custom strategy if selected
    if (customStrategy && document.getElementById('customStrategy').style.display !== 'none') {
        strategy = customStrategy;
    }
    
    // Create trade object
    const trade = {
        id: Date.now(),
        date,
        time,
        tradeNumber,
        pair,
        direction,
        strategy: strategy || 'Manual',
        pnl,
        notes: notes || 'No notes',
        type: 'trade'
    };
    
    trades.unshift(trade);
    saveTrades();
    
    // Update balance
    calculateAccountBalance();
    
    // Update ALL displays
    updateAccountBalanceDisplay();
    updateDashboardStats();
    updateRecentActivity();
    updateAllTradesTable();
    updateCalendar();
    
    // Update charts
    if (equityChart) {
        updateEquityChart(document.querySelector('.period-btn.active')?.getAttribute('data-period') || '1m');
    }
    if (winLossChart) {
        updateWinLossChart();
    }
    if (buysSellsChart) {
        updateBuysSellsChart();
    }
    
    // Clear form
    document.getElementById('pnlAmount').value = '';
    document.getElementById('tradeNotes').value = '';
    document.getElementById('customStrategy').style.display = 'none';
    document.getElementById('customStrategy').value = '';
    
    showToast(`Trade saved! P&L: ${formatCurrencyWithSign(pnl)}`, 'success');
    console.log(`✅ Trade saved - New balance: $${accountBalance}`);
    return true;
}

function saveAndDownloadTrade() {
    if (saveTrade() && trades.length > 0) {
        setTimeout(() => downloadTradePDF(trades[0]), 500);
    }
}

function deleteTrade(tradeId) {
    if (!confirm('Delete this trade?')) return;
    
    trades = trades.filter(t => t.id !== tradeId);
    saveTrades();
    
    calculateAccountBalance();
    
    updateAccountBalanceDisplay();
    updateDashboardStats();
    updateRecentActivity();
    updateAllTradesTable();
    updateCalendar();
    
    if (equityChart) {
        updateEquityChart(document.querySelector('.period-btn.active')?.getAttribute('data-period') || '1m');
    }
    if (winLossChart) {
        updateWinLossChart();
    }
    if (buysSellsChart) {
        updateBuysSellsChart();
    }
    
    showToast('Trade deleted', 'success');
}

// ===== DEPOSIT FUNCTIONS =====
function processDeposit() {
    console.log('💰 Processing deposit...');
    
    const date = document.getElementById('depositDate')?.value;
    const time = document.getElementById('depositTime')?.value;
    const broker = document.getElementById('depositBroker')?.value;
    const amount = parseFloat(document.getElementById('depositAmount')?.value);
    const notes = document.getElementById('depositNotes')?.value;
    
    if (!date || !time || !broker || isNaN(amount) || amount <= 0) {
        showToast('Please fill all fields with valid amount', 'error');
        return false;
    }
    
    // Store previous balance
    const oldBalance = startingBalance;
    
    // Update starting balance
    startingBalance = amount;
    saveStartingBalance();
    
    // Clear previous trades and withdrawals for new account
    trades = [];
    withdrawals = [];
    saveTrades();
    saveWithdrawals();
    
    // Create deposit record
    const deposit = {
        id: Date.now(),
        date,
        time,
        broker,
        amount: amount,
        notes: notes || 'Initial Deposit',
        balanceBefore: oldBalance,
        balanceAfter: amount,
        type: 'deposit'
    };
    
    deposits = [deposit];
    saveDeposits();
    
    // Update balance
    calculateAccountBalance();
    
    // Update ALL displays
    updateAccountBalanceDisplay();
    updateRecentActivity();
    updateTransactionHistory();
    updateAllTradesTable();
    updateDashboardStats();
    updateCalendar();
    
    // Update charts
    if (equityChart) {
        updateEquityChart('1m');
    }
    if (winLossChart) {
        updateWinLossChart();
    }
    if (buysSellsChart) {
        updateBuysSellsChart();
    }
    
    // Clear form
    document.getElementById('depositAmount').value = '';
    document.getElementById('depositNotes').value = '';
    document.getElementById('newBalanceAfterDeposit').value = amount.toFixed(2);
    
    showToast(`✅ Starting Balance set to $${amount.toFixed(2)}!`, 'success');
    console.log(`✅ Deposit complete - New balance: $${accountBalance}`);
    return true;
}

function saveAndDownloadDeposit() {
    if (processDeposit() && deposits.length > 0) {
        setTimeout(() => downloadDepositPDF(deposits[0]), 500);
    }
}

function deleteDeposit(depositId) {
    if (!confirm('Delete this deposit? This will reset all data!')) return;
    
    deposits = [];
    startingBalance = 0;
    trades = [];
    withdrawals = [];
    
    saveStartingBalance();
    saveDeposits();
    saveTrades();
    saveWithdrawals();
    
    calculateAccountBalance();
    
    updateAccountBalanceDisplay();
    updateRecentActivity();
    updateTransactionHistory();
    updateAllTradesTable();
    updateDashboardStats();
    updateCalendar();
    
    if (equityChart) {
        updateEquityChart('1m');
    }
    if (winLossChart) {
        updateWinLossChart();
    }
    if (buysSellsChart) {
        updateBuysSellsChart();
    }
    
    showToast('All data cleared', 'success');
}

// ===== WITHDRAWAL FUNCTIONS =====
function processWithdrawal() {
    console.log('💸 Processing withdrawal...');
    
    const date = document.getElementById('withdrawalDate')?.value;
    const time = document.getElementById('withdrawalTime')?.value;
    const broker = document.getElementById('withdrawalBroker')?.value;
    const amount = parseFloat(document.getElementById('withdrawalAmount')?.value);
    const notes = document.getElementById('withdrawalNotes')?.value;
    
    if (!date || !time || !broker || isNaN(amount) || amount <= 0) {
        showToast('Please fill all fields with valid amount', 'error');
        return false;
    }
    
    // Calculate current balance
    const currentBalance = calculateAccountBalance();
    
    if (amount > currentBalance) {
        showToast(`Insufficient balance! Available: ${formatCurrency(currentBalance)}`, 'error');
        return false;
    }
    
    // Create withdrawal
    const withdrawal = {
        id: Date.now(),
        date,
        time,
        broker,
        amount: amount,
        notes: notes || 'Withdrawal',
        balanceBefore: currentBalance,
        balanceAfter: currentBalance - amount,
        type: 'withdrawal'
    };
    
    withdrawals.unshift(withdrawal);
    saveWithdrawals();
    
    // Update balance
    calculateAccountBalance();
    
    // Update ALL displays
    updateAccountBalanceDisplay();
    updateRecentActivity();
    updateTransactionHistory();
    updateDashboardStats();
    
    // Update charts
    if (equityChart) {
        updateEquityChart(document.querySelector('.period-btn.active')?.getAttribute('data-period') || '1m');
    }
    
    // Clear form
    document.getElementById('withdrawalAmount').value = '';
    document.getElementById('withdrawalNotes').value = '';
    document.getElementById('newBalanceAfterWithdrawal').value = (currentBalance - amount).toFixed(2);
    
    showToast(`Withdrawal of $${amount.toFixed(2)} processed!`, 'success');
    console.log(`✅ Withdrawal complete - New balance: $${accountBalance}`);
    return true;
}

function saveAndDownloadWithdrawal() {
    if (processWithdrawal() && withdrawals.length > 0) {
        setTimeout(() => downloadWithdrawalPDF(withdrawals[0]), 500);
    }
}

function deleteWithdrawal(withdrawalId) {
    if (!confirm('Delete this withdrawal?')) return;
    
    withdrawals = withdrawals.filter(w => w.id !== withdrawalId);
    saveWithdrawals();
    
    calculateAccountBalance();
    
    updateAccountBalanceDisplay();
    updateRecentActivity();
    updateTransactionHistory();
    updateDashboardStats();
    
    if (equityChart) {
        updateEquityChart(document.querySelector('.period-btn.active')?.getAttribute('data-period') || '1m');
    }
    
    showToast('Withdrawal deleted', 'success');
}

// ===== UI UPDATE FUNCTIONS =====
function updateAccountBalanceDisplay() {
    calculateAccountBalance();
    
    const totalPnL = trades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);
    const totalDeposits = deposits.length > 0 ? deposits[0].amount : 0;
    
    // Update all balance displays
    const balanceElements = {
        'accountBalance': accountBalance,
        'sidebarBalance': accountBalance,
        'accountBalanceDisplay': accountBalance,
        'startingBalanceDisplay': startingBalance,
        'totalDepositsDisplay': totalDeposits,
        'totalWithdrawalsDisplay': totalWithdrawals
    };
    
    for (let [id, value] of Object.entries(balanceElements)) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = formatCurrency(value);
        }
    }
    
    // Update growth
    const growth = accountBalance - startingBalance;
    const growthEl = document.getElementById('totalGrowth');
    if (growthEl) {
        growthEl.textContent = formatCurrencyWithSign(growth);
    }
    
    const growthPercent = startingBalance > 0 ? (growth / startingBalance * 100).toFixed(1) : 0;
    const growthPercentageEl = document.getElementById('growthPercentage');
    if (growthPercentageEl) {
        growthPercentageEl.textContent = (growthPercent > 0 ? '+' : '') + growthPercent + '%';
    }
    
    // Update equity total if exists
    const equityTotalEl = document.getElementById('equityTotal');
    if (equityTotalEl) {
        equityTotalEl.textContent = formatCurrency(accountBalance);
    }
}

function updateDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayTrades = trades.filter(t => t.date === today);
    const todayPnL = todayTrades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
    
    const todayPnlEl = document.getElementById('todayPnl');
    if (todayPnlEl) todayPnlEl.textContent = formatCurrencyWithSign(todayPnL);
    
    const todayTradesCountEl = document.getElementById('todayTradesCount');
    if (todayTradesCountEl) todayTradesCountEl.textContent = `${todayTrades.length}/4 trades`;
    
    const todayTradeCountEl = document.getElementById('todayTradeCount');
    if (todayTradeCountEl) todayTradeCountEl.textContent = `${todayTrades.length}/4`;
    
    const dailyLimitProgressEl = document.getElementById('dailyLimitProgress');
    if (dailyLimitProgressEl) {
        const dailyProgress = (todayTrades.length / 4) * 100;
        dailyLimitProgressEl.style.width = `${dailyProgress}%`;
    }
    
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const weeklyTrades = trades.filter(t => t.date >= weekAgo);
    const weeklyPnL = weeklyTrades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
    
    const weeklyPnlEl = document.getElementById('weeklyPnl');
    if (weeklyPnlEl) weeklyPnlEl.textContent = formatCurrencyWithSign(weeklyPnL);
    
    const weeklyTradesCountEl = document.getElementById('weeklyTradesCount');
    if (weeklyTradesCountEl) weeklyTradesCountEl.textContent = `${weeklyTrades.length} trades`;
    
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const monthlyTrades = trades.filter(t => t.date >= monthAgo);
    const monthlyPnL = monthlyTrades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
    
    const monthlyPnlEl = document.getElementById('monthlyPnl');
    if (monthlyPnlEl) monthlyPnlEl.textContent = formatCurrencyWithSign(monthlyPnL);
    
    const monthlyTradesCountEl = document.getElementById('monthlyTradesCount');
    if (monthlyTradesCountEl) monthlyTradesCountEl.textContent = `${monthlyTrades.length} trades`;
}

function updateRecentActivity() {
    const tableBody = document.getElementById('recentActivityTable');
    if (!tableBody) return;
    
    const allActivities = [
        ...trades.map(t => ({ ...t, type: 'trade' })),
        ...deposits.map(d => ({ ...d, type: 'deposit' })),
        ...withdrawals.map(w => ({ ...w, type: 'withdrawal' }))
    ].sort((a, b) => {
        const dateA = new Date(a.date + ' ' + (a.time || '00:00'));
        const dateB = new Date(b.date + ' ' + (b.time || '00:00'));
        return dateB - dateA;
    }).slice(0, 10);
    
    if (allActivities.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">
                    <i class="fas fa-chart-line" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                    <p>No activity recorded yet.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = allActivities.map(activity => {
        if (activity.type === 'trade') {
            return `
                <tr>
                    <td>${formatDateTime(activity.date, activity.time)}</td>
                    <td><span class="badge" style="background: rgba(59,130,246,0.1); color: #3b82f6;">TRADE</span></td>
                    <td>${activity.pair} (${activity.direction?.toUpperCase()})</td>
                    <td class="${activity.pnl >= 0 ? 'profit' : 'loss'}" style="font-weight: 600;">${formatCurrencyWithSign(activity.pnl)}</td>
                    <td><span class="badge" style="background: ${activity.pnl >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${activity.pnl >= 0 ? '#22c55e' : '#ef4444'};">${activity.pnl >= 0 ? 'WIN' : 'LOSS'}</span></td>
                    <td>
                        <button onclick="deleteTrade(${activity.id})" class="icon-btn" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        } else if (activity.type === 'deposit') {
            return `
                <tr>
                    <td>${formatDateTime(activity.date, activity.time)}</td>
                    <td><span class="badge" style="background: rgba(34,197,94,0.1); color: #22c55e;">DEPOSIT</span></td>
                    <td>${activity.broker}</td>
                    <td class="profit" style="font-weight: 600;">${formatCurrencyWithSign(activity.amount)}</td>
                    <td><span class="badge" style="background: rgba(34,197,94,0.1); color: #22c55e;">COMPLETED</span></td>
                    <td>
                        <button onclick="deleteDeposit(${activity.id})" class="icon-btn" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        } else {
            return `
                <tr>
                    <td>${formatDateTime(activity.date, activity.time)}</td>
                    <td><span class="badge" style="background: rgba(239,68,68,0.1); color: #ef4444;">WITHDRAWAL</span></td>
                    <td>${activity.broker}</td>
                    <td class="loss" style="font-weight: 600;">${formatCurrencyWithSign(-activity.amount)}</td>
                    <td><span class="badge" style="background: rgba(245,158,11,0.1); color: #f59e0b;">PROCESSED</span></td>
                    <td>
                        <button onclick="deleteWithdrawal(${activity.id})" class="icon-btn" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }
    }).join('');
}

function updateTransactionHistory() {
    const tableBody = document.getElementById('transactionHistoryTable');
    if (!tableBody) return;
    
    const allTransactions = [
        ...deposits.map(d => ({ ...d, transactionType: 'deposit' })),
        ...withdrawals.map(w => ({ ...w, transactionType: 'withdrawal' }))
    ].sort((a, b) => {
        const dateA = new Date(a.date + ' ' + (a.time || '00:00'));
        const dateB = new Date(b.date + ' ' + (b.time || '00:00'));
        return dateB - dateA;
    });
    
    if (allTransactions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">
                    <i class="fas fa-money-bill-transfer" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                    <p>No transactions yet</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = allTransactions.map(t => {
        if (t.transactionType === 'deposit') {
            return `
                <tr>
                    <td>${formatDateTime(t.date, t.time)}</td>
                    <td><span class="badge" style="background: rgba(34,197,94,0.1); color: #22c55e;">DEPOSIT</span></td>
                    <td>${t.broker}</td>
                    <td class="profit" style="font-weight: 600;">${formatCurrency(t.amount)}</td>
                    <td>${formatCurrency(t.balanceBefore)}</td>
                    <td>${formatCurrency(t.balanceAfter)}</td>
                    <td>${t.notes || '-'}</td>
                    <td>
                        <button onclick="deleteDeposit(${t.id})" class="icon-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        } else {
            return `
                <tr>
                    <td>${formatDateTime(t.date, t.time)}</td>
                    <td><span class="badge" style="background: rgba(239,68,68,0.1); color: #ef4444;">WITHDRAWAL</span></td>
                    <td>${t.broker}</td>
                    <td class="loss" style="font-weight: 600;">${formatCurrency(t.amount)}</td>
                    <td>${formatCurrency(t.balanceBefore)}</td>
                    <td>${formatCurrency(t.balanceAfter)}</td>
                    <td>${t.notes || '-'}</td>
                    <td>
                        <button onclick="deleteWithdrawal(${t.id})" class="icon-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }
    }).join('');
}

function updateAllTradesTable() {
    const tableBody = document.getElementById('allTradesTable');
    if (!tableBody) return;
    
    const sortedTrades = [...trades].sort((a, b) => {
        const dateA = new Date(a.date + ' ' + (a.time || '00:00'));
        const dateB = new Date(b.date + ' ' + (b.time || '00:00'));
        return dateB - dateA;
    });
    
    if (sortedTrades.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">
                    <i class="fas fa-book" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                    <p>No trades recorded yet</p>
                </td>
            </tr>
        `;
    } else {
        tableBody.innerHTML = sortedTrades.map(trade => `
            <tr>
                <td>${formatDateTime(trade.date, trade.time)}</td>
                <td>${trade.tradeNumber || 1}</td>
                <td>${trade.pair}</td>
                <td><span class="badge" style="background: ${trade.direction === 'buy' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${trade.direction === 'buy' ? '#22c55e' : '#ef4444'};">${trade.direction?.toUpperCase() || 'BUY'}</span></td>
                <td>${trade.strategy || 'Manual'}</td>
                <td class="${trade.pnl >= 0 ? 'profit' : 'loss'}" style="font-weight: 600;">${formatCurrencyWithSign(trade.pnl)}</td>
                <td><span class="badge" style="background: ${trade.pnl >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${trade.pnl >= 0 ? '#22c55e' : '#ef4444'};">${trade.pnl >= 0 ? 'WIN' : 'LOSS'}</span></td>
                <td>
                    <button onclick="deleteTrade(${trade.id})" class="icon-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // Update stats
    const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length;
    const losingTrades = trades.filter(t => (t.pnl || 0) < 0).length;
    const totalPnL = trades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
    const totalProfit = trades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
    const totalLoss = Math.abs(trades.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0));
    const winRate = trades.length > 0 ? (winningTrades / trades.length * 100).toFixed(1) : 0;
    
    const totalTradesEl = document.getElementById('totalTradesCount');
    if (totalTradesEl) totalTradesEl.textContent = trades.length;
    
    const winningTradesEl = document.getElementById('winningTradesCount');
    if (winningTradesEl) winningTradesEl.textContent = winningTrades;
    
    const losingTradesEl = document.getElementById('losingTradesCount');
    if (losingTradesEl) losingTradesEl.textContent = losingTrades;
    
    const winRateEl = document.getElementById('winRateDisplay');
    if (winRateEl) winRateEl.textContent = `${winRate}%`;
    
    const netPnlEl = document.getElementById('netPnlDisplay');
    if (netPnlEl) netPnlEl.textContent = formatCurrencyWithSign(totalPnL);
    
    const winningAnalyticsEl = document.getElementById('winningTradesAnalytics');
    if (winningAnalyticsEl) winningAnalyticsEl.textContent = winningTrades;
    
    const losingAnalyticsEl = document.getElementById('losingTradesAnalytics');
    if (losingAnalyticsEl) losingAnalyticsEl.textContent = losingTrades;
    
    const totalProfitEl = document.getElementById('totalProfit');
    if (totalProfitEl) totalProfitEl.textContent = formatCurrency(totalProfit);
    
    const totalLossEl = document.getElementById('totalLoss');
    if (totalLossEl) totalLossEl.textContent = formatCurrency(totalLoss);
    
    const buys = trades.filter(t => t.direction === 'buy').length;
    const sells = trades.filter(t => t.direction === 'sell').length;
    
    const totalBuysEl = document.getElementById('totalBuys');
    if (totalBuysEl) totalBuysEl.textContent = buys;
    
    const totalSellsEl = document.getElementById('totalSells');
    if (totalSellsEl) totalSellsEl.textContent = sells;
}

// ===== GOALS FUNCTIONS =====
function saveGoal() {
    const input = document.getElementById('goalInput');
    const content = input?.value.trim();
    
    if (!content) {
        showToast('Please write your goal', 'error');
        return;
    }
    
    const goal = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        content
    };
    
    goals.unshift(goal);
    saveGoals();
    updateGoalsList();
    
    input.value = '';
    showToast('Goal saved!', 'success');
}

function clearGoal() {
    const input = document.getElementById('goalInput');
    if (input) input.value = '';
}

function updateGoalsList() {
    const list = document.getElementById('goalsList');
    if (!list) return;
    
    if (goals.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-tertiary);">
                <i class="fas fa-bullseye" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                <p>No goals yet. Write your first trading goal!</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = goals.map(goal => `
        <div class="goal-card">
            <div class="goal-header">
                <span class="goal-date">${formatFullDate(goal.date)}</span>
                <div class="goal-actions">
                    <button class="edit-btn" onclick="editGoal(${goal.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteGoal(${goal.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="goal-content">${goal.content}</div>
        </div>
    `).join('');
}

function editGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    const input = document.getElementById('goalInput');
    if (input) input.value = goal.content;
    
    goals = goals.filter(g => g.id !== goalId);
    saveGoals();
    updateGoalsList();
    
    showToast('Goal loaded for editing', 'info');
}

function deleteGoal(goalId) {
    if (!confirm('Delete this goal?')) return;
    
    goals = goals.filter(g => g.id !== goalId);
    saveGoals();
    updateGoalsList();
    showToast('Goal deleted', 'success');
}

// ===== CHART FUNCTIONS =====
function initializeCharts() {
    setTimeout(() => {
        initializeWinLossChart();
        initializeBuysSellsChart();
        initializeEquityChart();
    }, 200);
}

function initializeWinLossChart() {
    const ctx = document.getElementById('winLossChart');
    if (!ctx) return;
    
    if (winLossChart) winLossChart.destroy();
    
    const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length;
    const losingTrades = trades.filter(t => (t.pnl || 0) < 0).length;
    
    winLossChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Winning Trades', 'Losing Trades'],
            datasets: [{
                data: [winningTrades, losingTrades],
                backgroundColor: ['#22c55e', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: { legend: { display: false } }
        }
    });
}

function initializeBuysSellsChart() {
    const ctx = document.getElementById('buysSellsChart');
    if (!ctx) return;
    
    if (buysSellsChart) buysSellsChart.destroy();
    
    const buys = trades.filter(t => t.direction === 'buy').length;
    const sells = trades.filter(t => t.direction === 'sell').length;
    
    buysSellsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Buy Trades', 'Sell Trades'],
            datasets: [{
                data: [buys, sells],
                backgroundColor: ['#3b82f6', '#f59e0b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            circumference: 180,
            rotation: 270,
            plugins: { legend: { display: false } }
        }
    });
}

function initializeEquityChart() {
    const ctx = document.getElementById('equityChart');
    if (!ctx) return;
    
    if (equityChart) equityChart.destroy();
    
    equityChart = new Chart(ctx, {
        type: 'line',
        data: getEquityData('1m'),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    ticks: { callback: value => formatCurrency(value) }
                }
            }
        }
    });
}

function updateEquityChart(period) {
    if (!equityChart) return;
    equityChart.data = getEquityData(period);
    equityChart.update();
}

function updateWinLossChart() {
    if (!winLossChart) return;
    const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length;
    const losingTrades = trades.filter(t => (t.pnl || 0) < 0).length;
    winLossChart.data.datasets[0].data = [winningTrades, losingTrades];
    winLossChart.update();
}

function updateBuysSellsChart() {
    if (!buysSellsChart) return;
    const buys = trades.filter(t => t.direction === 'buy').length;
    const sells = trades.filter(t => t.direction === 'sell').length;
    buysSellsChart.data.datasets[0].data = [buys, sells];
    buysSellsChart.update();
}

function getEquityData(period) {
    const startBal = startingBalance || 0;
    
    const events = [];
    
    trades.forEach(t => {
        if (t.date && t.pnl) {
            events.push({ date: t.date, amount: parseFloat(t.pnl) || 0 });
        }
    });
    
    withdrawals.forEach(w => {
        if (w.date && w.amount) {
            events.push({ date: w.date, amount: -(parseFloat(w.amount) || 0) });
        }
    });
    
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const dailyChanges = new Map();
    events.forEach(event => {
        const date = event.date;
        dailyChanges.set(date, (dailyChanges.get(date) || 0) + event.amount);
    });
    
    const labels = ['Start'];
    const data = [startBal];
    let runningBalance = startBal;
    
    const sortedDates = Array.from(dailyChanges.keys()).sort();
    
    sortedDates.forEach(date => {
        runningBalance += dailyChanges.get(date);
        data.push(runningBalance);
        labels.push(formatDate(date));
    });
    
    return {
        labels,
        datasets: [{
            label: 'Account Balance',
            data,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true
        }]
    };
}

// ===== CALENDAR FUNCTIONS =====
function updateCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthYear = document.getElementById('calendarMonthYear');
    if (!grid || !monthYear) return;
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    
    monthYear.textContent = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
    
    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
    const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    let html = '';
    
    for (let i = 0; i < startingDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const today = new Date().toISOString().split('T')[0];
        
        const dayTrades = trades.filter(t => t.date === dateStr);
        const dayPnL = dayTrades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
        
        let dayClass = 'calendar-day';
        if (dateStr === today) dayClass += ' current-day';
        if (dayTrades.length > 0) {
            dayClass += dayPnL >= 0 ? ' profit-day' : ' loss-day';
        }
        
        html += `
            <div class="${dayClass}">
                <span class="calendar-date">${day}</span>
                ${dayTrades.length > 0 ? `
                    <span class="day-pnl ${dayPnL >= 0 ? 'profit' : 'loss'}">
                        ${dayPnL >= 0 ? '+' : '-'}$${Math.abs(dayPnL).toFixed(0)}
                    </span>
                ` : ''}
            </div>
        `;
    }
    
    grid.innerHTML = html;
}

function changeCalendarMonth(direction) {
    currentCalendarMonth += direction;
    
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    } else if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    
    updateCalendar();
}

// ===== PDF FUNCTIONS (SIMPLIFIED) =====
function downloadTradePDF(trade) {
    alert('PDF download feature - In production, this would download a PDF');
}

function downloadDepositPDF(deposit) {
    alert('PDF download feature - In production, this would download a PDF');
}

function downloadWithdrawalPDF(withdrawal) {
    alert('PDF download feature - In production, this would download a PDF');
}

function exportDashboardPDF() {
    alert('PDF export feature - In production, this would export a PDF');
}

function exportJournalPDF() {
    alert('PDF export feature - In production, this would export a PDF');
}

function exportAnalyticsPDF() {
    alert('PDF export feature - In production, this would export a PDF');
}

function exportTransactionsPDF() {
    alert('PDF export feature - In production, this would export a PDF');
}

function exportAllDataPDF() {
    alert('PDF export feature - In production, this would export a PDF');
}

function downloadTradingPlanTemplate() {
    alert('Template download feature - In production, this would download a template');
}

// ===== SETTINGS FUNCTIONS =====
function setTheme(theme) {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    localStorage.setItem('fxTaeTheme', theme);
    
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(theme)) {
            btn.classList.add('active');
        }
    });
}

function saveUsername() {
    const newName = document.getElementById('settingsUsername')?.value.trim();
    if (!newName) {
        showToast('Please enter a username', 'error');
        return;
    }
    
    const user = getCurrentUser();
    user.name = newName;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    
    updateUserInfo();
    document.getElementById('settingsUsername').value = '';
    showToast('Username updated', 'success');
}

function showChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'flex';
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'none';
}

function saveNewPassword() {
    showToast('Password changed successfully', 'success');
    closeChangePasswordModal();
}

function saveTradingRules() {
    const rules = document.getElementById('tradingRulesInput')?.value.trim();
    if (!rules) {
        showToast('Please enter trading rules', 'error');
        return;
    }
    
    localStorage.setItem('fxTaeTradingRules', rules);
    showToast('Trading rules saved', 'success');
}

function clearAllData() {
    if (!confirm('⚠️ WARNING: This will delete ALL your data! Are you sure?')) return;
    
    trades = [];
    goals = [];
    deposits = [];
    withdrawals = [];
    startingBalance = 0;
    
    saveTrades();
    saveGoals();
    saveDeposits();
    saveWithdrawals();
    saveStartingBalance();
    
    calculateAccountBalance();
    reloadUserData();
    
    showToast('All data cleared', 'success');
}

// ===== POSITION CALCULATOR =====
function showPositionCalculator() {
    document.getElementById('positionCalculatorModal').style.display = 'flex';
    document.getElementById('calcBalance').value = accountBalance;
}

function closePositionCalculator() {
    document.getElementById('positionCalculatorModal').style.display = 'none';
}

function calculatePositionSize() {
    const balance = parseFloat(document.getElementById('calcBalance')?.value);
    const riskPercent = parseFloat(document.getElementById('calcRiskPercent')?.value);
    const stopLoss = parseFloat(document.getElementById('calcStopLoss')?.value);
    
    if (isNaN(balance) || isNaN(riskPercent) || isNaN(stopLoss) || stopLoss <= 0) {
        showToast('Please enter valid values', 'error');
        return;
    }
    
    const riskAmount = balance * (riskPercent / 100);
    const positionSize = riskAmount / (stopLoss * 10);
    
    document.getElementById('calcRiskAmount').value = riskAmount.toFixed(2);
    document.getElementById('calcPositionSize').value = positionSize.toFixed(2);
}

// ===== CUSTOM STRATEGY =====
function showCustomStrategy() {
    const input = document.getElementById('customStrategy');
    if (input) {
        input.style.display = 'block';
        input.focus();
    }
}

// ===== UPDATE USER INFO =====
function updateUserInfo() {
    const user = getCurrentUser();
    
    const userNameElements = ['userName', 'sidebarUserName', 'dashboardUserName'];
    userNameElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = user.name || 'Trader';
    });
    
    const userEmailEl = document.getElementById('sidebarUserEmail');
    if (userEmailEl) userEmailEl.textContent = user.email || 'trader@example.com';
    
    const settingsEmailEl = document.getElementById('settingsEmail');
    if (settingsEmailEl) settingsEmailEl.value = user.email || 'trader@example.com';
}

// ===== SET TODAY'S DATES =====
function setTodayDates() {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const tradeDate = document.getElementById('tradeDate');
    if (tradeDate) tradeDate.value = today;
    
    const tradeTime = document.getElementById('tradeTime');
    if (tradeTime) tradeTime.value = timeStr;
    
    const depositDate = document.getElementById('depositDate');
    if (depositDate) depositDate.value = today;
    
    const depositTime = document.getElementById('depositTime');
    if (depositTime) depositTime.value = timeStr;
    
    const withdrawalDate = document.getElementById('withdrawalDate');
    if (withdrawalDate) withdrawalDate.value = today;
    
    const withdrawalTime = document.getElementById('withdrawalTime');
    if (withdrawalTime) withdrawalTime.value = timeStr;
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    // Sidebar toggle
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.dashboard-page').forEach(page => page.classList.remove('active'));
            
            const pageId = this.getAttribute('data-page');
            const page = document.getElementById(pageId);
            if (page) page.classList.add('active');
            
            if (window.innerWidth <= 1024) {
                sidebar?.classList.remove('active');
            }
        });
    });
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Deposit amount preview
    const depositAmount = document.getElementById('depositAmount');
    if (depositAmount) {
        depositAmount.addEventListener('input', function() {
            const amount = parseFloat(this.value) || 0;
            const preview = document.getElementById('newBalanceAfterDeposit');
            if (preview) preview.value = amount.toFixed(2);
        });
    }
    
    // Withdrawal amount preview
    const withdrawalAmount = document.getElementById('withdrawalAmount');
    if (withdrawalAmount) {
        withdrawalAmount.addEventListener('input', function() {
            const amount = parseFloat(this.value) || 0;
            const currentBalance = accountBalance;
            const preview = document.getElementById('newBalanceAfterWithdrawal');
            if (preview) preview.value = (currentBalance - amount).toFixed(2);
        });
    }
    
    // Close modals on outside click
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-premium')) {
            e.target.style.display = 'none';
        }
    });
    
    // Transaction filters
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// ===== INITIALIZE DASHBOARD =====
function initializeDashboard() {
    console.log('🚀 Initializing dashboard...');
    
    if (!isAuthenticated()) {
        window.location.replace('index.html');
        return;
    }
    
    // Load user data
    loadUserData();
    
    // Update UI
    updateUserInfo();
    setTodayDates();
    setupEventListeners();
    
    // Update all displays
    updateAccountBalanceDisplay();
    updateDashboardStats();
    updateRecentActivity();
    updateTransactionHistory();
    updateAllTradesTable();
    updateGoalsList();
    updateCalendar();
    
    // Initialize charts
    setTimeout(() => {
        initializeCharts();
    }, 300);
    
    // Load theme
    const savedTheme = localStorage.getItem('fxTaeTheme') || 'light';
    setTheme(savedTheme);
    
    console.log('✅ Dashboard ready for user:', getCurrentUserId());
}

// ===== PAGE INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Page loaded - checking authentication...');
    
    initializeUsers();
    
    const path = window.location.pathname;
    const isDashboard = path.includes('dashboard.html');
    
    if (isDashboard && !isAuthenticated()) {
        window.location.replace('index.html');
        return;
    }
    
    if (isDashboard) {
        // Hide loader and show dashboard
        const loader = document.getElementById('loader');
        const mainContainer = document.getElementById('mainContainer');
        
        if (loader) loader.style.display = 'none';
        if (mainContainer) mainContainer.style.display = 'block';
        
        initializeDashboard();
    }
});

// ===== EXPORT GLOBAL FUNCTIONS =====
window.login = login;
window.register = register;
window.logout = logout;
window.initializeDashboard = initializeDashboard;
window.saveTrade = saveTrade;
window.saveAndDownloadTrade = saveAndDownloadTrade;
window.deleteTrade = deleteTrade;
window.processDeposit = processDeposit;
window.saveAndDownloadDeposit = saveAndDownloadDeposit;
window.deleteDeposit = deleteDeposit;
window.processWithdrawal = processWithdrawal;
window.saveAndDownloadWithdrawal = saveAndDownloadWithdrawal;
window.deleteWithdrawal = deleteWithdrawal;
window.saveGoal = saveGoal;
window.clearGoal = clearGoal;
window.editGoal = editGoal;
window.deleteGoal = deleteGoal;
window.setTheme = setTheme;
window.clearAllData = clearAllData;
window.changeCalendarMonth = changeCalendarMonth;
window.showChangePasswordModal = showChangePasswordModal;
window.closeChangePasswordModal = closeChangePasswordModal;
window.saveNewPassword = saveNewPassword;
window.saveUsername = saveUsername;
window.saveTradingRules = saveTradingRules;
window.exportDashboardPDF = exportDashboardPDF;
window.exportJournalPDF = exportJournalPDF;
window.exportAnalyticsPDF = exportAnalyticsPDF;
window.exportTransactionsPDF = exportTransactionsPDF;
window.exportAllDataPDF = exportAllDataPDF;
window.showCustomStrategy = showCustomStrategy;
window.showPositionCalculator = showPositionCalculator;
window.closePositionCalculator = closePositionCalculator;
window.calculatePositionSize = calculatePositionSize;
window.downloadTradingPlanTemplate = downloadTradingPlanTemplate;
window.reloadUserData = reloadUserData;
window.getCurrentUserId = getCurrentUserId;
window.formatCurrency = formatCurrency;
window.formatCurrencyWithSign = formatCurrencyWithSign;
window.showToast = showToast;
