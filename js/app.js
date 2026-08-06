// =========================================================
// app.js — Expense & Budget Visualizer
// =========================================================


// ---------------------------------------------------------
// 1. STATE
//    A single array holds all transactions in memory.
//    Every other function reads from / writes to this array.
// ---------------------------------------------------------
let transactions = [];


// ---------------------------------------------------------
// 2. DOM REFERENCES
//    Grab every element we need once, at the top.
//    This avoids calling getElementById repeatedly.
// ---------------------------------------------------------
const form            = document.getElementById('transaction-form');
const inputName       = document.getElementById('item-name');
const inputAmount     = document.getElementById('amount');
const inputCategory   = document.getElementById('category');

const errorName       = document.getElementById('error-item-name');
const errorAmount     = document.getElementById('error-amount');
const errorCategory   = document.getElementById('error-category');

const totalBalanceEl  = document.getElementById('total-balance');
const transactionList = document.getElementById('transaction-list');
const emptyState      = document.getElementById('empty-state');
const chartEmptyState = document.getElementById('chart-empty-state');


// ---------------------------------------------------------
// 3. UTILITY — generate a simple unique ID
//    We'll use this to identify each transaction so we
//    can delete the right one later.
// ---------------------------------------------------------
function generateId() {
  // Date.now() gives milliseconds; Math.random adds uniqueness
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}


// ---------------------------------------------------------
// 4. UTILITY — format a number as Indonesian Rupiah
//    e.g. 25000 → "Rp 25.000"
// ---------------------------------------------------------
function formatRupiah(amount) {
  return 'Rp ' + amount.toLocaleString('id-ID');
}


// ---------------------------------------------------------
// 5. FORM VALIDATION
//    Returns true if all fields pass, false otherwise.
//    Shows or clears error messages next to each field.
// ---------------------------------------------------------
function validateForm() {
  let isValid = true;

  // --- Item Name ---
  if (inputName.value.trim() === '') {
    showError(inputName, errorName, 'Item name is required.');
    isValid = false;
  } else {
    clearError(inputName, errorName);
  }

  // --- Amount ---
  const amountValue = parseFloat(inputAmount.value);
  if (inputAmount.value.trim() === '' || isNaN(amountValue) || amountValue <= 0) {
    showError(inputAmount, errorAmount, 'Enter a valid amount greater than 0.');
    isValid = false;
  } else {
    clearError(inputAmount, errorAmount);
  }

  // --- Category ---
  if (inputCategory.value === '') {
    showError(inputCategory, errorCategory, 'Please select a category.');
    isValid = false;
  } else {
    clearError(inputCategory, errorCategory);
  }

  return isValid;
}

// Helper: mark a field as invalid and display a message
function showError(inputEl, errorEl, message) {
  inputEl.classList.add('input-error');
  errorEl.textContent = message;
}

// Helper: remove the error state from a field
function clearError(inputEl, errorEl) {
  inputEl.classList.remove('input-error');
  errorEl.textContent = '';
}

// Clear ALL errors at once (useful when resetting the form)
function clearAllErrors() {
  clearError(inputName,     errorName);
  clearError(inputAmount,   errorAmount);
  clearError(inputCategory, errorCategory);
}


// ---------------------------------------------------------
// 6. FORM SUBMIT HANDLER
//    Validates → builds a transaction object → adds it
//    to the array → refreshes the UI → resets the form.
// ---------------------------------------------------------
form.addEventListener('submit', function (event) {
  // Prevent the browser from reloading the page
  event.preventDefault();

  // Run validation — stop here if anything fails
  if (!validateForm()) return;

  // Build the transaction object
  const newTransaction = {
    id:       generateId(),
    name:     inputName.value.trim(),
    amount:   parseFloat(inputAmount.value),
    category: inputCategory.value,
  };

  // Add to our in-memory array
  transactions.push(newTransaction);

  // --- Steps 4–7 will hook in here ---
  renderTransactions();   // Step 4 — update the list
  updateBalance();        // Step 5 — update the total
  updateChart();          // Step 6 — update the pie chart
  saveToStorage();        // Step 7 — persist to LocalStorage

  // Reset form fields and clear any leftover errors
  form.reset();
  clearAllErrors();
});


// ---------------------------------------------------------
// 7. RENDER TRANSACTIONS  (Step 4)
//    Wipes the list clean and redraws every transaction
//    from the current state of the `transactions` array.
//    This "full re-render" approach keeps the logic simple
//    and correct — no manual DOM diffing needed.
// ---------------------------------------------------------
function renderTransactions() {
  // Clear whatever is currently in the list
  transactionList.innerHTML = '';

  if (transactions.length === 0) {
    // Show the empty-state message, hide the list
    emptyState.style.display = 'block';
    return;
  }

  // Hide the empty-state message when there is data
  emptyState.style.display = 'none';

  // Build one <li> per transaction and append it
  transactions.forEach(function (transaction) {
    const li = createTransactionItem(transaction);
    transactionList.appendChild(li);
  });
}


// ---------------------------------------------------------
// 8. CREATE A SINGLE TRANSACTION LIST ITEM  (Step 4)
//    Builds and returns one <li> element for a transaction.
//    Keeping this in its own function makes renderTransactions
//    easier to read and test.
// ---------------------------------------------------------
function createTransactionItem(transaction) {
  const li = document.createElement('li');
  li.classList.add('transaction-item');

  // Store the transaction's ID on the element so we can
  // find it when the delete button is clicked.
  li.dataset.id = transaction.id;

  // Map the category name to the correct CSS badge class
  // e.g. "Food" → "badge-food"
  const badgeClass = 'badge-' + transaction.category.toLowerCase();

  // Build the inner HTML for this list item
  li.innerHTML = `
    <div class="transaction-info">
      <span class="transaction-name">${escapeHtml(transaction.name)}</span>
      <span class="badge ${badgeClass}">${transaction.category}</span>
    </div>

    <div class="transaction-right">
      <span class="transaction-amount">${formatRupiah(transaction.amount)}</span>
      <button
        class="btn-delete"
        aria-label="Delete ${escapeHtml(transaction.name)}"
        title="Delete transaction"
      >🗑️</button>
    </div>
  `;

  // Attach the delete handler directly to this item's button
  const deleteBtn = li.querySelector('.btn-delete');
  deleteBtn.addEventListener('click', function () {
    deleteTransaction(transaction.id);
  });

  return li;
}


// ---------------------------------------------------------
// 9. DELETE A TRANSACTION  (Step 4)
//    Filters the transaction with the given ID out of the
//    array, then refreshes all parts of the UI.
// ---------------------------------------------------------
function deleteTransaction(id) {
  // Remove the matching transaction from the array
  transactions = transactions.filter(function (t) {
    return t.id !== id;
  });

  // Refresh everything that depends on the transactions array
  renderTransactions();   // update the list
  updateBalance();        // update the total
  updateChart();          // update the pie chart
  saveToStorage();        // keep LocalStorage in sync
}


// ---------------------------------------------------------
// 10. SECURITY UTILITY — escape HTML special characters
//     Prevents XSS: if a user types "<script>" as an item
//     name, it gets displayed as text, not executed.
// ---------------------------------------------------------
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


// ---------------------------------------------------------
// STUB FUNCTIONS — filled in during later steps
// ---------------------------------------------------------

// ---------------------------------------------------------
// UPDATE BALANCE  (Step 5)
//    Adds up every transaction's amount, then writes the
//    formatted total into the balance card in the header.
//    Called after every add and every delete.
// ---------------------------------------------------------
function updateBalance() {
  // reduce() walks the array and accumulates a running total.
  // We start at 0 (the second argument).
  const total = transactions.reduce(function (sum, transaction) {
    return sum + transaction.amount;
  }, 0);

  // Write the formatted amount into the DOM
  totalBalanceEl.textContent = formatRupiah(total);
}

// ---------------------------------------------------------
// UPDATE CHART  (Step 6)
//    Groups transaction amounts by category, then either
//    creates a new Chart.js pie chart or updates the
//    existing one in-place (to keep the animation smooth).
// ---------------------------------------------------------

// We hold the Chart.js instance outside the function so we
// can update it on subsequent calls instead of recreating it.
let spendingChart = null;

function updateChart() {
  // --- 6a. Group spending totals by category ---
  // Result looks like: { Food: 45000, Transport: 20000, Fun: 75000 }
  const totals = {};

  transactions.forEach(function (transaction) {
    if (totals[transaction.category] === undefined) {
      totals[transaction.category] = 0;
    }
    totals[transaction.category] += transaction.amount;
  });

  // Separate the labels and data values into two parallel arrays
  // e.g. labels = ['Food', 'Transport'],  values = [45000, 20000]
  const labels = Object.keys(totals);
  const values = Object.values(totals);

  // --- 6b. Show/hide the chart canvas vs the empty-state message ---
  const canvas = document.getElementById('spending-chart');

  if (transactions.length === 0) {
    // No data — hide canvas, show placeholder text
    canvas.style.display        = 'none';
    chartEmptyState.style.display = 'block';

    // Destroy any existing chart so it doesn't linger in memory
    if (spendingChart) {
      spendingChart.destroy();
      spendingChart = null;
    }
    return;
  }

  // Data exists — show canvas, hide placeholder text
  canvas.style.display          = 'block';
  chartEmptyState.style.display = 'none';

  // --- 6c. Map each category to a consistent colour ---
  // Using the same palette as the CSS badge colours.
  const categoryColors = {
    Food:      '#f97316',   // orange
    Transport: '#3b82f6',   // blue
    Fun:       '#a855f7',   // purple
  };

  // Build an array of colours in the same order as `labels`
  const backgroundColors = labels.map(function (label) {
    // Fall back to a neutral grey for any unexpected category
    return categoryColors[label] || '#9ca3af';
  });

  // --- 6d. Create or update the chart ---
  if (spendingChart === null) {
    // First time — create a brand-new Chart.js instance
    const ctx = canvas.getContext('2d');

    spendingChart = new Chart(ctx, {
      type: 'pie',

      data: {
        labels:   labels,
        datasets: [{
          data:            values,
          backgroundColor: backgroundColors,
          borderColor:     '#ffffff',
          borderWidth:     2,
        }],
      },

      options: {
        responsive:          true,
        maintainAspectRatio: true,

        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding:   16,
              font:      { size: 13 },
              color:     '#1e1e2e',
              boxWidth:  14,
              boxHeight: 14,
            },
          },

          tooltip: {
            callbacks: {
              // Show the amount formatted as Rupiah in the tooltip
              label: function (context) {
                const value = context.parsed;
                return ' ' + context.label + ': ' + formatRupiah(value);
              },
            },
          },
        },
      },
    });

  } else {
    // Chart already exists — update its data in-place.
    // Chart.js will animate the transition automatically.
    spendingChart.data.labels                      = labels;
    spendingChart.data.datasets[0].data            = values;
    spendingChart.data.datasets[0].backgroundColor = backgroundColors;
    spendingChart.update();
  }
}

// ---------------------------------------------------------
// SAVE TO LOCALSTORAGE  (Step 7)
//    Serialises the entire transactions array to a JSON
//    string and stores it under a fixed key.
//    Called every time a transaction is added or deleted.
// ---------------------------------------------------------
const STORAGE_KEY = 'expense_tracker_transactions';

function saveToStorage() {
  // JSON.stringify converts the array to a plain string
  // that LocalStorage can hold.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}


// ---------------------------------------------------------
// LOAD FROM LOCALSTORAGE  (Step 7)
//    Reads the saved JSON string back out and parses it
//    into the `transactions` array.
//    Called once at page load (see init block below).
// ---------------------------------------------------------
function loadFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    try {
      // JSON.parse turns the string back into a JS array
      const parsed = JSON.parse(saved);

      // Basic sanity check: make sure it really is an array
      if (Array.isArray(parsed)) {
        transactions = parsed;
      }
    } catch (error) {
      // If the stored data is somehow corrupted, start fresh
      console.warn('Could not parse saved transactions. Starting fresh.', error);
      transactions = [];
    }
  }
}


// ---------------------------------------------------------
// 8. LIVE VALIDATION — clear an error as soon as the
//    user starts correcting the field (better UX).
// ---------------------------------------------------------
inputName.addEventListener('input', function () {
  if (inputName.value.trim() !== '') {
    clearError(inputName, errorName);
  }
});

inputAmount.addEventListener('input', function () {
  const val = parseFloat(inputAmount.value);
  if (!isNaN(val) && val > 0) {
    clearError(inputAmount, errorAmount);
  }
});

inputCategory.addEventListener('change', function () {
  if (inputCategory.value !== '') {
    clearError(inputCategory, errorCategory);
  }
});


// ---------------------------------------------------------
// INITIALISE UI ON PAGE LOAD
//    1. Load any previously saved data from LocalStorage.
//    2. Render the list, balance, and chart from that data.
//    This runs once when the browser parses the script.
// ---------------------------------------------------------
loadFromStorage();   // Step 7 — restore saved transactions
renderTransactions(); // Step 4 — draw the list
updateBalance();      // Step 5 — show the correct total
updateChart();        // Step 6 — draw the pie chart
