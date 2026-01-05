// State
let currentJobId = null;
let materials = [];
let machinesInJob = []; // { id, hours, snapshotRate }
let labor = { hours: 0, rate: 0 };
let profitMargin = 20;

// Config state
let kwhPrice = 0;

let client = { name: '', phone: '', notes: '' };
let jobInfo = { title: '', type: 'Impresión 3D', date: new Date().toISOString().split('T')[0], status: 'Pendiente' };

// DOM Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Inputs
const inputTitle = document.getElementById('job-title');
const inputType = document.getElementById('job-type');
const inputDate = document.getElementById('job-date');
const inputStatus = document.getElementById('job-status');

const inputClientName = document.getElementById('client-search');
const inputClientPhone = document.getElementById('client-phone');
const inputClientNotes = document.getElementById('client-notes');
const btnSaveClient = document.getElementById('btn-save-client');
const datalistClients = document.getElementById('client-suggestions');

// Machines Tab
const inputKwhPrice = document.getElementById('kwh-price');
const jobMachinesList = document.getElementById('job-machines-list');
const machineSelect = document.getElementById('machine-select');
const btnManageMachines = document.getElementById('btn-manage-machines');
const modalMachines = document.getElementById('machines-modal');
const btnCloseMachines = document.getElementById('btn-close-machines');
const machinesDbList = document.getElementById('machines-db-list');
const btnAddMachineDb = document.getElementById('btn-add-machine-db');

// New Machine Inputs
const newMachineName = document.getElementById('new-machine-name');
const newMachineWatts = document.getElementById('new-machine-watts');
const newMachineWear = document.getElementById('new-machine-wear');
const newMachineCat = document.getElementById('new-machine-cat'); // NEW


const materialsList = document.getElementById('materials-list');
const btnAddMaterial = document.getElementById('add-material');

// Post-Processing Elements
const postProcList = document.getElementById('postproc-list');
const btnAddPostProc = document.getElementById('add-postproc');
const displayPostProcTotal = document.getElementById('postproc-total-display');
const displaySummaryPostProc = document.getElementById('summary-postproc');

const inputLaborHours = document.getElementById('labor-hours');
const inputLaborRate = document.getElementById('labor-rate');

const inputOverhead = document.getElementById('overhead-percent');
const displayOverhead = document.getElementById('overhead-display');

// Totals
const displayMaterialsTotal = document.getElementById('materials-total-display');
const displayLaborTotal = document.getElementById('labor-total-display');
const displaySummaryMachines = document.getElementById('summary-machines');
const displaySummaryMaterials = document.getElementById('summary-materials');
const displaySummaryLabor = document.getElementById('summary-labor');
const displaySubtotal = document.getElementById('subtotal-display');
const displayTotal = document.getElementById('total-display');

// Actions
const btnSave = document.getElementById('btn-save');
const btnNew = document.getElementById('btn-new');
const btnWhatsApp = document.getElementById('btn-whatsapp');
const btnPrint = document.getElementById('btn-print');

const btnHistory = document.getElementById('btn-history');
const modalHistory = document.getElementById('history-modal');
const btnCloseHistory = document.getElementById('btn-close-history');
const historyListContainer = document.getElementById('history-list');

// Init
// Init
function init() {
    console.log("Starting App Init...");
    try { setupTabs(); } catch (e) { console.error("Tabs Error:", e); }
    try { setupClients(); } catch (e) { console.error("Clients Error:", e); }
    try { setupMaterials(); } catch (e) { console.error("Materials Error:", e); }
    try { setupLabor(); } catch (e) { console.error("Labor Error:", e); }
    try { setupMachines(); } catch (e) { console.error("Machines Error:", e); }

    // Explicit Debug for Post-Processing
    try {
        console.log("Setting up Post Processing...");
        setupPostProcessing();
    } catch (e) {
        console.error("PostProc Error:", e);
        alert("Error en Post-Proceso: " + e.message);
    }

    try { setupDataManager(); } catch (e) { console.error("DataManager Error:", e); }
    try { setupActions(); } catch (e) { console.error("Actions Error:", e); }
    try { loadGlobalSettings(); } catch (e) { console.error("Settings Error:", e); }

    // Set default date
    if (inputDate) inputDate.value = jobInfo.date;

    // Initial Calc
    calculateTotal();
}

function loadGlobalSettings() {
    const settings = JSON.parse(localStorage.getItem('taller_settings') || '{}');
    kwhPrice = parseFloat(settings.kwhPrice) || 0;
    inputKwhPrice.value = kwhPrice || '';
}

function saveGlobalSettings() {
    const settings = { kwhPrice };
    localStorage.setItem('taller_settings', JSON.stringify(settings));
}

function setupTabs() {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            if (document.getElementById(tabId)) {
                document.getElementById(tabId).classList.add('active');
            }
        });
    });
}

const inputClientEmail = document.getElementById('client-email');
const inputClientFixed = document.getElementById('client-phone-fixed');
const clientPhonesContainer = document.getElementById('client-phones-container');
const btnAddPhone = document.getElementById('btn-add-phone');

function setupClients() {
    loadClientSuggestions();

    // Autocomplete Logic
    inputClientName.addEventListener('input', (e) => {
        const val = e.target.value;
        const clients = JSON.parse(localStorage.getItem('taller_clients') || '[]');
        const found = clients.find(c => c.name === val);
        if (found) {
            // Fill basics
            inputClientEmail.value = found.email || '';
            inputClientFixed.value = found.phoneFixed || '';
            inputClientNotes.value = found.notes || '';

            // Fill Mobiles
            renderClientPhones(found.phones || []);

            // Legacy support (if old data has 'phone' string)
            if (!found.phones && found.phone) {
                renderClientPhones([found.phone]);
            }
        }
        client.name = val;
    });

    // Add Phone Button
    if (btnAddPhone) {
        btnAddPhone.addEventListener('click', () => {
            addPhoneInput();
        });
    }

    // Save Logic
    btnSaveClient.addEventListener('click', () => {
        if (!inputClientName.value) return;

        // Gather phones
        const phoneInputs = document.querySelectorAll('.client-mobile');
        const phonesList = Array.from(phoneInputs).map(inp => inp.value).filter(val => val.trim() !== '');

        const newClient = {
            name: inputClientName.value,
            email: inputClientEmail.value,
            phoneFixed: inputClientFixed.value,
            phones: phonesList,
            notes: inputClientNotes.value
        };

        const clients = JSON.parse(localStorage.getItem('taller_clients') || '[]');
        const idx = clients.findIndex(c => c.name === newClient.name);
        if (idx >= 0) clients[idx] = newClient;
        else clients.push(newClient);

        localStorage.setItem('taller_clients', JSON.stringify(clients));
        loadClientSuggestions();
        alert('Cliente guardado/actualizado');
    });
}

function renderClientPhones(phonesArray) {
    if (!clientPhonesContainer) return;
    clientPhonesContainer.innerHTML = '';
    if (phonesArray.length === 0) {
        addPhoneInput(); // Ensure at least 1
    } else {
        phonesArray.forEach(p => addPhoneInput(p));
    }
}

function addPhoneInput(val = '') {
    if (!clientPhonesContainer) return;
    const div = document.createElement('div');
    div.className = 'row mobile-row';
    div.innerHTML = `
        <input type="tel" class="client-mobile" placeholder="Móvil" value="${val}">
        ${clientPhonesContainer.children.length > 0 ? `<button class="icon-button remove-phone" style="color:var(--md-sys-color-outline)"><span class="material-symbols-rounded">close</span></button>` : ''}
    `;

    // Validate removing
    if (div.querySelector('.remove-phone')) {
        div.querySelector('.remove-phone').addEventListener('click', () => div.remove());
    }

    clientPhonesContainer.appendChild(div);
}

function loadClientSuggestions() {
    const clients = JSON.parse(localStorage.getItem('taller_clients') || '[]');
    datalistClients.innerHTML = '';
    clients.forEach(c => {
        const op = document.createElement('option');
        op.value = c.name;
        datalistClients.appendChild(op);
    });
}

// --- Machines Logic ---

function setupMachines() {
    console.log("Setting up machines..."); // Debug
    seedDefaultMachines(); // Ensure defaults exist


    // Kwh input
    if (inputKwhPrice) {
        inputKwhPrice.addEventListener('input', (e) => {
            kwhPrice = parseFloat(e.target.value) || 0;
            saveGlobalSettings();
            calculateTotal();
            refreshMachineDropdown();
        });
    }

    // DB Management
    if (btnManageMachines) {
        btnManageMachines.addEventListener('click', () => {
            renderMachinesDbList();
            modalMachines.showModal();
        });
    }

    if (btnCloseMachines) {
        btnCloseMachines.addEventListener('click', () => {
            modalMachines.close();
            refreshMachineDropdown();
        });
    }

    // Add Machine
    if (btnAddMachineDb) {
        btnAddMachineDb.addEventListener('click', () => {
            console.log("Add Machine Clicked");
            const name = newMachineName.value;
            const cat = newMachineCat ? newMachineCat.value : 'OTRO';
            const watts = parseFloat(newMachineWatts.value) || 0;
            const wear = parseFloat(newMachineWear.value) || 0;

            if (!name) {
                alert('El nombre es obligatorio');
                return;
            }

            const machines = JSON.parse(localStorage.getItem('taller_machines') || '[]');
            machines.push({ id: Date.now(), name, cat, watts, wear });
            localStorage.setItem('taller_machines', JSON.stringify(machines));

            // Reset inputs
            newMachineName.value = '';
            newMachineWatts.value = '';
            newMachineWear.value = '';

            renderMachinesDbList();
            refreshMachineDropdown();
            alert('Máquina agregada correctamente');
        });
    } else {
        console.error("Button btnAddMachineDb not found!");
    }

    // Select in Job
    refreshMachineDropdown();
    machineSelect.addEventListener('change', (e) => {
        const machineId = parseInt(e.target.value);
        if (machineId) {
            addMachineToJob(machineId);
            machineSelect.value = ""; // Reset
        }
    });
}

function seedDefaultMachines() {
    let machines = JSON.parse(localStorage.getItem('taller_machines') || '[]');
    if (machines.length === 0) {
        machines = [
            { id: 101, name: 'Neptune 4 PRO (Ejemplo)', cat: 'FDM', watts: 350, wear: 10 },
            { id: 102, name: 'Elegoo Mars 5 Ultra (Ejemplo)', cat: 'SLA', watts: 50, wear: 20 },
            { id: 103, name: 'Phecda 20W (Ejemplo)', cat: 'LASER', watts: 150, wear: 50 }
        ];
        localStorage.setItem('taller_machines', JSON.stringify(machines));
    }
}

function refreshMachineDropdown() {
    const machines = JSON.parse(localStorage.getItem('taller_machines') || '[]');
    machineSelect.innerHTML = '<option value="">+ Agregar Máquina al Trabajo</option>';

    // Group by Category
    const categories = { 'FDM': [], 'SLA': [], 'LASER': [], 'CNC': [], 'OTRO': [] };

    machines.forEach(m => {
        const c = m.cat || 'OTRO'; // Fallback
        if (!categories[c]) categories[c] = [];
        categories[c].push(m);
    });

    // Render Groups
    Object.keys(categories).forEach(cat => {
        if (categories[cat].length > 0) {
            const group = document.createElement('optgroup');
            group.label = cat;
            categories[cat].forEach(m => {
                const op = document.createElement('option');
                op.value = m.id;
                op.textContent = m.name;
                group.appendChild(op);
            });
            machineSelect.appendChild(group);
        }
    });
}

function renderMachinesDbList() {
    const machines = JSON.parse(localStorage.getItem('taller_machines') || '[]');
    machinesDbList.innerHTML = '';

    if (machines.length === 0) {
        machinesDbList.innerHTML = '<p style="color:gray">No hay máquinas guardadas.</p>';
        return;
    }

    machines.forEach((m, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div>
                <span style="font-size:0.75rem; background:#333; color:white; padding:2px 4px; border-radius:3px;">${m.cat || 'OTRO'}</span>
                <strong>${m.name}</strong><br>
                <small>${m.watts}W | $${m.wear}/h desgaste</small>
            </div>
            <button class="icon-button" style="color:red">delete</button>
        `;
        div.querySelector('button').addEventListener('click', () => {
            if (confirm(`¿Borrar ${m.name}?`)) {
                machines.splice(index, 1);
                localStorage.setItem('taller_machines', JSON.stringify(machines));
                renderMachinesDbList();
                refreshMachineDropdown();
            }
        });
        machinesDbList.appendChild(div);
    });
}

function addMachineToJob(machineId, hours = 1) {
    const machines = JSON.parse(localStorage.getItem('taller_machines') || '[]');
    const m = machines.find(x => x.id === machineId);
    if (!m) return;

    machinesInJob.push({
        ...m,
        assignedId: Date.now() + Math.random(),
        hours: hours
    });
    renderJobMachines();
    calculateTotal();
}

function renderJobMachines() {
    jobMachinesList.innerHTML = '';
    machinesInJob.forEach(item => {
        const row = document.createElement('div');
        row.className = 'material-item';

        const kwhCost = (item.watts / 1000) * kwhPrice;
        const totalRate = kwhCost + item.wear;

        row.innerHTML = `
            <div style="flex:2">
                <div style="font-weight:500">${item.name}</div>
                <div style="font-size:0.8rem; color:gray">
                    ${item.watts}W => <strong>$${totalRate.toFixed(2)}/h</strong>
                </div>
            </div>
            <div class="input-group" style="flex:1">
                <label style="font-size:0.7rem">Horas</label>
                <input type="number" value="${item.hours}" min="0.1" step="0.1" class="machine-hours-input">
            </div>
            <button class="icon-button remove-btn"><span class="material-symbols-rounded">delete</span></button>
        `;

        const inputHours = row.querySelector('.machine-hours-input');
        inputHours.addEventListener('input', (e) => {
            item.hours = parseFloat(e.target.value) || 0;
            calculateTotal();
        });

        row.querySelector('.remove-btn').addEventListener('click', () => {
            machinesInJob = machinesInJob.filter(x => x.assignedId !== item.assignedId);
            renderJobMachines();
            calculateTotal();
        });

        jobMachinesList.appendChild(row);
    });
}

// --- Materials ---
function setupMaterials() {
    seedDefaultMaterials(); // Ensure defaults exist
    loadMaterialSuggestions();
    addMaterialRow();
    btnAddMaterial.addEventListener('click', () => addMaterialRow());
}

function seedDefaultMaterials() {
    const defaults = ['PLA', 'ABS', 'PET-G', 'TPU', 'PA (Nylon)', 'PA12', 'PC', 'ABS-GF', 'PETG-GF', 'ASA'];
    let db = JSON.parse(localStorage.getItem('taller_materials_db') || '[]');

    let changed = false;
    defaults.forEach(defName => {
        if (!db.find(m => m.name === defName)) {
            db.push({ name: defName, price: 0, unit: 'gramos' });
            changed = true;
        }
    });

    if (changed) {
        localStorage.setItem('taller_materials_db', JSON.stringify(db));
    }
}

function loadMaterialSuggestions() {
    const list = document.getElementById('material-suggestions');
    if (!list) return;

    list.innerHTML = '';
    const db = JSON.parse(localStorage.getItem('taller_materials_db') || '[]');
    db.forEach(m => {
        const op = document.createElement('option');
        op.value = m.name;
        list.appendChild(op);
    });
}

function addMaterialRow(name = '', price = '', qty = 1, unit = 'unidad') {
    const id = Date.now() + Math.random();
    const row = document.createElement('div');
    row.classList.add('material-item', 'row');
    row.dataset.id = id;

    row.innerHTML = `
        <div style="flex: 2; display:flex; flex-direction:column; gap:4px;">
            <input type="text" placeholder="Material" class="mat-name" value="${name}" list="material-suggestions">
            <select class="mat-unit" style="font-size:0.8rem; padding:4px;">
                <option value="unidad" ${unit === 'unidad' ? 'selected' : ''}>Unidad(es)</option>
                <option value="gramos" ${unit === 'gramos' ? 'selected' : ''}>Gramos</option>
                <option value="metros" ${unit === 'metros' ? 'selected' : ''}>Metros</option>
                <option value="kg" ${unit === 'kg' ? 'selected' : ''}>Kg</option>
            </select>
        </div>
        <div class="input-group" style="flex: 1;">
            <input type="number" placeholder="$ Precio/Kg o Unid." class="mat-price" value="${price}">
        </div>
        <div class="input-group" style="flex: 1;">
            <input type="number" placeholder="Cant." class="mat-qty" value="${qty}">
        </div>
        <div style="display:flex; flex-direction:column; gap:2px;">
             <button class="icon-button save-mat-btn" aria-label="Guardar" style="color:var(--md-sys-color-primary);">
                <span class="material-symbols-rounded">save</span>
            </button>
            <button class="icon-button remove-btn" aria-label="Eliminar">
                <span class="material-symbols-rounded">delete</span>
            </button>
        </div>
    `;

    const inputs = row.querySelectorAll('input, select');
    const inputName = row.querySelector('.mat-name');
    const inputPrice = row.querySelector('.mat-price');
    const inputUnit = row.querySelector('.mat-unit');


    // Auto-fill logic
    inputName.addEventListener('input', (e) => {
        const val = e.target.value;
        const db = JSON.parse(localStorage.getItem('taller_materials_db') || '[]');
        const found = db.find(m => m.name === val);
        if (found) {
            inputPrice.value = found.price;
            // inputUnit.value = found.unit; // User requested to NOT auto-change unit
            calculateTotal();
        }
    });

    inputs.forEach(input => input.addEventListener('input', calculateTotal));

    // Save to DB logic
    row.querySelector('.save-mat-btn').addEventListener('click', () => {
        const mName = inputName.value;
        const mPrice = parseFloat(inputPrice.value) || 0;
        const mUnit = inputUnit.value;

        if (!mName) return;

        const db = JSON.parse(localStorage.getItem('taller_materials_db') || '[]');
        const idx = db.findIndex(x => x.name === mName);

        if (idx >= 0) {
            db[idx] = { name: mName, price: mPrice, unit: mUnit };
        } else {
            db.push({ name: mName, price: mPrice, unit: mUnit });
        }

        localStorage.setItem('taller_materials_db', JSON.stringify(db));
        loadMaterialSuggestions(); // Refresh autocomplete
        alert(`Material "${mName}" guardado.`);
    });

    row.querySelector('.remove-btn').addEventListener('click', () => {
        row.remove();
        calculateTotal();
    });

    materialsList.appendChild(row);
}

// --- Post-Processing Logic ---
// --- Post-Processing Logic (Overruled) ---
function setupPostProcessing() {
    seedDefaultPostProc(); // Ensure defaults
    loadPostProcSuggestions();
}

function seedDefaultPostProc() {
    let db = JSON.parse(localStorage.getItem('taller_postproc_db') || '[]');
    if (db.length === 0) {
        const defaults = ['Lijado', 'Pintura', 'Masillado', 'Pegado', 'Barniz', 'Ensamble', 'Otros'];
        defaults.forEach(d => db.push({ name: d, price: 0 })); // Price 0 by default
        localStorage.setItem('taller_postproc_db', JSON.stringify(db));
    }
}

function loadPostProcSuggestions() {
    const grid = document.getElementById('pp-button-grid');
    if (!grid) return;

    grid.innerHTML = '';
    const db = JSON.parse(localStorage.getItem('taller_postproc_db') || '[]');
    
    db.forEach(item => {
        const btn = document.createElement('div');
        btn.className = 'pp-btn';
        btn.textContent = item.name;
        // Check if item has a default price or just use 0
        const price = item.price || 0;
        btn.addEventListener('click', () => addPostProcTask(item.name, 1, price));
        grid.appendChild(btn);
    });
    
    // Also support datalist for the JSON editor if needed (though not strictly required by current HTML)
}

function addPostProcTask(name = 'Tarea', duration = 1, price = 0) {
    const list = document.getElementById('postproc-list');
    const row = document.createElement('div');
    row.classList.add('material-item', 'row');

    // Auto-calculate price guess if 0 (optional logic could go here)

    row.innerHTML = `
        <div style="flex: 2; display:flex; flex-direction:column; justify-content:center;">
            <input type="text" class="pp-desc" value="${name}" style="font-weight:bold;">
        </div>
        <div class="input-group" style="flex: 1;">
             <label style="font-size:0.7rem">Horas</label>
            <input type="number" class="pp-hours" value="${duration}" step="0.5">
        </div>
        <div class="input-group" style="flex: 1;">
             <label style="font-size:0.7rem">Precio ($)</label>
            <input type="number" class="pp-price" value="${price}">
        </div>
        <button class="icon-button remove-btn" style="align-self:center;">
            <span class="material-symbols-rounded">delete</span>
        </button>
    `;

    const inputs = row.querySelectorAll('input');
    inputs.forEach(input => input.addEventListener('input', calculateTotal));

    row.querySelector('.remove-btn').addEventListener('click', () => {
        row.remove();
        calculateTotal();
    });

    list.appendChild(row);
    calculateTotal();
}

function getPostProcFromDOM() {
    const rows = document.querySelectorAll('#postproc-list .material-item');
    const items = [];
    rows.forEach(row => {
        const desc = row.querySelector('.pp-desc').value;
        const hours = parseFloat(row.querySelector('.pp-hours').value) || 0;
        const price = parseFloat(row.querySelector('.pp-price').value) || 0; // Price is manual or calculated by user
        if (desc) items.push({ desc, hours, cost: price }); // adapt 'cost' for compatibility
    });
    return items;
}

function getMaterialsFromDOM() {
    const rows = document.querySelectorAll('#materials-list .material-item'); // scoped to materials list
    const mats = [];
    rows.forEach(row => {
        const name = row.querySelector('.mat-name').value;
        if (!name && !row.querySelector('.mat-price')) return;

        const price = parseFloat(row.querySelector('.mat-price')?.value) || 0;
        const qty = parseFloat(row.querySelector('.mat-qty')?.value) || 0;
        const unit = row.querySelector('.mat-unit')?.value || 'unidad';
        if (name || price > 0) mats.push({ name, price, qty, unit });
    });
    return mats;
}

// --- Labor ---
function setupLabor() {
    inputLaborHours.addEventListener('input', updateLabor);
    inputLaborRate.addEventListener('input', updateLabor);
}
function updateLabor() {
    labor.hours = parseFloat(inputLaborHours.value) || 0;
    labor.rate = parseFloat(inputLaborRate.value) || 0;
    calculateTotal();
}

// --- Actions ---
function setupActions() {
    inputOverhead.addEventListener('input', (e) => {
        profitMargin = parseInt(e.target.value) || 0;
        displayOverhead.textContent = profitMargin;
        calculateTotal();
    });

    inputTitle.addEventListener('input', (e) => jobInfo.title = e.target.value);
    inputDate.addEventListener('input', (e) => jobInfo.date = e.target.value);
    inputType.addEventListener('input', (e) => jobInfo.type = e.target.value);
    inputStatus.addEventListener('input', (e) => jobInfo.status = e.target.value);

    btnSave.addEventListener('click', saveJob);
    btnNew.addEventListener('click', resetForm);

    btnHistory.addEventListener('click', openHistory);
    btnCloseHistory.addEventListener('click', () => modalHistory.close());

    btnWhatsApp.addEventListener('click', shareWhatsApp);
    btnPrint.addEventListener('click', () => window.print());
}

// --- CALCULATION CORE ---
function calculateTotal() {
    // 1. Materials
    const currentMaterials = getMaterialsFromDOM();
    const materialsCost = currentMaterials.reduce((sum, item) => {
        let pricePerUnit = item.price;
        // FDM Logic: If unit is 'gramos', assume price is per Kg (item.price / 1000)
        if (item.unit === 'gramos') {
            pricePerUnit = item.price / 1000;
        }
        return sum + (pricePerUnit * item.qty);
    }, 0);

    // 2. Labor
    const laborCost = labor.hours * labor.rate;

    // 3. Machines
    let machinesCost = 0;
    machinesInJob.forEach(m => {
        const energyCost = (m.watts / 1000) * kwhPrice * m.hours;
        const wearCost = m.wear * m.hours;
        machinesCost += (energyCost + wearCost);
    });

    // 4. Post-Processing
    const currentPostProc = getPostProcFromDOM();
    const postProcCost = currentPostProc.reduce((sum, item) => sum + item.cost, 0);

    const subtotal = materialsCost + laborCost + machinesCost + postProcCost;
    const total = subtotal * (1 + (profitMargin / 100));

    // Update UI
    displayMaterialsTotal.textContent = formatMoney(materialsCost);
    displayLaborTotal.textContent = formatMoney(laborCost);
    if (displayPostProcTotal) displayPostProcTotal.textContent = formatMoney(postProcCost);

    displaySummaryMaterials.textContent = formatMoney(materialsCost);
    displaySummaryLabor.textContent = formatMoney(laborCost);
    displaySummaryMachines.textContent = formatMoney(machinesCost);
    if (displaySummaryPostProc) displaySummaryPostProc.textContent = formatMoney(postProcCost);

    displaySubtotal.textContent = formatMoney(subtotal);
    displayTotal.textContent = formatMoney(total);

    return { subtotal, total, materialsCost, laborCost, machinesCost, postProcCost };
}

function formatMoney(amount) {
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function saveJob() {
    if (!jobInfo.title && !client.name) {
        alert('Falta título o cliente.');
        return;
    }

    const { total } = calculateTotal();
    const jobData = {
        id: currentJobId || Date.now(),
        dateCreated: Date.now(),
        info: { ...jobInfo },
        client: {
            name: inputClientName.value,
            email: inputClientEmail.value,
            phoneFixed: inputClientFixed.value,
            phones: Array.from(document.querySelectorAll('.client-mobile')).map(i => i.value).filter(v => v),
            notes: inputClientNotes.value
        },
        materials: getMaterialsFromDOM(),
        postProcessing: getPostProcFromDOM(),
        machines: machinesInJob, // Save snapshot
        labor: { ...labor },
        profitMargin,
        total
    };

    const history = JSON.parse(localStorage.getItem('taller_jobs') || '[]');
    if (currentJobId) {
        const idx = history.findIndex(j => j.id === currentJobId);
        if (idx !== -1) history[idx] = jobData;
    } else {
        history.unshift(jobData);
        currentJobId = jobData.id;
    }
    localStorage.setItem('taller_jobs', JSON.stringify(history));
    alert('Guardado.');
}

function loadJob(job) {
    currentJobId = job.id;
    jobInfo = { ...job.info };
    inputTitle.value = jobInfo.title || '';
    inputDate.value = jobInfo.date || '';
    inputStatus.value = jobInfo.status || 'Pendiente';
    inputType.value = jobInfo.type || 'Otro';

    // Client
    inputClientName.value = job.client?.name || '';
    inputClientEmail.value = job.client?.email || '';
    inputClientFixed.value = job.client?.phoneFixed || '';
    inputClientNotes.value = job.client?.notes || '';

    // Mobiles
    if (job.client?.phones) {
        renderClientPhones(job.client.phones);
    } else if (job.client?.phone) { // Legacy
        renderClientPhones([job.client.phone]);
    } else {
        renderClientPhones([]);
    }

    client = { ...job.client };

    // Materials
    materialsList.innerHTML = '';
    if (job.materials && job.materials.length > 0) {
        job.materials.forEach(m => addMaterialRow(m.name, m.price, m.qty, m.unit));
    } else {
        addMaterialRow();
    }

    // Machines
    machinesInJob = job.machines || [];
    renderJobMachines();

    // Post-Processing
    // Post-Processing
    const list = document.getElementById('postproc-list'); // ensure fresh ref
    if (list) list.innerHTML = '';

    if (job.postProcessing && job.postProcessing.length > 0) {
        job.postProcessing.forEach(item => {
            // Support legacy (just cost) vs new (hours + cost)
            const h = item.hours || 1;
            const p = item.cost || 0;
            addPostProcTask(item.desc, h, p);
        });
    }

    // Labor
    labor = { ...job.labor };
    inputLaborHours.value = labor.hours;
    inputLaborRate.value = labor.rate;

    profitMargin = job.profitMargin || 20;
    inputOverhead.value = profitMargin;
    displayOverhead.textContent = profitMargin;

    calculateTotal();
    modalHistory.close();
    tabBtns[0].click();
}

function resetForm() {
    if (!confirm('¿Nuevo trabajo?')) return;
    currentJobId = null;
    jobInfo = { title: '', type: 'Impresión 3D', date: new Date().toISOString().split('T')[0], status: 'Pendiente' };
    client = { name: '', phone: '', notes: '' };
    labor = { hours: 0, rate: 0 };
    machinesInJob = [];
    profitMargin = 20;

    inputTitle.value = '';

    inputClientName.value = '';
    inputClientPhone.value = '';

    materialsList.innerHTML = '';
    addMaterialRow();

    const ppList = document.getElementById('postproc-list');
    if (ppList) ppList.innerHTML = '';

    renderJobMachines();

    inputLaborHours.value = 0;
    calculateTotal();
}

function openHistory() {
    const history = JSON.parse(localStorage.getItem('taller_jobs') || '[]');
    historyListContainer.innerHTML = '';
    if (history.length === 0) {
        historyListContainer.innerHTML = '<p>Vacio</p>';
        return;
    }
    history.forEach(job => {
        const el = document.createElement('div');
        el.classList.add('history-item');
        el.innerHTML = `
            <div>
                <div class="history-client">${job.info?.title || 'Sin Título'}</div>
                <div class="history-date">${job.info?.type} | ${job.client?.name}</div>
            </div>
            <div class="history-total">${formatMoney(job.total)}</div>
        `;
        el.addEventListener('click', () => loadJob(job));
        historyListContainer.appendChild(el);
    });
    modalHistory.showModal();
}

function shareWhatsApp() {
    const { total, machinesCost } = calculateTotal();
    const mats = getMaterialsFromDOM();
    const pp = getPostProcFromDOM();

    let text = `*Presupuesto ${jobInfo.type}*\n`;
    text += `Trabajo: ${jobInfo.title || '-'}\n`;
    text += `Cliente: ${inputClientName.value || '-'}\n\n`;

    if (machinesInJob.length > 0) {
        text += `*Maquinaria:*\n`;
        machinesInJob.forEach(m => {
            text += `- ${m.name}: ${m.hours}h\n`;
        });
    }

    if (mats.length > 0) {
        text += `*Materiales:*\n`;
        mats.forEach(m => {
            text += `- ${m.name} (${m.qty} ${m.unit || 'u'}): $${m.price * m.qty}\n`;
        });
    }

    if (pp.length > 0) {
        text += `*Post-Proceso:*\n`;
        pp.forEach(item => {
            text += `- ${item.desc}: $${item.cost}\n`;
        });
    }

    text += `\n*TOTAL: ${formatMoney(total)}*`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
}

// --- Data Management ---
function setupDataManager() {
    const map = {
        'clients': { key: 'taller_clients', el: document.getElementById('json-clients') },
        'materials': { key: 'taller_materials_db', el: document.getElementById('json-materials'), refresh: loadMaterialSuggestions },
        'machines': { key: 'taller_machines', el: document.getElementById('json-machines'), refresh: refreshMachineDropdown },
        'postproc': { key: 'taller_postproc_db', el: document.getElementById('json-postproc'), refresh: loadPostProcSuggestions }
    };

    // Load Data on Tab Click
    // Load Data Helper
    const loadAllData = () => {
        Object.keys(map).forEach(type => {
            const data = localStorage.getItem(map[type].key) || '[]';
            if (map[type].el) {
                // Formatting JSON nicely
                try {
                    map[type].el.value = JSON.stringify(JSON.parse(data), null, 2);
                } catch (e) {
                    map[type].el.value = '[]';
                }
            }
        });
    };

    // Trigger load on Tab Click
    const btnData = document.querySelector('[data-tab="tab-data"]');
    if (btnData) {
        btnData.addEventListener('click', () => {
            // Slight delay to ensure visibility if needed, or immediate
            setTimeout(loadAllData, 50);
        });
    }

    // Also expose to init if needed, or run once now just in case
    loadAllData();

    // Update Buttons
    document.querySelectorAll('.btn-json-update').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const cfg = map[type];
            try {
                const json = JSON.parse(cfg.el.value); // Validate
                localStorage.setItem(cfg.key, JSON.stringify(json));
                if (cfg.refresh) cfg.refresh();
                alert(`Datos de ${type} actualizados.`);
            } catch (e) {
                alert('Error de sintaxis JSON. Revisa las comas y comillas.');
            }
        });
    });

    // Download Buttons
    document.querySelectorAll('.btn-json-dl').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const cfg = map[type];
            const data = localStorage.getItem(cfg.key) || '[]';
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kincecalk_${type}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    });

    // Upload Inputs
    document.querySelectorAll('.json-upload').forEach(input => {
        input.addEventListener('change', (e) => {
            const type = input.dataset.type;
            const cfg = map[type];
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const json = JSON.parse(evt.target.result); // Validate
                    localStorage.setItem(cfg.key, JSON.stringify(json));
                    if (cfg.el) cfg.el.value = JSON.stringify(json, null, 2); // Show new data
                    if (cfg.refresh) cfg.refresh();
                    alert(`Archivo ${file.name} cargado correctamente.`);
                } catch (e) {
                    alert('Archivo inválido.');
                }
            };
            reader.readAsText(file);
            input.value = ''; // Reset
        });
    });
}

init();
