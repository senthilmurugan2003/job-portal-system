// =======================================
// RECRUITER COMPANY PROFILE JS
// =======================================

const token = localStorage.getItem("token");
const userData = localStorage.getItem("user");
const API_URL = window.API_URL || (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:5000" : (localStorage.getItem("API_URL") || "https://job-portal-production.up.railway.app"));

if (!token) {
    window.location.href = "../login.html";
}

let user = null;
if (userData) {
    user = JSON.parse(userData);
}

if (!user || user.role !== "recruiter") {
    alert("Only recruiters can access this page.");
    window.location.href = "../login.html";
}

document.addEventListener("DOMContentLoaded", function () {
    displayUserHeader();
    loadCompanyProfile();

    const companyForm = document.getElementById("companyForm");
    if (companyForm) {
        companyForm.addEventListener("submit", saveCompanyProfile);
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            e.preventDefault();
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "../login.html";
        });
    }
});

function displayUserHeader() {
    if (!user) return;
    const headerUserName = document.getElementById("headerUserName");
    const headerAvatar = document.getElementById("headerAvatar");

    if (headerUserName) headerUserName.textContent = user.name;
    if (headerAvatar) headerAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`;
}

function showAlert(message, type = "success") {
    const alertMessage = document.getElementById("alertMessage");
    if (!alertMessage) return;

    alertMessage.className = `alert alert-${type === "success" ? "success" : "danger"} text-center`;
    alertMessage.textContent = message;
    alertMessage.classList.remove("d-none");

    setTimeout(() => {
        alertMessage.classList.add("d-none");
    }, 4000);
}

async function loadCompanyProfile() {
    try {
        const response = await fetch(`${API_URL}/api/company/profile`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById("companyName").value = data.company_name || "";
            document.getElementById("location").value = data.location || "";
            document.getElementById("website").value = data.website || "";
            document.getElementById("description").value = data.description || "";
        }
    } catch (error) {
        console.error("Error loading company profile:", error);
    }
}

async function saveCompanyProfile(e) {
    e.preventDefault();

    const companyData = {
        company_name: document.getElementById("companyName").value.trim(),
        location: document.getElementById("location").value.trim(),
        website: document.getElementById("website").value.trim(),
        description: document.getElementById("description").value.trim()
    };

    const saveBtn = document.getElementById("saveCompanyBtn");
    if (saveBtn) saveBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/api/company/profile`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(companyData)
        });

        const data = await response.json();

        if (response.ok) {
            showAlert("Company profile saved successfully!", "success");
        } else {
            showAlert(data.message || "Failed to save company profile.", "error");
        }
    } catch (error) {
        console.error("Error saving company profile:", error);
        showAlert("Server connection failed.", "error");
    } finally {
        if (saveBtn) saveBtn.disabled = false;
    }
}
