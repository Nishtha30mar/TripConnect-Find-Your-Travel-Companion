// =====================================================
// ADMIN CONFIG
// =====================================================
const API_BASE = "http://localhost:5000/api/admin";
const API_MAIN = "http://localhost:5000/api";

// Store all data for filtering
let allUsers = [];
let allPackages = [];
let allAIGroups = [];
let allSelfGroups = []; // Store self groups data from backend
let currentSelfGroupTab = "pending";

// =====================================================
// MOCK DATA FOR PAYMENTS - Only 5 Destinations, No Hotels
// =====================================================
const MOCK_PAYMENTS = [
    { payment_id: "PAY-1001", user_name: "Rahul Sharma", trip_name: "Goa Beach Explorer", amount: 12500, status: "confirmed", mode: "UPI", date: "2026-03-20", destination: "Goa" },
    { payment_id: "PAY-1002", user_name: "Priya Verma", trip_name: "Jaipur Royal Heritage", amount: 18900, status: "confirmed", mode: "Card", date: "2026-03-21", destination: "Jaipur" },
    { payment_id: "PAY-1003", user_name: "Amit Singh", trip_name: "Manali Adventure Trek", amount: 22500, status: "pending", mode: "NetBanking", date: "2026-03-22", destination: "Manali" },
    { payment_id: "PAY-1004", user_name: "Neha Gupta", trip_name: "Rishikesh Yoga Retreat", amount: 9900, status: "confirmed", mode: "UPI", date: "2026-03-23", destination: "Rishikesh" },
    { payment_id: "PAY-1005", user_name: "Vikram Mehta", trip_name: "Ayodhya Spiritual Tour", amount: 14500, status: "cancelled", mode: "Card", date: "2026-03-19", destination: "Ayodhya" },
    { payment_id: "PAY-1006", user_name: "Kavita Reddy", trip_name: "Goa Sunset Cruise", amount: 15800, status: "confirmed", mode: "UPI", date: "2026-03-24", destination: "Goa" },
    { payment_id: "PAY-1007", user_name: "Suresh Nair", trip_name: "Jaipur Forts Tour", amount: 12500, status: "pending", mode: "Wallet", date: "2026-03-22", destination: "Jaipur" },
    { payment_id: "PAY-1008", user_name: "Anjali Sharma", trip_name: "Manali Snow Points", amount: 19800, status: "confirmed", mode: "Card", date: "2026-03-25", destination: "Manali" },
    { payment_id: "PAY-1009", user_name: "Rohit Mehta", trip_name: "Rishikesh River Rafting", amount: 8500, status: "pending", mode: "UPI", date: "2026-03-25", destination: "Rishikesh" },
    { payment_id: "PAY-1010", user_name: "Sneha Reddy", trip_name: "Ayodhya Ram Mandir Darshan", amount: 11200, status: "confirmed", mode: "NetBanking", date: "2026-03-26", destination: "Ayodhya" },
    { payment_id: "PAY-1011", user_name: "Manish Kumar", trip_name: "Goa Beach Hopping", amount: 13500, status: "confirmed", mode: "UPI", date: "2026-03-27", destination: "Goa" },
    { payment_id: "PAY-1012", user_name: "Divya Sharma", trip_name: "Jaipur Shopping Tour", amount: 8900, status: "confirmed", mode: "Card", date: "2026-03-27", destination: "Jaipur" },
    { payment_id: "PAY-1013", user_name: "Arjun Singh", trip_name: "Manali Solang Valley", amount: 21500, status: "pending", mode: "NetBanking", date: "2026-03-28", destination: "Manali" },
    { payment_id: "PAY-1014", user_name: "Pooja Verma", trip_name: "Rishikesh Camping", amount: 7500, status: "confirmed", mode: "UPI", date: "2026-03-28", destination: "Rishikesh" },
    { payment_id: "PAY-1015", user_name: "Rajesh Khanna", trip_name: "Ayodhya Heritage Walk", amount: 9800, status: "cancelled", mode: "Card", date: "2026-03-26", destination: "Ayodhya" }
];

// =====================================================
// MOCK DATA FOR NOTIFICATIONS - Only 5 Destinations, No Hotels
// =====================================================
let MOCK_NOTIFICATIONS = [
    { id: 1, created_at: "2026-03-28T10:30:00", type: "cancellation", message: "Trip 'Ayodhya Spiritual Tour' cancelled by Vikram. Refund of ₹14,500 initiated.", read: false, destination: "Ayodhya" },
    { id: 2, created_at: "2026-03-28T09:15:00", type: "payment", message: "Payment ₹12,500 confirmed for Goa Beach Explorer by Rahul.", read: false, destination: "Goa" },
    { id: 3, created_at: "2026-03-27T18:45:00", type: "cancellation", message: "Trip 'Jaipur Royal Heritage' cancelled by user due to date conflict.", read: true, destination: "Jaipur" },
    { id: 4, created_at: "2026-03-27T14:20:00", type: "enquiry", message: "New enquiry: Custom Manali group package requested for 8 people.", read: false, destination: "Manali" },
    { id: 5, created_at: "2026-03-26T22:10:00", type: "payment", message: "Payment ₹15,800 confirmed for Goa Sunset Cruise by Kavita.", read: true, destination: "Goa" },
    { id: 6, created_at: "2026-03-26T11:05:00", type: "payment", message: "Payment pending reminder sent for Jaipur Forts Tour (₹12,500).", read: false, destination: "Jaipur" },
    { id: 7, created_at: "2026-03-25T08:30:00", type: "enquiry", message: "Group of 6 enquires about Rishikesh River Rafting with custom itinerary.", read: false, destination: "Rishikesh" },
    { id: 8, created_at: "2026-03-25T16:20:00", type: "payment", message: "Payment ₹9,900 confirmed for Rishikesh Yoga Retreat by Neha.", read: true, destination: "Rishikesh" },
    { id: 9, created_at: "2026-03-24T12:45:00", type: "cancellation", message: "Trip cancellation request for Manali Adventure Trek by user Amit.", read: false, destination: "Manali" },
    { id: 10, created_at: "2026-03-24T09:30:00", type: "enquiry", message: "New enquiry: Custom Ayodhya tour for 12 people requested.", read: false, destination: "Ayodhya" },
    { id: 11, created_at: "2026-03-23T15:20:00", type: "payment", message: "Payment ₹19,800 confirmed for Manali Snow Points by Anjali.", read: true, destination: "Manali" },
    { id: 12, created_at: "2026-03-23T11:45:00", type: "enquiry", message: "Family of 5 enquires about Goa Beach Hopping package.", read: false, destination: "Goa" },
    { id: 13, created_at: "2026-03-22T09:00:00", type: "payment", message: "Payment ₹11,200 confirmed for Ayodhya Ram Mandir Darshan by Sneha.", read: true, destination: "Ayodhya" },
    { id: 14, created_at: "2026-03-21T17:30:00", type: "cancellation", message: "Trip 'Jaipur Shopping Tour' cancelled by user, refund initiated.", read: false, destination: "Jaipur" },
    { id: 15, created_at: "2026-03-21T12:15:00", type: "enquiry", message: "Adventure group enquires about Rishikesh Camping package for 10 people.", read: false, destination: "Rishikesh" }
];

// =====================================================
// MOCK ITINERARY DATA FOR GROUPS - Only 5 Destinations, No Hotels
// =====================================================
const MOCK_ITINERARIES = {
    "Goa": [
        { day: 1, title: "Arrival in Goa", description: "Arrive at Goa airport, transfer to resort, beach walk at Calangute", activities: ["Beach walk", "Welcome dinner", "Local market visit"] },
        { day: 2, title: "North Goa Exploration", description: "Visit Baga Beach, Anjuna Flea Market, Fort Aguada", activities: ["Water sports", "Shopping", "Sightseeing", "Local cuisine tasting"] },
        { day: 3, title: "South Goa & Relaxation", description: "Palolem Beach, Boat cruise on Mandovi river", activities: ["Sunset cruise", "Beach relaxation", "Photography"] },
        { day: 4, title: "Departure", description: "Free time for shopping, transfer to airport", activities: ["Breakfast", "Souvenir shopping", "Airport transfer"] }
    ],
    "Jaipur": [
        { day: 1, title: "Arrival in Jaipur", description: "Arrive at Jaipur, check-in, visit City Palace and Hawa Mahal", activities: ["Palace tour", "Photography", "Local market visit"] },
        { day: 2, title: "Amer Fort & Heritage", description: "Elephant ride at Amer Fort, visit Jal Mahal", activities: ["Fort exploration", "Cultural show", "Traditional lunch"] },
        { day: 3, title: "Local Bazaars & Crafts", description: "Explore Johari Bazaar, Bapu Bazaar, block printing workshops", activities: ["Shopping", "Handicraft demo", "Street food tasting"] },
        { day: 4, title: "Departure", description: "Visit to Albert Hall Museum, departure", activities: ["Museum visit", "Breakfast", "Airport transfer"] }
    ],
    "Manali": [
        { day: 1, title: "Manali Arrival", description: "Arrive at Manali, check-in, local sightseeing, Hadimba Temple", activities: ["Temple visit", "Mall road walk", "Café hopping"] },
        { day: 2, title: "Solang Valley", description: "Adventure activities, snow sports in winter", activities: ["Paragliding", "Zorbing", "Snow scooter", "Photography"] },
        { day: 3, title: "Rohtang Pass", description: "Snow activities, scenic views of mountains", activities: ["Snow play", "Mountain views", "Bonfire evening"] },
        { day: 4, title: "Departure", description: "Visit Vashisht Hot Springs, departure", activities: ["Hot springs", "Breakfast", "Local shopping"] }
    ],
    "Rishikesh": [
        { day: 1, title: "Arrival in Rishikesh", description: "Arrive at Rishikesh, check-in, evening Ganga Aarti at Triveni Ghat", activities: ["Ganga Aarti", "Ashram visit", "Evening walk"] },
        { day: 2, title: "River Rafting & Adventure", description: "White water rafting on Ganges, cliff jumping", activities: ["River rafting", "Cliff jumping", "Beach campfire"] },
        { day: 3, title: "Yoga & Spiritual Tour", description: "Morning yoga session, visit Beatles Ashram, Neelkanth Mahadev", activities: ["Yoga class", "Meditation", "Temple visit"] },
        { day: 4, title: "Departure", description: "Shopping at Laxman Jhula, departure", activities: ["Bridge walk", "Souvenir shopping", "Breakfast"] }
    ],
    "Ayodhya": [
        { day: 1, title: "Arrival in Ayodhya", description: "Arrive at Ayodhya, check-in, evening Sarayu River Aarti", activities: ["River Aarti", "Temple visit", "Spiritual walk"] },
        { day: 2, title: "Ram Janmabhoomi & Temples", description: "Visit Ram Janmabhoomi, Hanuman Garhi, Kanak Bhawan", activities: ["Temple darshan", "Puja rituals", "Prasad distribution"] },
        { day: 3, title: "Religious Sites", description: "Visit Saryu Ghat, Guptar Ghat, local pilgrimage sites", activities: ["Ghat visit", "Boat ride", "Spiritual discourse"] },
        { day: 4, title: "Departure", description: "Morning prayers, local shopping, departure", activities: ["Morning puja", "Sweet shop visit", "Airport transfer"] }
    ]
};

// =====================================================
// INITIAL LOAD
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
    console.log('📊 Admin dashboard loaded');

    // Load all data
    refreshUsers();
    refreshPackages();
    refreshTrips();
    refreshAIGroups();
    refreshSelfGroups(); // Load self groups from backend
    refreshPayments();
    refreshNotifications();

    // Add search and filter listeners for users
    const userSearch = document.getElementById("userSearch");
    if (userSearch) {
        userSearch.addEventListener("input", filterUsers);
    }

    const userStatusFilter = document.getElementById("userStatusFilter");
    if (userStatusFilter) {
        userStatusFilter.addEventListener("change", filterUsers);
    }

    // Add search and filter listeners for packages
    const packageSearch = document.getElementById("packageSearch");
    if (packageSearch) {
        packageSearch.addEventListener("input", filterPackages);
    }

    const packageStatusFilter = document.getElementById("packageStatusFilter");
    if (packageStatusFilter) {
        packageStatusFilter.addEventListener("change", filterPackages);
    }

    // Add search for groups
    const groupSearch = document.getElementById("groupSearch");
    if (groupSearch) {
        groupSearch.addEventListener("input", filterAIGroups);
    }

    // Add self group search listener
    const selfGroupSearch = document.getElementById("selfGroupSearch");
    if (selfGroupSearch) {
        selfGroupSearch.addEventListener("input", filterSelfGroups);
    }

    const selfGroupPackageFilter = document.getElementById("selfGroupPackageFilter");
    if (selfGroupPackageFilter) {
        selfGroupPackageFilter.addEventListener("change", filterSelfGroups);
    }

    // Add payment filters
    const paymentSearch = document.getElementById("paymentSearch");
    if (paymentSearch) {
        paymentSearch.addEventListener("input", () => refreshPayments());
    }

    const paymentStatusFilter = document.getElementById("paymentStatusFilter");
    if (paymentStatusFilter) {
        paymentStatusFilter.addEventListener("change", () => refreshPayments());
    }

    // Add notification filters
    const notificationTypeFilter = document.getElementById("notificationTypeFilter");
    if (notificationTypeFilter) {
        notificationTypeFilter.addEventListener("change", () => refreshNotifications());
    }

    const notificationReadFilter = document.getElementById("notificationReadFilter");
    if (notificationReadFilter) {
        notificationReadFilter.addEventListener("change", () => refreshNotifications());
    }
});

// =====================================================
// SECTION NAVIGATION
// =====================================================
function showSection(section) {
    // Hide all sections
    const usersSec = document.getElementById('users-section');
    const packagesSec = document.getElementById('packages-section');
    const groupsSec = document.getElementById('groups-section');
    const selfGroupsSec = document.getElementById('self-groups-section');
    const paymentsSec = document.getElementById('payments-section');
    const notificationsSec = document.getElementById('notifications-section');

    if (usersSec) usersSec.style.display = 'none';
    if (packagesSec) packagesSec.style.display = 'none';
    if (groupsSec) groupsSec.style.display = 'none';
    if (selfGroupsSec) selfGroupsSec.style.display = 'none';
    if (paymentsSec) paymentsSec.style.display = 'none';
    if (notificationsSec) notificationsSec.style.display = 'none';

    // Show selected section
    const targetSec = document.getElementById(`${section}-section`);
    if (targetSec) targetSec.style.display = 'block';

    // Update active nav link
    const navLinks = document.querySelectorAll('.nav-link');
    for (let i = 0; i < navLinks.length; i++) {
        navLinks[i].classList.remove('active');
    }
    if (window.event && window.event.target) {
        const link = window.event.target.closest('.nav-link');
        if (link) link.classList.add('active');
    }
}

// =====================================================
// FETCH ALL USERS
// =====================================================
async function refreshUsers() {
    const tbody = document.getElementById("userTableBody");
    if (!tbody) return;

    tbody.innerHTML = `<tr class="placeholder-row"><td colspan="8"><i class="fas fa-spinner fa-spin"></i> Loading users...<\/td><\/tr>`;

    console.log('🔄 Fetching users...');

    try {
        let response = await fetch(`${API_BASE}/users`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Success from /api/admin/users:', data);

        let users = [];

        if (data.success && data.users) {
            users = data.users;
        } else if (Array.isArray(data)) {
            users = data;
        } else if (data.data && Array.isArray(data.data)) {
            users = data.data;
        } else {
            for (let key in data) {
                if (Array.isArray(data[key])) {
                    users = data[key];
                    break;
                }
            }
        }

        console.log(`📊 Found ${users.length} users:`, users);

        allUsers = users;
        displayUsers(users);
        updateUserCounters(users);
        updateMetricUsers(users.length);

    } catch (err) {
        console.error("❌ Error loading users:", err);

        try {
            console.log('Trying fallback endpoint: /api/direct-users');
            const fallbackResponse = await fetch('http://localhost:5000/api/direct-users');
            const fallbackData = await fallbackResponse.json();

            if (fallbackData.success && fallbackData.data) {
                const users = fallbackData.data;
                console.log(`✅ Found ${users.length} users from fallback`);

                allUsers = users;
                displayUsers(users);
                updateUserCounters(users);
                updateMetricUsers(users.length);
                return;
            }
        } catch (fallbackErr) {
            console.error("❌ Fallback also failed:", fallbackErr);
        }

        if (tbody) {
            tbody.innerHTML = `
                <tr class="placeholder-row">
                    <td colspan="8">
                        Error loading users. 
                        <button onclick="refreshUsers()" class="btn btn-xs">Retry</button>
                        <button onclick="debugBackend()" class="btn btn-xs">Debug</button>
                    <\/td>
                <\/tr>
            `;
        }
        showNotification("Failed to load users. Check console for details.", "error");
    }
}

// =====================================================
// DISPLAY USERS IN TABLE (Edit option removed)
// =====================================================
function displayUsers(users) {
    const tbody = document.getElementById("userTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!users || users.length === 0) {
        tbody.innerHTML = `
            <tr class="placeholder-row">
                <td colspan="8">No users available<\/td>
            <\/tr>
        `;
        return;
    }

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const tr = document.createElement("tr");

        const userId = user.user_id || user.id || '-';
        const name = user.name || user.full_name || '-';
        const email = user.email || '-';
        const phone = user.phone_number || user.phone || user.mobile || '-';
        const gender = user.gender || '-';
        const location = user.location || '-';
        const status = user.status || 'pending';

        const displayId = String(userId).length > 8 ?
            String(userId).substring(0, 8) + '...' :
            userId;

        tr.innerHTML = `
            <td><span title="${userId}">${displayId}</span><\/td>
            <td>${escapeHtml(name)}<\/td>
            <td>${escapeHtml(email)}<\/td>
            <td>${escapeHtml(phone)}<\/td>
            <td>${escapeHtml(gender)}<\/td>
            <td>${escapeHtml(location)}<\/td>
            <td><span class="status-badge ${status}">${status}<\/span><\/td>
            <td>
                <div class="btn-action-group">
                    <button class="btn btn-xs btn-success" onclick="viewUser('${userId}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-xs btn-danger" onclick="deleteUser('${userId}')" title="Delete User">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            <\/td>
        `;

        tbody.appendChild(tr);
    }
}

function escapeHtml(text) {
    if (!text) return '-';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =====================================================
// FILTER USERS
// =====================================================
function filterUsers() {
    const searchInput = document.getElementById("userSearch");
    const statusSelect = document.getElementById("userStatusFilter");

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    const statusFilter = statusSelect ? statusSelect.value : "all";

    const filtered = allUsers.filter(function(user) {
        let matchesSearch = false;
        if (user.name && user.name.toLowerCase().includes(searchTerm)) matchesSearch = true;
        else if (user.email && user.email.toLowerCase().includes(searchTerm)) matchesSearch = true;
        else if (user.phone_number && user.phone_number.includes(searchTerm)) matchesSearch = true;
        else if (user.user_id && String(user.user_id).toLowerCase().includes(searchTerm)) matchesSearch = true;
        else if (user.location && user.location.toLowerCase().includes(searchTerm)) matchesSearch = true;

        const matchesStatus = statusFilter === "all" || user.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    displayUsers(filtered);
    updateUserCounters(filtered);
}

// =====================================================
// UPDATE USER COUNTERS
// =====================================================
function updateUserCounters(users) {
    let total = users.length;
    let active = 0;
    let suspended = 0;
    let pending = 0;

    for (let i = 0; i < users.length; i++) {
        const u = users[i];
        if (u.status === "active") active++;
        else if (u.status === "suspended") suspended++;
        else if (u.status === "pending") pending++;
    }

    const totalEl = document.getElementById("totalUsers");
    const activeEl = document.getElementById("activeUsers");
    const suspendedEl = document.getElementById("suspendedUsers");
    const pendingEl = document.getElementById("pendingUsers");

    if (totalEl) totalEl.innerText = total;
    if (activeEl) activeEl.innerText = active;
    if (suspendedEl) suspendedEl.innerText = suspended;
    if (pendingEl) pendingEl.innerText = pending;
}

function updateMetricUsers(count) {
    const metricUsersEl = document.getElementById("metricUsers");
    if (metricUsersEl) metricUsersEl.innerText = count;
}

// =====================================================
// VIEW USER DETAILS
// =====================================================
async function viewUser(userId) {
    try {
        const response = await fetch(API_BASE + '/users/' + userId);
        if (!response.ok) throw new Error("Failed to fetch user");

        const data = await response.json();
        const user = data.user || data;

        const container = document.getElementById("userDetails");
        if (!container) return;

        let dob = "-";
        if (user.dob) {
            try {
                const date = new Date(user.dob);
                dob = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch (e) {
                dob = user.dob;
            }
        }

        container.innerHTML = `
            <div class="user-detail full-width">
                <strong>User ID:</strong> ${user.user_id || user.id || '-'}
            </div>
            <div class="user-detail">
                <strong>Name:</strong> ${escapeHtml(user.name) || '-'}
            </div>
            <div class="user-detail">
                <strong>Email:</strong> ${escapeHtml(user.email) || '-'}
            </div>
            <div class="user-detail">
                <strong>Phone:</strong> ${escapeHtml(user.phone_number || user.phone) || '-'}
            </div>
            <div class="user-detail">
                <strong>Date of Birth:</strong> ${dob}
            </div>
            <div class="user-detail">
                <strong>Gender:</strong> ${escapeHtml(user.gender) || '-'}
            </div>
            <div class="user-detail">
                <strong>Location:</strong> ${escapeHtml(user.location) || '-'}
            </div>
            <div class="user-detail">
                <strong>Status:</strong>
                <span class="status-badge ${user.status || 'pending'}">${user.status || 'pending'}</span>
            </div>
            <div class="user-detail full-width">
                <strong>Bio:</strong> ${escapeHtml(user.bio) || '-'}
            </div>
        `;

        const modal = document.getElementById("viewUserModal");
        if (modal) modal.classList.add("active");

    } catch (err) {
        console.error("Error viewing user:", err);
        showNotification("Failed to load user details", "error");
    }
}

function closeViewUserModal() {
    const modal = document.getElementById("viewUserModal");
    if (modal) modal.classList.remove("active");
}

// =====================================================
// DELETE USER
// =====================================================
async function deleteUser(userId) {
    const confirmDelete = confirm("Are you sure you want to delete this user? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
        const response = await fetch(API_BASE + '/users/' + userId, {
            method: "DELETE"
        });

        if (response.ok) {
            refreshUsers();
            showNotification("User deleted successfully", "success");
        } else {
            throw new Error("Delete failed");
        }

    } catch (err) {
        console.error("Error deleting user:", err);
        showNotification("Failed to delete user", "error");
    }
}

// =====================================================
// PACKAGES MANAGEMENT (Remains unchanged)
// =====================================================

async function refreshPackages() {
    const tbody = document.getElementById("packageTableBody");
    if (!tbody) return;

    tbody.innerHTML = `<tr class="placeholder-row"><td colspan="7"><i class="fas fa-spinner fa-spin"></i> Loading packages...<\/td><\/tr>`;

    console.log('🔄 Fetching packages...');

    try {
        const statusFilterElement = document.getElementById("packageStatusFilter");
        const searchTermElement = document.getElementById("packageSearch");

        const statusFilter = statusFilterElement ? statusFilterElement.value : 'all';
        const searchTerm = searchTermElement ? searchTermElement.value : '';

        let url = `${API_BASE}/packages`;
        const params = new URLSearchParams();
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (searchTerm) params.append('search', searchTerm);

        const queryString = params.toString();
        if (queryString) url += '?' + queryString;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Success fetching packages:', data);

        let packages = [];
        if (data.success && data.packages) {
            packages = data.packages;
        } else if (Array.isArray(data)) {
            packages = data;
        } else if (data.data && Array.isArray(data.data)) {
            packages = data.data;
        }

        console.log(`📊 Found ${packages.length} packages:`, packages);

        allPackages = packages;
        displayPackages(packages);
        updatePackageCounters(packages);

    } catch (err) {
        console.error("❌ Error loading packages:", err);

        tbody.innerHTML = `
            <tr class="placeholder-row">
                <td colspan="7">
                    Error loading packages. 
                    <button onclick="refreshPackages()" class="btn btn-xs">Retry</button>
                <\/td>
            <\/tr>
        `;
        showNotification("Failed to load packages", "error");
    }
}

function displayPackages(packages) {
    const tbody = document.getElementById("packageTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!packages || packages.length === 0) {
        tbody.innerHTML = `
            <tr class="placeholder-row">
                <td colspan="7">No packages available<\/td>
            <\/tr>
        `;
        return;
    }

    for (let i = 0; i < packages.length; i++) {
        const pkg = packages[i];
        const tr = document.createElement("tr");

        const packageId = pkg.package_id || pkg.id || '-';
        const title = pkg.title || '-';
        const destination = pkg.destination || '-';
        const duration = pkg.duration_days ? pkg.duration_days + ' days' : '-';
        const price = pkg.price_per_person || 0;
        const status = pkg.is_active == 1 ? 'active' : 'inactive';

        tr.innerHTML = `
            <td>${packageId}<\/td>
            <td>${escapeHtml(title)}<\/td>
            <td>${escapeHtml(destination)}<\/td>
            <td>${duration}<\/td>
            <td>₹${Number(price).toLocaleString()}<\/td>
            <td><span class="status-badge ${status}">${status}<\/span><\/td>
            <td>
                <div class="btn-action-group">
                    <button class="btn btn-xs btn-success" onclick="viewPackage('${packageId}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-xs btn-warning" onclick="openEditPackage('${packageId}')" title="Edit Package">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-xs btn-danger" onclick="deletePackage('${packageId}')" title="Delete Package">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-xs ${pkg.is_active == 1 ? 'btn-warning' : 'btn-success'}" 
                            onclick="togglePackageStatus('${packageId}', ${pkg.is_active == 1 ? 0 : 1})" 
                            title="${pkg.is_active == 1 ? 'Deactivate' : 'Activate'}">
                        <i class="fas ${pkg.is_active == 1 ? 'fa-ban' : 'fa-check'}"></i>
                    </button>
                </div>
            <\/td>
        `;

        tbody.appendChild(tr);
    }
}

function filterPackages() {
    const searchInput = document.getElementById("packageSearch");
    const statusSelect = document.getElementById("packageStatusFilter");

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    const statusFilter = statusSelect ? statusSelect.value : "all";

    const filtered = allPackages.filter(pkg => {
        let matchesSearch = false;
        if (pkg.title && pkg.title.toLowerCase().includes(searchTerm)) matchesSearch = true;
        else if (pkg.destination && pkg.destination.toLowerCase().includes(searchTerm)) matchesSearch = true;
        else if (pkg.description && pkg.description.toLowerCase().includes(searchTerm)) matchesSearch = true;

        const pkgStatus = pkg.is_active == 1 ? 'active' : 'inactive';
        const matchesStatus = statusFilter === "all" || pkgStatus === statusFilter;

        return matchesSearch && matchesStatus;
    });

    displayPackages(filtered);
    updatePackageCounters(filtered);
}

function updatePackageCounters(packages) {
    let total = packages.length;
    let active = 0;

    for (let i = 0; i < packages.length; i++) {
        if (packages[i].is_active == 1) active++;
    }

    const totalEl = document.getElementById("totalPackages");
    const activeEl = document.getElementById("activePackages");

    if (totalEl) totalEl.innerText = total;
    if (activeEl) activeEl.innerText = active;
}

async function viewPackage(packageId) {
    try {
        const response = await fetch(`${API_BASE}/packages/${packageId}`);
        if (!response.ok) throw new Error("Failed to fetch package");

        const data = await response.json();
        const pkg = data.package || data;

        const detailsHtml = `
            <div style="padding: 20px;">
                <h3 style="color: #f97316; margin-bottom: 15px;">${escapeHtml(pkg.title)}</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div><strong>Package ID:</strong> ${pkg.package_id}</div>
                    <div><strong>Destination:</strong> ${escapeHtml(pkg.destination)}</div>
                    <div><strong>Duration:</strong> ${pkg.duration_days ? pkg.duration_days + ' days' : '-'}</div>
                    <div><strong>Price per person:</strong> ₹${Number(pkg.price_per_person).toLocaleString()}</div>
                    <div><strong>Min Travellers:</strong> ${pkg.min_travellers || 1}</div>
                    <div><strong>Max Travellers:</strong> ${pkg.max_travellers || 10}</div>
                    <div><strong>Status:</strong> <span class="status-badge ${pkg.is_active == 1 ? 'active' : 'inactive'}">${pkg.is_active == 1 ? 'Active' : 'Inactive'}</span></div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong>Description:</strong>
                    <p style="margin-top: 5px; color: #e5e7eb;">${escapeHtml(pkg.description) || '-'}</p>
                </div>
                
                ${pkg.included_features ? `
                <div style="margin-bottom: 15px;">
                    <strong>Included Features:</strong>
                    <p style="margin-top: 5px; color: #e5e7eb;">${escapeHtml(pkg.included_features)}</p>
                </div>
                ` : ''}
                
                ${pkg.details ? `
                <div>
                    <strong>Additional Details:</strong>
                    <p style="margin-top: 5px; color: #e5e7eb;">${escapeHtml(pkg.details)}</p>
                </div>
                ` : ''}
            </div>
        `;

        const modal = document.createElement('div');
        modal.className = 'modal-backdrop active';
        modal.innerHTML = `
            <div class="modal" style="max-width: 600px;">
                <div class="modal-header">
                    <div class="modal-title">Package Details</div>
                    <span class="modal-close" onclick="this.closest('.modal-backdrop').remove()">&times;</span>
                </div>
                ${detailsHtml}
            </div>
        `;
        document.body.appendChild(modal);

    } catch (err) {
        console.error("Error viewing package:", err);
        showNotification("Failed to load package details", "error");
    }
}

function openAddPackageModal() {
    const modal = document.getElementById("addPackageModal");
    if (modal) {
        const form = document.getElementById("addPackageForm");
        if (form) form.reset();
        modal.classList.add("active");
    }
}

function closeAddPackageModal() {
    const modal = document.getElementById("addPackageModal");
    if (modal) modal.classList.remove("active");
}

const addPackageForm = document.getElementById("addPackageForm");
if (addPackageForm) {
    addPackageForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const packageData = {
            title: formData.get("title"),
            destination: formData.get("destination"),
            description: formData.get("description") || null,
            price_per_person: parseInt(formData.get("price")) || 0,
            duration_days: parseInt(formData.get("duration")) || null,
            min_travellers: parseInt(formData.get("min_travellers")) || 1,
            max_travellers: parseInt(formData.get("max_travellers")) || 10,
            included_features: formData.get("included_features") || null,
            image_url: formData.get("image_url") || null,
            is_active: formData.get("status") === "active" ? 1 : 0,
            details: formData.get("details") || null
        };

        try {
            const response = await fetch(API_BASE + '/packages', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(packageData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                closeAddPackageModal();
                refreshPackages();
                showNotification("Package added successfully", "success");
            } else {
                throw new Error(data.message || "Add failed");
            }

        } catch (err) {
            console.error("Error adding package:", err);
            showNotification("Failed to add package: " + err.message, "error");
        }
    });
}

async function openEditPackage(packageId) {
    try {
        const response = await fetch(`${API_BASE}/packages/${packageId}`);
        if (!response.ok) throw new Error("Failed to fetch package");

        const data = await response.json();
        const pkg = data.package || data;

        const editPackageId = document.getElementById("editPackageId");
        const editPackageTitle = document.getElementById("editPackageTitle");
        const editPackageDestination = document.getElementById("editPackageDestination");
        const editPackageDuration = document.getElementById("editPackageDuration");
        const editPackagePrice = document.getElementById("editPackagePrice");
        const editPackageStatus = document.getElementById("editPackageStatus");
        const editPackageDescription = document.getElementById("editPackageDescription");
        const editPackageMinTravellers = document.getElementById("editPackageMinTravellers");
        const editPackageMaxTravellers = document.getElementById("editPackageMaxTravellers");
        const editPackageIncludedFeatures = document.getElementById("editPackageIncludedFeatures");
        const editPackageImageUrl = document.getElementById("editPackageImageUrl");

        if (editPackageId) editPackageId.value = pkg.package_id;
        if (editPackageTitle) editPackageTitle.value = pkg.title || '';
        if (editPackageDestination) editPackageDestination.value = pkg.destination || '';
        if (editPackageDuration) editPackageDuration.value = pkg.duration_days || '';
        if (editPackagePrice) editPackagePrice.value = pkg.price_per_person || '';
        if (editPackageStatus) editPackageStatus.value = pkg.is_active == 1 ? 'active' : 'inactive';
        if (editPackageDescription) editPackageDescription.value = pkg.description || '';
        if (editPackageMinTravellers) editPackageMinTravellers.value = pkg.min_travellers || 1;
        if (editPackageMaxTravellers) editPackageMaxTravellers.value = pkg.max_travellers || 10;
        if (editPackageIncludedFeatures) editPackageIncludedFeatures.value = pkg.included_features || '';
        if (editPackageImageUrl) editPackageImageUrl.value = pkg.image_url || '';

        const modal = document.getElementById("editPackageModal");
        if (modal) modal.classList.add("active");

    } catch (err) {
        console.error("Error loading package for edit:", err);
        showNotification("Failed to load package data", "error");
    }
}

function closeEditPackageModal() {
    const modal = document.getElementById("editPackageModal");
    if (modal) modal.classList.remove("active");
}

const editPackageForm = document.getElementById("editPackageForm");
if (editPackageForm) {
    editPackageForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const packageIdElement = document.getElementById("editPackageId");
        const packageId = packageIdElement ? packageIdElement.value : '';
        
        if (!packageId) return;

        const packageData = {
            title: document.getElementById("editPackageTitle") ? document.getElementById("editPackageTitle").value || '' : '',
            destination: document.getElementById("editPackageDestination") ? document.getElementById("editPackageDestination").value || '' : '',
            description: document.getElementById("editPackageDescription") ? document.getElementById("editPackageDescription").value || null : null,
            price_per_person: parseInt(document.getElementById("editPackagePrice") ? document.getElementById("editPackagePrice").value : 0) || 0,
            duration_days: parseInt(document.getElementById("editPackageDuration") ? document.getElementById("editPackageDuration").value : null) || null,
            min_travellers: parseInt(document.getElementById("editPackageMinTravellers") ? document.getElementById("editPackageMinTravellers").value : 1) || 1,
            max_travellers: parseInt(document.getElementById("editPackageMaxTravellers") ? document.getElementById("editPackageMaxTravellers").value : 10) || 10,
            included_features: document.getElementById("editPackageIncludedFeatures") ? document.getElementById("editPackageIncludedFeatures").value || null : null,
            image_url: document.getElementById("editPackageImageUrl") ? document.getElementById("editPackageImageUrl").value || null : null,
            is_active: document.getElementById("editPackageStatus") && document.getElementById("editPackageStatus").value === "active" ? 1 : 0
        };

        try {
            const response = await fetch(`${API_BASE}/packages/${packageId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(packageData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                closeEditPackageModal();
                refreshPackages();
                showNotification("Package updated successfully", "success");
            } else {
                throw new Error(data.message || "Update failed");
            }

        } catch (err) {
            console.error("Error updating package:", err);
            showNotification("Failed to update package: " + err.message, "error");
        }
    });
}

async function deletePackage(packageId) {
    const confirmDelete = confirm("Are you sure you want to delete this package? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
        const response = await fetch(`${API_BASE}/packages/${packageId}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (response.ok && data.success) {
            refreshPackages();
            showNotification("Package deleted successfully", "success");
        } else {
            throw new Error(data.message || "Delete failed");
        }

    } catch (err) {
        console.error("Error deleting package:", err);
        showNotification("Failed to delete package", "error");
    }
}

async function togglePackageStatus(packageId, newStatus) {
    const action = newStatus == 1 ? 'activate' : 'deactivate';
    const confirmAction = confirm(`Are you sure you want to ${action} this package?`);
    if (!confirmAction) return;

    try {
        const response = await fetch(`${API_BASE}/packages/${packageId}/toggle-status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_active: newStatus })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            refreshPackages();
            showNotification(`Package ${action}d successfully`, "success");
        } else {
            throw new Error(data.message || `Failed to ${action} package`);
        }

    } catch (err) {
        console.error(`Error toggling package status:`, err);
        showNotification(`Failed to ${action} package`, "error");
    }
}

// =====================================================
// TRIP MANAGEMENT
// =====================================================
async function refreshTrips() {
    try {
        const res = await fetch(API_BASE + '/trips');
        if (!res.ok) throw new Error("Failed to fetch trips");

        const trips = await res.json();
        
        // Count active trips for metric
        let active = 0;
        if (trips && trips.length > 0) {
            for (let i = 0; i < trips.length; i++) {
                if (trips[i].status === "active") active++;
            }
        }
        
        const metricTrips = document.getElementById("metricTrips");
        if (metricTrips) metricTrips.innerText = active;

    } catch (err) {
        console.error("Error loading trips:", err);
        const metricTrips = document.getElementById("metricTrips");
        if (metricTrips) metricTrips.innerText = "0";
    }
}

// =====================================================
// AI GROUP APPROVALS
// =====================================================

async function refreshAIGroups() {
    const tbody = document.getElementById("approvalTableBody");
    if (!tbody) return;

    tbody.innerHTML = `<tr class="placeholder-row"><td colspan="8"><i class="fas fa-spinner fa-spin"></i> Loading groups...<\/td><\/tr>`;

    try {
        const response = await fetch(`${API_BASE}/ai-groups/pending`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const groups = await response.json();
        console.log('✅ AI Groups loaded:', groups);

        allAIGroups = groups;
        displayAIGroups(groups);

        const pendingCount = groups.length;
        const pendingApprovalsEl = document.getElementById("pendingApprovals");
        if (pendingApprovalsEl) {
            pendingApprovalsEl.innerText = pendingCount;
        }

    } catch (err) {
        console.error("❌ Error loading AI groups:", err);
        
        if (tbody) {
            tbody.innerHTML = `
                <tr class="placeholder-row">
                    <td colspan="8">
                        Error loading groups. 
                        <button onclick="refreshAIGroups()" class="btn btn-xs">Retry</button>
                    <\/td>
                <\/tr>
            `;
        }
        showNotification("Failed to load groups", "error");
    }
}

function filterAIGroups() {
    const searchInput = document.getElementById("groupSearch");
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    
    const filtered = allAIGroups.filter(group => {
        if (group.group_name && group.group_name.toLowerCase().includes(searchTerm)) return true;
        if (group.destination && group.destination.toLowerCase().includes(searchTerm)) return true;
        if (group.group_id && String(group.group_id).includes(searchTerm)) return true;
        return false;
    });
    
    displayAIGroups(filtered);
}

function displayAIGroups(groups) {
    const tbody = document.getElementById("approvalTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!groups || groups.length === 0) {
        tbody.innerHTML = `
            <tr class="placeholder-row">
                <td colspan="8">No groups pending approval<\/td>
            <\/tr>
        `;
        return;
    }

    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const tr = document.createElement("tr");
        
        tr.innerHTML = `
            <td>${group.group_id}<\/td>
            <td>${escapeHtml(group.group_name)}<\/td>
            <td>${group.member_count || 0}<\/td>
            <td>${escapeHtml(group.destination)}<\/td>
            <td>${formatDate(group.start_date)}<\/td>
            <td>${group.match_score || 0}%<\/td>
            <td><span class="status-badge ${group.status}">${group.status}<\/span><\/td>
            <td>
                <div class="btn-action-group">
                    <button class="btn btn-xs btn-success" onclick="viewAIGroup('${group.group_id}')" title="View Details">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-xs btn-info" onclick="viewItinerary('${group.destination}')" title="View Itinerary">
                        <i class="fas fa-map-marked-alt"></i> Itinerary
                    </button>
                    <button class="btn btn-xs btn-danger" onclick="cancelAIGroup('${group.group_id}')" title="Cancel Group">
                        <i class="fas fa-ban"></i> Cancel
                    </button>
                </div>
            <\/td>
        `;
        
        tbody.appendChild(tr);
    }
}

async function viewAIGroup(groupId) {
    try {
        const response = await fetch(`${API_BASE}/ai-groups/${groupId}`);
        if (!response.ok) throw new Error("Failed to fetch group details");
        
        const group = await response.json();

        const container = document.getElementById("aiGroupDetails");
        if (!container) return;

        let membersHtml = '';
        if (group.members && group.members.length > 0) {
            let membersList = '';
            for (let i = 0; i < group.members.length; i++) {
                const member = group.members[i];
                membersList += `
                    <div class="member-item">
                        <span class="member-name">${escapeHtml(member.name)}</span>
                        <span class="member-details">
                            ${member.location || ''} ${member.gender ? `• ${member.gender}` : ''}
                        </span>
                    </div>
                `;
            }
            membersHtml = `<div class="members-list"><h4>Group Members (${group.members.length}):</h4>${membersList}</div>`;
        }

        container.innerHTML = `
            <div class="ai-group-detail"><strong>Group ID:</strong> ${group.group_id}</div>
            <div class="ai-group-detail"><strong>Group Name:</strong> ${escapeHtml(group.group_name)}</div>
            <div class="ai-group-detail"><strong>Destination:</strong> ${escapeHtml(group.destination)}</div>
            <div class="ai-group-detail"><strong>Start Date:</strong> ${formatDate(group.start_date)}</div>
            <div class="ai-group-detail"><strong>End Date:</strong> ${formatDate(group.end_date)}</div>
            <div class="ai-group-detail"><strong>Match Score:</strong> ${group.match_score || 0}%</div>
            <div class="ai-group-detail"><strong>Compatibility:</strong> ${group.compatibility || 'N/A'}</div>
            <div class="ai-group-detail"><strong>Status:</strong> <span class="status-badge ${group.status}">${group.status}</span></div>
            ${membersHtml}
        `;

        const modal = document.getElementById("viewAIGroupModal");
        if (modal) modal.classList.add("active");

    } catch (err) {
        console.error("Error viewing AI group:", err);
        showNotification("Failed to load group details", "error");
    }
}

function viewItinerary(destination) {
    // Get itinerary based on destination (case-insensitive)
    let itinerary = null;
    for (let key in MOCK_ITINERARIES) {
        if (destination.toLowerCase().includes(key.toLowerCase())) {
            itinerary = MOCK_ITINERARIES[key];
            break;
        }
    }
    
    // Default itinerary if not found
    if (!itinerary) {
        itinerary = [
            { day: 1, title: "Arrival", description: "Arrive at destination, check-in", activities: ["Welcome", "Rest"] },
            { day: 2, title: "Local Sightseeing", description: "Explore local attractions", activities: ["Sightseeing", "Photography"] },
            { day: 3, title: "Activities", description: "Enjoy planned activities", activities: ["Activities", "Entertainment"] },
            { day: 4, title: "Departure", description: "Check-out, depart from destination", activities: ["Breakfast", "Airport transfer"] }
        ];
    }
    
    let itineraryHtml = `
        <div style="padding: 20px;">
            <h3 style="color: #f97316; margin-bottom: 15px;">${escapeHtml(destination)} - Trip Itinerary</h3>
            <div class="itinerary-list">
    `;
    
    for (let i = 0; i < itinerary.length; i++) {
        const day = itinerary[i];
        itineraryHtml += `
            <div class="itinerary-day">
                <strong>Day ${day.day}: ${escapeHtml(day.title)}</strong>
                <p style="margin: 5px 0; color: #e5e7eb;">${escapeHtml(day.description)}</p>
                <div style="margin-top: 5px;">
                    <span style="color: #f97316; font-size: 12px;">Activities:</span>
                    <span style="color: #9ca3af; font-size: 12px;">${day.activities.map(a => escapeHtml(a)).join(' • ')}</span>
                </div>
            </div>
        `;
    }
    
    itineraryHtml += `
            </div>
            <div style="margin-top: 20px; padding: 10px; background: rgba(34, 197, 94, 0.1); border-radius: 8px;">
                <p style="color: #4ade80; font-size: 12px;">
                    <i class="fas fa-info-circle"></i> Note: This is a sample itinerary. Actual itinerary may vary based on group preferences.
                </p>
            </div>
        </div>
    `;
    
    const modal = document.getElementById("viewItineraryModal");
    const detailsContainer = document.getElementById("itineraryDetails");
    if (detailsContainer) {
        detailsContainer.innerHTML = itineraryHtml;
    }
    if (modal) modal.classList.add("active");
}

function closeViewItineraryModal() {
    const modal = document.getElementById("viewItineraryModal");
    if (modal) modal.classList.remove("active");
}

async function cancelAIGroup(groupId) {
    if (!confirm("Are you sure you want to cancel this group? This action cannot be undone.")) return;
    
    try {
        const response = await fetch(`${API_BASE}/ai-groups/${groupId}/reject`, { 
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showNotification("Group cancelled successfully", "success");
            refreshAIGroups();
        } else {
            throw new Error(data.message || "Cancellation failed");
        }
    } catch (err) {
        console.error("Error cancelling group:", err);
        showNotification("Failed to cancel group: " + err.message, "error");
    }
}

function closeViewAIGroupModal() {
    const modal = document.getElementById("viewAIGroupModal");
    if (modal) modal.classList.remove("active");
}

// =====================================================
// SELF GROUP APPROVAL - Destination column removed
// =====================================================

async function refreshSelfGroups() {
    console.log('🔄 Fetching self groups from backend...');
    
    const pendingBody = document.getElementById("selfGroupPendingBody");
    const processedBody = document.getElementById("selfGroupProcessedBody");
    
    if (pendingBody) {
        pendingBody.innerHTML = '<tr class="placeholder-row"><td colspan="7"><i class="fas fa-spinner fa-spin"></i> Loading self groups...<\/td><\/tr>';
    }
    if (processedBody) {
        processedBody.innerHTML = '<tr class="placeholder-row"><td colspan="8"><i class="fas fa-spinner fa-spin"></i> Loading self groups...<\/td><\/tr>';
    }
    
    try {
        const response = await fetch(`${API_BASE}/self-groups`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Self groups loaded from backend:', result);
        
        if (result.success && result.data) {
            allSelfGroups = result.data;
            
            // Update package filter dropdown with actual packages (renamed to Places)
            const packageFilter = document.getElementById("selfGroupPackageFilter");
            if (packageFilter && allPackages && allPackages.length > 0) {
                let packages = [{ package_id: "all", title: "All Places" }];
                for (let i = 0; i < allPackages.length; i++) {
                    packages.push({ 
                        package_id: allPackages[i].package_id, 
                        title: allPackages[i].title 
                    });
                }
                let optionsHtml = '';
                for (let i = 0; i < packages.length; i++) {
                    optionsHtml += `<option value="${packages[i].package_id}">${escapeHtml(packages[i].title)}</option>`;
                }
                packageFilter.innerHTML = optionsHtml;
            }
            
            filterSelfGroups();
        } else {
            throw new Error(result.message || 'Failed to load groups');
        }
        
    } catch (err) {
        console.error('❌ Error loading self groups:', err);
        showNotification('Failed to load self groups: ' + err.message, 'error');
        
        if (pendingBody) {
            pendingBody.innerHTML = `<tr class="placeholder-row"><td colspan="7">Error loading groups. <button onclick="refreshSelfGroups()" class="btn btn-xs">Retry</button><\/td><\/tr>`;
        }
        if (processedBody) {
            processedBody.innerHTML = `<tr class="placeholder-row"><td colspan="8">Error loading groups. <button onclick="refreshSelfGroups()" class="btn btn-xs">Retry</button><\/td><\/tr>`;
        }
    }
}

function filterSelfGroups() {
    const searchInput = document.getElementById("selfGroupSearch");
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    const packageFilterEl = document.getElementById("selfGroupPackageFilter");
    const packageFilter = packageFilterEl ? packageFilterEl.value : "all";
    
    let filtered = [...allSelfGroups];
    
    if (currentSelfGroupTab === "pending") {
        filtered = filtered.filter(g => g.status === "pending");
    } else {
        filtered = filtered.filter(g => g.status === "approved" || g.status === "rejected");
    }
    
    if (searchTerm) {
        filtered = filtered.filter(g => {
            return (g.group_name && g.group_name.toLowerCase().includes(searchTerm)) ||
                   (g.creator && g.creator.toLowerCase().includes(searchTerm));
        });
    }
    
    // Update counters
    const pendingCount = allSelfGroups.filter(g => g.status === "pending").length;
    const approvedCount = allSelfGroups.filter(g => g.status === "approved").length;
    const rejectedCount = allSelfGroups.filter(g => g.status === "rejected").length;
    
    const pendingEl = document.getElementById("pendingSelfGroups");
    const approvedEl = document.getElementById("approvedSelfGroups");
    const rejectedEl = document.getElementById("rejectedSelfGroups");
    
    if (pendingEl) pendingEl.innerText = pendingCount;
    if (approvedEl) approvedEl.innerText = approvedCount;
    if (rejectedEl) rejectedEl.innerText = rejectedCount;
    
    if (currentSelfGroupTab === "pending") {
        displaySelfGroupsPending(filtered);
    } else {
        displaySelfGroupsProcessed(filtered);
    }
}

// Display for pending self groups - Destination column removed
function displaySelfGroupsPending(groups) {
    const tbody = document.getElementById("selfGroupPendingBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (groups.length === 0) {
        tbody.innerHTML = '<tr class="placeholder-row"><td colspan="7">No pending self groups<\/td><\/tr>';
        return;
    }

    for (let i = 0; i < groups.length; i++) {
        const g = groups[i];
        const row = `
            <tr>
                <td>${escapeHtml(g.id)}<\/td>
                <td><strong>${escapeHtml(g.group_name)}<\/strong><\/td>
                <td>${escapeHtml(g.creator)}<\/td>
                <td>${escapeHtml(g.package_name || g.destination)}<\/td>
                <td>${g.member_count || 0}/${g.max_members || 10}<\/td>
                <td>${formatDate(g.travel_date)}<\/td>
                <td>
                    <div class="btn-action-group">
                        <button class="btn btn-xs btn-success" onclick="viewSelfGroup('${g.id}')" title="View Details">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-xs btn-info" onclick="viewItinerary('${g.destination}')" title="Itinerary">
                            <i class="fas fa-map-marked-alt"></i> Itinerary
                        </button>
                    </div>
                <\/td>
            <\/tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    }
}

// Display for processed self groups - Destination column removed
function displaySelfGroupsProcessed(groups) {
    const tbody = document.getElementById("selfGroupProcessedBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (groups.length === 0) {
        tbody.innerHTML = '<tr class="placeholder-row"><td colspan="8">No processed groups<\/td><\/tr>';
        return;
    }

    for (let i = 0; i < groups.length; i++) {
        const g = groups[i];
        const statusClass = g.status === "approved" ? "active" : "cancelled";
        const row = `
            <tr>
                <td>${escapeHtml(g.id)}<\/td>
                <td><strong>${escapeHtml(g.group_name)}<\/strong><\/td>
                <td>${escapeHtml(g.creator)}<\/td>
                <td>${escapeHtml(g.package_name || g.destination)}<\/td>
                <td>${g.member_count || 0}/${g.max_members || 10}<\/td>
                <td><span class="status-badge ${statusClass}">${g.status}<\/span><\/td>
                <td>${formatDate(g.processed_at)}<\/td>
                <td>
                    <div class="btn-action-group">
                        <button class="btn btn-xs btn-success" onclick="viewSelfGroup('${g.id}')" title="View Details">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-xs btn-info" onclick="viewItinerary('${g.destination}')" title="Itinerary">
                            <i class="fas fa-map-marked-alt"></i> Itinerary
                        </button>
                    </div>
                <\/td>
            <\/tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    }
}

function switchSelfGroupTab(tab) {
    currentSelfGroupTab = tab;

    const btns = document.querySelectorAll('.tab-btn');
    for (let i = 0; i < btns.length; i++) {
        if ((tab === 'pending' && i === 0) || (tab === 'processed' && i === 1)) {
            btns[i].classList.add('active');
        } else {
            btns[i].classList.remove('active');
        }
    }

    const pendingTab = document.getElementById("selfGroupPendingTab");
    const processedTab = document.getElementById("selfGroupProcessedTab");

    if (tab === "pending") {
        if (pendingTab) pendingTab.classList.add("active");
        if (processedTab) processedTab.classList.remove("active");
    } else {
        if (pendingTab) pendingTab.classList.remove("active");
        if (processedTab) processedTab.classList.add("active");
    }

    filterSelfGroups();
}

async function viewSelfGroup(groupId) {
    // Extract preference_id from groupId (format: SG-{preference_id})
    const preferenceId = groupId.replace('SG-', '');
    
    try {
        const response = await fetch(`${API_BASE}/self-groups/${preferenceId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch group details');
        }
        
        const result = await response.json();
        const group = result.data;
        
        let membersHtml = '';
        if (group.members && group.members.length > 0) {
            let membersList = '';
            for (let i = 0; i < group.members.length; i++) {
                const m = group.members[i];
                membersList += `<div class="member-item">
                    <span class="member-name">${escapeHtml(m.name)}</span>
                    <span class="member-details">Age: ${m.age || 'N/A'} • ${m.relationship || 'Member'}</span>
                </div>`;
            }
            membersHtml = `<div class="members-list"><h4>Group Members (${group.members.length}):</h4>${membersList}</div>`;
        }
        
        const container = document.getElementById("selfGroupDetails");
        if (container) {
            container.innerHTML = `
                <div class="ai-group-detail"><strong>Group ID:</strong> ${groupId}</div>
                <div class="ai-group-detail"><strong>Group Name:</strong> ${escapeHtml(group.group_name)}</div>
                <div class="ai-group-detail"><strong>Destination:</strong> ${escapeHtml(group.destination || 'Not specified')}</div>
                <div class="ai-group-detail"><strong>Creator:</strong> ${escapeHtml(group.creator?.name || 'Unknown')}</div>
                <div class="ai-group-detail"><strong>Travel Date:</strong> ${formatDate(group.start_date)}</div>
                <div class="ai-group-detail"><strong>Members Count:</strong> ${group.member_count || 0}</div>
                <div class="ai-group-detail"><strong>Status:</strong> <span class="status-badge ${group.status}">${group.status}</span></div>
                ${membersHtml}
            `;
        }
        
        const modal = document.getElementById("viewSelfGroupModal");
        if (modal) modal.classList.add("active");
        
    } catch (err) {
        console.error('Error viewing self group:', err);
        showNotification('Failed to load group details: ' + err.message, 'error');
    }
}

function closeViewSelfGroupModal() {
    const modal = document.getElementById("viewSelfGroupModal");
    if (modal) modal.classList.remove("active");
}

// =====================================================
// PAYMENTS MANAGEMENT (Remains unchanged)
// =====================================================

function refreshPayments() {
    const searchTerm = document.getElementById("paymentSearch") ? document.getElementById("paymentSearch").value.toLowerCase() : "";
    const statusFilter = document.getElementById("paymentStatusFilter") ? document.getElementById("paymentStatusFilter").value : "all";
    
    let filtered = [...MOCK_PAYMENTS];
    
    if (statusFilter !== "all") {
        filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.user_name.toLowerCase().includes(searchTerm) || 
            p.trip_name.toLowerCase().includes(searchTerm) || 
            p.payment_id.toLowerCase().includes(searchTerm) ||
            (p.destination && p.destination.toLowerCase().includes(searchTerm))
        );
    }
    
    let confirmed = 0, pending = 0, cancelled = 0, total = 0;
    
    for (let i = 0; i < filtered.length; i++) {
        const p = filtered[i];
        if (p.status === "confirmed") {
            confirmed++;
            total += p.amount;
        } else if (p.status === "pending") {
            pending++;
        } else if (p.status === "cancelled") {
            cancelled++;
        }
    }
    
    const confirmedEl = document.getElementById("confirmedPayments");
    const pendingEl = document.getElementById("pendingPayments");
    const cancelledEl = document.getElementById("cancelledPayments");
    const totalEl = document.getElementById("totalCollected");
    const revenueEl = document.getElementById("metricRevenue");
    
    if (confirmedEl) confirmedEl.innerText = confirmed;
    if (pendingEl) pendingEl.innerText = pending;
    if (cancelledEl) cancelledEl.innerText = cancelled;
    if (totalEl) totalEl.innerText = total.toLocaleString();
    if (revenueEl) revenueEl.innerText = total.toLocaleString();
    
    const tbody = document.getElementById("paymentTableBody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr class="placeholder-row"><td colspan="7">No payments match your filters.<\/td><\/tr>`;
        return;
    }
    
    for (let i = 0; i < filtered.length; i++) {
        const p = filtered[i];
        const row = `
            <tr>
                <td>${p.payment_id}<\/td>
                <td>${escapeHtml(p.user_name)}<\/td>
                <td>${escapeHtml(p.trip_name)} <span class="group-type-badge" style="font-size:9px; margin-left:5px;">${escapeHtml(p.destination)}<\/span><\/td>
                <td>₹${p.amount.toLocaleString()}<\/td>
                <td><span class="status-badge ${p.status}">${p.status}<\/span><\/td>
                <td>${p.mode}<\/td>
                <td>${formatDate(p.date)}<\/td>
            <\/tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    }
}

// =====================================================
// NOTIFICATIONS MANAGEMENT (Remains unchanged)
// =====================================================

function refreshNotifications() {
    const typeFilter = document.getElementById("notificationTypeFilter") ? document.getElementById("notificationTypeFilter").value : "all";
    const readFilter = document.getElementById("notificationReadFilter") ? document.getElementById("notificationReadFilter").value : "all";
    
    let filtered = [...MOCK_NOTIFICATIONS];
    
    if (typeFilter !== "all") {
        filtered = filtered.filter(n => n.type === typeFilter);
    }
    
    if (readFilter === "unread") {
        filtered = filtered.filter(n => !n.read);
    } else if (readFilter === "read") {
        filtered = filtered.filter(n => n.read);
    }
    
    const totalUnread = MOCK_NOTIFICATIONS.filter(n => !n.read).length;
    const unreadEl = document.getElementById("unreadNotifications");
    const metricNotifEl = document.getElementById("metricNotifications");
    
    if (unreadEl) unreadEl.innerText = totalUnread;
    if (metricNotifEl) metricNotifEl.innerText = totalUnread;
    
    const tbody = document.getElementById("notificationTableBody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr class="placeholder-row"><td colspan="4">No notifications match your filters.<\/td><\/tr>`;
        return;
    }
    
    for (let i = 0; i < filtered.length; i++) {
        const n = filtered[i];
        const row = `
            <tr>
                <td>${formatDate(n.created_at)}<\/td>
                <td><span class="badge ${n.type}">${n.type}<\/span><\/td>
                <td>${escapeHtml(n.message)} <span class="group-type-badge" style="font-size:9px; margin-left:5px;">${escapeHtml(n.destination || '')}<\/span><\/td>
                <td><span class="status-badge ${n.read ? 'read' : 'unread'}">${n.read ? 'Read' : 'Unread'}<\/span><\/td>
            <\/tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    }
}

function markAllNotificationsRead() {
    for (let i = 0; i < MOCK_NOTIFICATIONS.length; i++) {
        MOCK_NOTIFICATIONS[i].read = true;
    }
    refreshNotifications();
    showNotification("All notifications marked as read", "success");
}

// =====================================================
// DATE FORMATTER
// =====================================================
function formatDate(dateString) {
    if (!dateString) return "-";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return "-";
    }
}

// =====================================================
// NOTIFICATION SYSTEM
// =====================================================
function showNotification(message, type) {
    if (!type) type = 'info';

    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'notification ' + type;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';

    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;

    document.body.appendChild(notification);

    setTimeout(function() {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// =====================================================
// DEBUG FUNCTION
// =====================================================
window.debugBackend = async function() {
    console.log('%c🔍 DEBUGGING BACKEND CONNECTION', 'font-size: 16px; font-weight: bold; color: #ff6f00;');

    const results = [];
    const debugOutput = document.getElementById('debugOutput');
    if (debugOutput) debugOutput.innerHTML = '';

    try {
        const testRes = await fetch('http://localhost:5000/api/test');
        const testData = await testRes.json();
        console.log('✅ Server test:', testData);
        results.push('✅ Server is running');
        if (debugOutput) debugOutput.innerHTML += '✅ Server is running\n';
    } catch (e) {
        console.error('❌ Server test failed:', e.message);
        results.push('❌ Server is NOT running');
        if (debugOutput) debugOutput.innerHTML += '❌ Server is NOT running\n';
    }

    try {
        const directRes = await fetch('http://localhost:5000/api/direct-users');
        const directData = await directRes.json();
        console.log('✅ Direct users query:', directData);
        if (directData.count > 0) {
            results.push('✅ Database has ' + directData.count + ' users');
            if (debugOutput) debugOutput.innerHTML += '✅ Database has ' + directData.count + ' users\n';
        } else {
            results.push('⚠️ Database has 0 users');
            if (debugOutput) debugOutput.innerHTML += '⚠️ Database has 0 users\n';
        }
    } catch (e) {
        console.error('❌ Direct users query failed:', e.message);
        results.push('❌ Database query failed');
        if (debugOutput) debugOutput.innerHTML += '❌ Database query failed\n';
    }

    try {
        const adminRes = await fetch('http://localhost:5000/api/admin/users');
        const adminData = await adminRes.json();
        console.log('✅ Admin endpoint:', adminData);
        results.push('✅ Admin endpoint working');
        if (debugOutput) debugOutput.innerHTML += '✅ Admin endpoint working\n';
    } catch (e) {
        console.error('❌ Admin endpoint failed:', e.message);
        results.push('❌ Admin endpoint failed');
        if (debugOutput) debugOutput.innerHTML += '❌ Admin endpoint failed\n';
    }

    try {
        const groupRes = await fetch('http://localhost:5000/api/admin/ai-groups/pending');
        const groupData = await groupRes.json();
        console.log('✅ Groups endpoint:', groupData);
        results.push('✅ Groups endpoint working');
        if (debugOutput) debugOutput.innerHTML += '✅ Groups endpoint working\n';
    } catch (e) {
        console.error('❌ Groups endpoint failed:', e.message);
        results.push('❌ Groups endpoint failed');
        if (debugOutput) debugOutput.innerHTML += '❌ Groups endpoint failed\n';
    }

    try {
        const selfGroupRes = await fetch('http://localhost:5000/api/admin/self-groups');
        const selfGroupData = await selfGroupRes.json();
        console.log('✅ Self Groups endpoint:', selfGroupData);
        results.push('✅ Self Groups endpoint working');
        if (debugOutput) debugOutput.innerHTML += '✅ Self Groups endpoint working\n';
    } catch (e) {
        console.error('❌ Self Groups endpoint failed:', e.message);
        results.push('❌ Self Groups endpoint failed');
        if (debugOutput) debugOutput.innerHTML += '❌ Self Groups endpoint failed\n';
    }

    alert('Debug Results:\n' + results.join('\n'));

    refreshUsers();
    refreshPackages();
    refreshAIGroups();
    refreshSelfGroups();
};