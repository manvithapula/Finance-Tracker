class FinanceTracker {
    constructor() {
        this.transactions = [];
        this.initEventListeners();
        this.loadTransactions();
    }

    initEventListeners() {
        const addButton = document.querySelector('.add-expense-btn');
        if (addButton) {
            addButton.addEventListener('click', () => this.addTransaction());
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    }

    async addTransaction() {
        const type = document.getElementById('transaction-type').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;
        const description = document.getElementById('description').value;

        if (!this.validateInput(amount, category, date)) return;

        const transaction = {
            type,
            amount,
            category,
            date,
            description
        };

        try {
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transaction)
            });

            if (!response.ok) {
                throw new Error('Failed to add transaction');
            }

            const newTransaction = await response.json();
            this.transactions.push(newTransaction);
            this.renderTransactions();
            this.updateSummary();
            this.clearForm();
        } catch (error) {
            console.error('Error adding transaction:', error);
            alert('Failed to add transaction. Please try again.');
        }
    }

    validateInput(amount, category, date) {
        if (!amount || !category || !date) {
            alert('Please fill in all fields');
            return false;
        }
        return true;
    }

    async loadTransactions() {
        try {
            const response = await fetch('/api/transactions');
            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }
            this.transactions = await response.json();
            this.renderTransactions();
            this.updateSummary();
        } catch (error) {
            console.error('Error loading transactions:', error);
        }
    }

    renderTransactions() {
        const container = document.getElementById('transaction-container');
        if (!container) return;

        container.innerHTML = '';

        this.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(transaction => {
                const transactionEl = document.createElement('div');
                transactionEl.classList.add('transaction', transaction.type);
                transactionEl.innerHTML = `
                    <div class="transaction-details">
                        <strong>${transaction.category}</strong>
                        <small>${transaction.description}</small>
                        <small>${new Date(transaction.date).toLocaleDateString()}</small>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${this.formatCurrency(transaction.amount)}
                    </div>
                `;
                container.appendChild(transactionEl);
            });
    }

    updateSummary() {
        const totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const netBalance = totalIncome - totalExpenses;

        const incomeEl = document.getElementById('total-income');
        const expensesEl = document.getElementById('total-expenses');
        const netBalanceEl = document.getElementById('net-balance');

        if (incomeEl) incomeEl.textContent = this.formatCurrency(totalIncome);
        if (expensesEl) expensesEl.textContent = this.formatCurrency(totalExpenses);
        if (netBalanceEl) netBalanceEl.textContent = this.formatCurrency(netBalance);
    }

    clearForm() {
        document.getElementById('amount').value = '';
        document.getElementById('description').value = '';
        document.getElementById('date').value = '';
    }
}

// Initialize the tracker when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new FinanceTracker();
});