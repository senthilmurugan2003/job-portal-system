// =======================================
// ADMIN DASHBOARD JS
// =======================================

const API_URL = window.API_URL || (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:5000" : (localStorage.getItem("API_URL") || "https://job-portal-production.up.railway.app"));
let sessionData = null;
let currentReportData = null;

document.addEventListener("DOMContentLoaded", function () {
    // Session Guard check
    if (typeof checkAuthSession === "function") {
        sessionData = checkAuthSession("admin");
    }

    displayAdminInfo();
    setupNavigation();
    loadDashboardMetrics();

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            e.preventDefault();
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "../login.html";
        });
    }

    // Modal submit handlers
    const editUserForm = document.getElementById("editUserForm");
    if (editUserForm) {
        editUserForm.addEventListener("submit", handleEditUserSubmit);
    }

    const editJobForm = document.getElementById("editJobForm");
    if (editJobForm) {
        editJobForm.addEventListener("submit", handleEditJobSubmit);
    }

    const exportReportBtn = document.getElementById("exportReportBtn");
    if (exportReportBtn) {
        exportReportBtn.addEventListener("click", exportCSVReport);
    }
});

function displayAdminInfo() {
    const user = sessionData ? sessionData.user : JSON.parse(localStorage.getItem("user") || "{}");
    const badge = document.getElementById("adminEmailBadge");
    if (badge && user.email) {
        badge.textContent = `${user.name || 'Admin'} (${user.email})`;
    }
}

function showAlert(message, type = "success") {
    const alertBox = document.getElementById("alertMessage");
    if (!alertBox) return;

    alertBox.className = `alert alert-${type === "success" ? "success" : "danger"} text-center`;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");

    setTimeout(() => {
        alertBox.classList.add("d-none");
    }, 4000);
}

// Navigation sidebar sections toggling
function setupNavigation() {
    const navItems = document.querySelectorAll(".nav-item-link");
    const sections = document.querySelectorAll(".admin-section");
    const sectionTitle = document.getElementById("sectionTitle");
    const sectionSubtitle = document.getElementById("sectionSubtitle");

    navItems.forEach(item => {
        item.addEventListener("click", function (e) {
            e.preventDefault();
            const targetSectionId = this.getAttribute("data-section");

            navItems.forEach(i => i.classList.remove("active"));
            this.classList.add("active");

            sections.forEach(sec => {
                if (sec.id === targetSectionId) {
                    sec.classList.add("active-section");
                } else {
                    sec.classList.remove("active-section");
                }
            });

            // Lazy load section data
            if (targetSectionId === "section-recruiters" || targetSectionId === "section-seekers") {
                loadUsersCategory();
                if (sectionTitle) sectionTitle.textContent = "User Management 👥";
                if (sectionSubtitle) sectionSubtitle.textContent = "Manage recruiter and job seeker accounts";
            } else if (targetSectionId === "section-jobs") {
                loadJobs();
                if (sectionTitle) sectionTitle.textContent = "Job Listings Management 💼";
                if (sectionSubtitle) sectionSubtitle.textContent = "Edit and manage posted jobs";
            } else if (targetSectionId === "section-reports") {
                loadReports();
                if (sectionTitle) sectionTitle.textContent = "Reports & Analytics 📊";
                if (sectionSubtitle) sectionSubtitle.textContent = "System metrics and CSV export";
            } else if (targetSectionId === "section-dashboard") {
                loadDashboardMetrics();
                if (sectionTitle) sectionTitle.textContent = "Dashboard Overview 🛠️";
                if (sectionSubtitle) sectionSubtitle.textContent = "System summary & platform health";
            }
        });
    });
}

async function loadDashboardMetrics() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${API_URL}/api/admin/dashboard`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById("totalUsers").textContent = data.total_users || 0;
            document.getElementById("totalJobs").textContent = data.total_jobs || 0;
            document.getElementById("totalApplications").textContent = data.total_applications || 0;
        }
    } catch (error) {
        console.error("Error loading metrics:", error);
    }

    loadUsersCategory();
}

async function loadUsersCategory() {
    const token = localStorage.getItem("token");
    const recruitersTable = document.getElementById("recruitersTableBody");
    const seekersTable = document.getElementById("seekersTableBody");

    try {
        const response = await fetch(`${API_URL}/api/admin/users`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const users = await response.json();
        if (response.ok && Array.isArray(users)) {
            let recruiters = users.filter(u => u.role === "recruiter");
            let seekers = users.filter(u => u.role === "job_seeker");

            document.getElementById("totalRecruiters").textContent = recruiters.length;
            document.getElementById("totalJobSeekers").textContent = seekers.length;

            if (recruitersTable) {
                recruitersTable.innerHTML = "";
                if (recruiters.length === 0) {
                    recruitersTable.innerHTML = `<tr><td colspan="5" class="text-muted text-center">No recruiters registered</td></tr>`;
                } else {
                    recruiters.forEach(u => {
                        const safeName = (u.name || '').replace(/'/g, "\\'");
                        const safeEmail = (u.email || '').replace(/'/g, "\\'");
                        recruitersTable.innerHTML += `
                            <tr>
                                <td>${u.id}</td>
                                <td class="fw-semibold">${u.name}</td>
                                <td>${u.email}</td>
                                <td><span class="badge bg-primary">Recruiter</span></td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditUserModal(${u.id}, '${safeName}', '${safeEmail}', '${u.role}')">
                                        <i class="bi bi-pencil"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${u.id}, '${safeName}')">
                                        <i class="bi bi-trash"></i> Delete
                                    </button>
                                </td>
                            </tr>
                        `;
                    });
                }
            }

            if (seekersTable) {
                seekersTable.innerHTML = "";
                if (seekers.length === 0) {
                    seekersTable.innerHTML = `<tr><td colspan="5" class="text-muted text-center">No job seekers registered</td></tr>`;
                } else {
                    seekers.forEach(u => {
                        const safeName = (u.name || '').replace(/'/g, "\\'");
                        const safeEmail = (u.email || '').replace(/'/g, "\\'");
                        seekersTable.innerHTML += `
                            <tr>
                                <td>${u.id}</td>
                                <td class="fw-semibold">${u.name}</td>
                                <td>${u.email}</td>
                                <td><span class="badge bg-success">Job Seeker</span></td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditUserModal(${u.id}, '${safeName}', '${safeEmail}', '${u.role}')">
                                        <i class="bi bi-pencil"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${u.id}, '${safeName}')">
                                        <i class="bi bi-trash"></i> Delete
                                    </button>
                                </td>
                            </tr>
                        `;
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error loading users:", error);
    }
}

async function loadJobs() {
    const token = localStorage.getItem("token");
    const tableBody = document.getElementById("jobsTableBody");
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_URL}/api/admin/jobs`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const jobs = await response.json();
        if (response.ok && Array.isArray(jobs)) {
            tableBody.innerHTML = "";
            if (jobs.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" class="text-muted text-center">No jobs found</td></tr>`;
                return;
            }
            jobs.forEach(j => {
                const badgeClass = j.status === "closed" ? "bg-secondary" : "bg-info text-dark";
                const safeTitle = (j.title || '').replace(/'/g, "\\'");
                const safeLocation = (j.location || '').replace(/'/g, "\\'");
                tableBody.innerHTML += `
                    <tr>
                        <td>${j.id}</td>
                        <td class="fw-semibold">${j.title}</td>
                        <td>${j.location || "-"}</td>
                        <td><span class="badge ${badgeClass}">${j.status || "open"}</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditJobModal(${j.id}, '${safeTitle}', '${safeLocation}', '${j.status || 'open'}')">
                                <i class="bi bi-pencil"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteJob(${j.id}, '${safeTitle}')">
                                <i class="bi bi-trash"></i> Delete
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (error) {
        console.error("Error loading jobs:", error);
    }
}

// Modal opening functions
function openEditUserModal(id, name, email, role) {
    document.getElementById("editUserId").value = id;
    document.getElementById("editUserName").value = name;
    document.getElementById("editUserEmail").value = email;
    document.getElementById("editUserRole").value = role;

    const modal = new bootstrap.Modal(document.getElementById("editUserModal"));
    modal.show();
}

async function handleEditUserSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const id = document.getElementById("editUserId").value;
    const name = document.getElementById("editUserName").value;
    const email = document.getElementById("editUserEmail").value;
    const role = document.getElementById("editUserRole").value;

    try {
        const response = await fetch(`${API_URL}/api/admin/users/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name, email, role })
        });

        const data = await response.json();
        if (response.ok) {
            showAlert("User updated successfully", "success");
            const modalEl = document.getElementById("editUserModal");
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            loadDashboardMetrics();
        } else {
            showAlert(data.message || "Failed to update user", "error");
        }
    } catch (error) {
        console.error("Error updating user:", error);
        showAlert("Server error updating user", "error");
    }
}

function openEditJobModal(id, title, location, status) {
    document.getElementById("editJobId").value = id;
    document.getElementById("editJobTitle").value = title;
    document.getElementById("editJobLocation").value = location;
    document.getElementById("editJobStatus").value = status;

    const modal = new bootstrap.Modal(document.getElementById("editJobModal"));
    modal.show();
}

async function handleEditJobSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const id = document.getElementById("editJobId").value;
    const title = document.getElementById("editJobTitle").value;
    const location = document.getElementById("editJobLocation").value;
    const status = document.getElementById("editJobStatus").value;

    try {
        const response = await fetch(`${API_URL}/api/admin/jobs/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ title, location, status })
        });

        const data = await response.json();
        if (response.ok) {
            showAlert("Job updated successfully", "success");
            const modalEl = document.getElementById("editJobModal");
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            loadDashboardMetrics();
            loadJobs();
        } else {
            showAlert(data.message || "Failed to update job", "error");
        }
    } catch (error) {
        console.error("Error updating job:", error);
        showAlert("Server error updating job", "error");
    }
}

// Reports Loading & Exporting
async function loadReports() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${API_URL}/api/admin/reports`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (response.ok) {
            currentReportData = data;
            document.getElementById("reportTotalUsers").textContent = data.total_users || 0;
            document.getElementById("reportTotalJobs").textContent = data.total_jobs || 0;
            document.getElementById("reportOpenJobs").textContent = data.open_jobs || 0;
            document.getElementById("reportTotalApps").textContent = data.total_applications || 0;

            const tableBody = document.getElementById("reportStatusTableBody");
            if (tableBody && data.application_status_breakdown) {
                tableBody.innerHTML = "";
                for (const [status, count] of Object.entries(data.application_status_breakdown)) {
                    tableBody.innerHTML += `
                        <tr>
                            <td class="fw-semibold">${status}</td>
                            <td><span class="badge bg-secondary px-3 py-1">${count}</span></td>
                        </tr>
                    `;
                }
            }
        }
    } catch (error) {
        console.error("Error loading reports:", error);
    }
}

function exportCSVReport() {
    if (!currentReportData) {
        showAlert("No report data loaded to export.", "error");
        return;
    }

    const data = currentReportData;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Metric,Value\n";
    csvContent += `Total Users,${data.total_users}\n`;
    csvContent += `Recruiters Count,${data.recruiters_count}\n`;
    csvContent += `Job Seekers Count,${data.seekers_count}\n`;
    csvContent += `Total Jobs,${data.total_jobs}\n`;
    csvContent += `Open Jobs,${data.open_jobs}\n`;
    csvContent += `Closed Jobs,${data.closed_jobs}\n`;
    csvContent += `Total Applications,${data.total_applications}\n\n`;
    csvContent += "Application Status,Count\n";

    if (data.application_status_breakdown) {
        for (const [status, count] of Object.entries(data.application_status_breakdown)) {
            csvContent += `${status},${count}\n`;
        }
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `job_portal_system_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert("System report downloaded as CSV successfully!", "success");
}

async function deleteUser(id, name) {
    const token = localStorage.getItem("token");
    if (!confirm(`Are you sure you want to delete user "${name}"? All associated profile data will be permanently removed.`)) return;

    try {
        const response = await fetch(`${API_URL}/api/admin/users/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (response.ok) {
            showAlert(`User "${name}" deleted successfully.`, "success");
            loadDashboardMetrics();
        } else {
            showAlert(data.message || "Failed to delete user.", "error");
        }
    } catch (error) {
        console.error("Error deleting user:", error);
        showAlert("Server error deleting user.", "error");
    }
}

async function deleteJob(id, title) {
    const token = localStorage.getItem("token");
    if (!confirm(`Are you sure you want to delete job listing "${title}"?`)) return;

    try {
        const response = await fetch(`${API_URL}/api/admin/jobs/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (response.ok) {
            showAlert(`Job "${title}" deleted successfully.`, "success");
            loadDashboardMetrics();
            loadJobs();
        } else {
            showAlert(data.message || "Failed to delete job.", "error");
        }
    } catch (error) {
        console.error("Error deleting job:", error);
        showAlert("Server error deleting job.", "error");
    }
}
