let dynamicPieChart = null;

function navigateToTab(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    const tabLinks = document.querySelectorAll('.tab');

    tabs.forEach(tab => tab.classList.remove('active'));
    tabLinks.forEach(tabLink => tabLink.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    const activeTabLink = Array.from(tabLinks).find(tabLink => tabLink.textContent.toLowerCase() === tabId.split('-')[1]);
    if (activeTabLink) activeTabLink.classList.add('active');
}

function showTab(tabId) {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
}

function updateContractNumber() {
    const carrier = document.getElementById('carrierName').value;
    const contractNumberField = document.getElementById('contractNumber');
    contractNumberField.value = carrier ? `Contract-${carrier}` : '';
}

function updateZipcode() {
    const county = document.getElementById('county').value;
    const zipcodeField = document.getElementById('zipcode');
    zipcodeField.value = county === 'Cook County' ? '60601' : county === 'Los Angeles County' ? '90001' : '';
}

function addTransaction() {
    const tbody = document.getElementById('policyTableBody');
    const rowCount = tbody.rows.length + 1;
    const carrierName = document.getElementById('carrierName').value;
    const contractNumber = document.getElementById('contractNumber').value;
    const state = document.getElementById('state').value;
    const zone = document.getElementById('zone').value;
    const county = document.getElementById('county').value;
    const city = document.getElementById('city').value;
    const zipcode = document.getElementById('zipcode').value;
    const inforceTIV = parseFloat(document.getElementById('inforceTIV').value) || 0;

    if (!carrierName || !contractNumber || !state || !zone || !county || !city || !zipcode || isNaN(inforceTIV)) {
        alert('Please fill all the fields.');
        return;
    }

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${rowCount}</td>
        <td>Policy-${rowCount}</td>
        <td>${carrierName}</td>
        <td>${contractNumber}</td>
        <td>${state}</td>
        <td>${zone}</td>
        <td>Tier-${rowCount}</td>
        <td>${county}</td>
        <td>${city}</td>
        <td>${zipcode}</td>
        <td>$10M</td>
        <td>${inforceTIV.toFixed(2)}</td>
        <td>${(10000000 - inforceTIV).toFixed(2)}</td>
        <td>${((inforceTIV / 10000000) * 100).toFixed(2)}%</td>
        <td><button onclick="deleteRow(this)">Delete</button></td>
    `;
    tbody.appendChild(row);

    // Save transaction data to local storage
    saveToLocalStorage({
        carrierName,
        contractNumber,
        state,
        zone,
        county,
        city,
        zipcode,
        inforceTIV
    });

    // Update the pie chart after adding a new transaction
    renderPieChart();
}

function deleteRow(button) {
    button.parentElement.parentElement.remove();
}

function downloadCSV() {
    const table = document.querySelector('table');
    if (!table) {
        console.error('Table element not found.');
        return;
    }

    let csv = [];

    // Get headers
    const headers = [];
    const headerCells = table.querySelectorAll('thead th');
    headerCells.forEach(header => {
        headers.push(header.innerText);
    });
    csv.push(headers.join(','));

    // Get rows
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const rowData = [];
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
            rowData.push(cell.innerText);
        });
        if (rowData.length > 0) {
            csv.push(rowData.join(','));
        }
    });

    // Create CSV string
    const csvString = csv.join('\n');

    // Create a Blob and download the file
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'policy_transactions.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Generate and display pie chart
    renderPieChart();
}

function renderPieChart() {
    const ctx = document.getElementById('dynamicPieChart').getContext('2d');
    const table = document.querySelector('table');
    const transactions = Array.from(table.querySelectorAll('tbody tr')).map(row => {
        const cells = row.querySelectorAll('td');
        const inforceTIV = parseFloat(cells[11].innerText) || 0; // Inforce TIV column index
        return {
            name: cells[2].innerText, // Carrier Name column index
            value: inforceTIV
        };
    });

    // Define total aggregate limit
    const aggregateLimit = 10000000;

    // Data for pie chart
    const utilized = transactions.reduce((total, t) => total + t.value, 0);
    const available = aggregateLimit - utilized;

    const data = {
        labels: transactions.map(t => t.name).concat('Remaining'),
        datasets: [{
            data: transactions.map(t => t.value).concat(available),
            backgroundColor: transactions.map(() => '#' + Math.floor(Math.random()*16777215).toString(16)).concat('#ecf0f1'),
            hoverBackgroundColor: transactions.map(() => '#' + Math.floor(Math.random()*16777215).toString(16)).concat('#bdc3c7')
        }]
    };

    // Render or update the pie chart
    if (dynamicPieChart) {
        dynamicPieChart.data = data;
        dynamicPieChart.update();
    } else {
        dynamicPieChart = new Chart(ctx, {
            type: 'pie',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // Show the pie chart
    document.getElementById('dynamicPieChart').style.display = 'block';
}

function saveToLocalStorage(transaction) {
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function generateAggregateReport() {
    const reportDate = document.getElementById('reportDate').value;
    if (!reportDate) {
        alert('Please select a date to generate the report.');
        return;
    }

    const tbody = document.getElementById('reportTableBody');
    tbody.innerHTML = ''; // Clear any existing rows

    // Fetch and parse data from local storage
    const data = JSON.parse(localStorage.getItem('transactions')) || [];

    data.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>Week ${new Date(reportDate).getWeek()}</td>
            <td>${reportDate}</td>
            <td>Batch ${Math.ceil((index + 1) / 10)}</td>
            <td>${row.carrierName}</td>
            <td>${row.contractNumber}</td>
            <td>${row.state}</td>
            <td>${row.zone}</td>
            <td>$10M</td>
            <td>${row.inforceTIV.toFixed(2)}</td>
            <td>${(10000000 - row.inforceTIV).toFixed(2)}</td>
            <td>${((row.inforceTIV / 10000000) * 100).toFixed(2)}%</td>
        `;
        tbody.appendChild(tr);
    });
}

// Helper function to get the week number from a date
Date.prototype.getWeek = function () {
    const start = new Date(this.getFullYear(), 0, 1);
    const days = Math.floor((this - start) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + 1) / 7);
};
