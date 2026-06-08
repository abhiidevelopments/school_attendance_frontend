/**
 * PWA Application Logic
 * Integrates with Python Flask Backend on Render via Fetch API.
 */

// Backend configuration
const API_BASE = "https://your-flask-backend.onrender.com/api";

// -------------------------------------------------------------
// Initialization & Screen Routing
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    bindEvents();
});

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

/**
 * Validates localstorage tokens to persist sessions.
 * Note: 'school_id' isolates multi-tenant data on the backend.
 */
function checkSession() {
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');
    
    if (!token || !role) {
        switchScreen('screen-login');
        return;
    }

    if (role === 'MASTER') routeMaster();
    else if (role === 'MANAGEMENT') routeManagement();
    else if (role === 'TEACHER') routeTeacher();
}

function logout() {
    localStorage.clear(); // Clears school_id, token, and role securely offline.
    // Optionally call backend /auth/logout here
    switchScreen('screen-login');
}

// -------------------------------------------------------------
// Authentication logic (Login Screen)
// -------------------------------------------------------------
function bindEvents() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('createSchoolForm').addEventListener('submit', handleCreateSchool);
    document.getElementById('homeworkForm').addEventListener('submit', handlePostHomework);
}

async function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('loginUsername').value;
    const pass = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        /*
        // REAL API CALL:
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username: user, password: pass })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        */

        // SIMULATED LOGIN LOGIC FOR PROTOTYPING
        let role = '';
        let school_id = 'SCH-01'; // Simulated multitenant token
        
        if(user === 'master') role = 'MASTER';
        else if (user === 'admin') role = 'MANAGEMENT';
        else if (user === 'teacher') role = 'TEACHER';
        else throw new Error("Invalid simulated user. Use 'master', 'admin', or 'teacher'");

        // STORE TOKENS SECURELY
        // - 'auth_token': JWT verify identity/expiration server-side
        // - 'school_id': Attached to every subsequent fetch header to scope DB queries in Postgres
        localStorage.setItem('auth_token', 'simulated_jwt_token123');
        localStorage.setItem('user_role', role);
        localStorage.setItem('school_id', school_id); 
        
        errorDiv.classList.add('hidden');
        checkSession();

    } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.classList.remove('hidden');
    }
}

// -------------------------------------------------------------
// Master Admin Module
// -------------------------------------------------------------
function routeMaster() {
    switchScreen('screen-master');
    // Fetch schools from backend...
    renderSchoolsList([
        { id: "SCH-001", name: "Greenwood High", status: "Active", expiry: "2027-01-01" },
        { id: "SCH-002", name: "Springfield Elementary", status: "Active", expiry: "2026-10-15" }
    ]);
}

async function handleCreateSchool(e) {
    e.preventDefault();
    const name = document.getElementById('newSchoolName').value;
    
    // Simulate API POST /api/admin/create_school
    const simulatedID = "SCH-" + Math.floor(Math.random() * 1000);
    alert(`School created successfully!\n\nSchool ID: ${simulatedID}\nAdmin User: admin_${simulatedID}\nPass: temporary123`);
    
    document.getElementById('createSchoolForm').reset();
    routeMaster(); // Refresh list
}

function renderSchoolsList(schools) {
    const tbody = document.getElementById('schoolsDirectory');
    tbody.innerHTML = schools.map(s => `
        <tr class="hover:bg-slate-50 transition">
            <td class="py-4 px-6 font-mono text-xs text-slate-500">${s.id}</td>
            <td class="py-4 px-6 font-medium text-slate-800">${s.name}</td>
            <td class="py-4 px-6"><span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">${s.status}</span></td>
            <td class="py-4 px-6 text-slate-500">${s.expiry}</td>
        </tr>
    `).join('');
}

// -------------------------------------------------------------
// Management Dashboard & Real-Time Queue
// -------------------------------------------------------------
let logInterval;

function routeManagement() {
    switchScreen('screen-management');
    startRealtimeLogsSimulation(); // Start listening to logs
}

/**
 * Manages the live attendance queue. 
 * Fetches new logs, prepends them, and triggers CSS reflow for animation.
 */
function addLogToQueue(studentName, time, statusClass) {
    const queue = document.getElementById('attendanceQueue');
    
    // Create element with base classes (hidden/shrunk state)
    const logEl = document.createElement('div');
    logEl.className = `log-item bg-white border border-slate-100 rounded-xl px-4 py-3 flex justify-between items-center shadow-sm w-full`;
    
    logEl.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full ${statusClass} flex items-center justify-center text-white font-bold text-xs">
                ${studentName.charAt(0)}
            </div>
            <div>
                <p class="text-sm font-bold text-slate-800">${studentName}</p>
                <p class="text-xs text-slate-500">Entered Campus</p>
            </div>
        </div>
        <div class="text-xs font-mono text-slate-400">${time}</div>
    `;

    // Prepend (insert at the VERY TOP)
    queue.prepend(logEl);

    // Force DOM Reflow to ensure transition runs from 0 height to auto
    void logEl.offsetWidth; 
    
    // Add the class that triggers the CSS expansion and opacity fade-in
    logEl.classList.add('show');
    
    // Cleanup old logs to prevent DOM bloat
    if(queue.children.length > 20) {
        queue.removeChild(queue.lastChild);
    }
}

// Simulates the WebSocket or polling from the Flask Backend.
function startRealtimeLogsSimulation() {
    clearInterval(logInterval);
    const names = ["Ayesha S.", "Rahul V.", "Karan M.", "Priya R.", "Vikram T."];
    const colors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-orange-500"];
    
    logInterval = setInterval(() => {
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        addLogToQueue(randomName, time, randomColor);
    }, 4500); // New log every 4.5 seconds
}

// -------------------------------------------------------------
// Teacher Dashboard Module
// -------------------------------------------------------------
function routeTeacher() {
    switchScreen('screen-teacher');
    clearInterval(logInterval); // Stop admin simulation
}

async function handlePostHomework(e) {
    e.preventDefault();
    /*
    const schoolId = localStorage.getItem('school_id');
    const token = localStorage.getItem('auth_token');
    // POST /api/homework with headers: { 'Authorization': `Bearer ${token}`, 'X-School-ID': schoolId }
    */
    
    const container = document.getElementById('hwShareLinkContainer');
    const linkEl = document.getElementById('hwShareLink');
    
    // Simulate generation of UUID public link
    const publicUUID = Math.random().toString(36).substring(2, 10);
    linkEl.href = `https://schoolmanager.app/p/hw/${publicUUID}`;
    linkEl.textContent = `https://schoolmanager.app/p/hw/${publicUUID}`;
    
    container.classList.remove('hidden');
    document.getElementById('homeworkForm').reset();
}

function copyLink() {
    const link = document.getElementById('hwShareLink').textContent;
    navigator.clipboard.writeText(link);
    alert("Shareable link copied to clipboard!");
}
