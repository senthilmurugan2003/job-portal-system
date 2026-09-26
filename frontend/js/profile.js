// =======================================
// JOB SEEKER PROFILE JS
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

if (!user || user.role !== "job_seeker") {
    alert("Only job seekers can access this page.");
    window.location.href = "../login.html";
}

document.addEventListener("DOMContentLoaded", function () {
    displayUserHeader();
    loadProfile();

    const profileForm = document.getElementById("profileForm");
    if (profileForm) {
        profileForm.addEventListener("submit", updateProfile);
    }

    const resumeForm = document.getElementById("resumeForm");
    if (resumeForm) {
        resumeForm.addEventListener("submit", uploadResume);
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

async function loadProfile() {
    try {
        const response = await fetch(`${API_URL}/api/job-seeker/profile`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById("phone").value = data.phone || "";
            document.getElementById("location").value = data.location || "";
            document.getElementById("qualification").value = data.qualification || "";
            document.getElementById("experience").value = data.experience || "";
            if (document.getElementById("skills")) document.getElementById("skills").value = data.skills || "";
            if (document.getElementById("preferredRole")) document.getElementById("preferredRole").value = data.preferred_role || "";
            document.getElementById("bio").value = data.bio || "";

            if (data.resume_path) {
                const currentResumeContainer = document.getElementById("currentResumeContainer");
                const currentResumeLink = document.getElementById("currentResumeLink");
                const currentResumeName = document.getElementById("currentResumeName");

                if (currentResumeContainer && currentResumeLink) {
                    currentResumeContainer.classList.remove("d-none");
                    const fullUrl = data.resume_path.startsWith("http")
                        ? data.resume_path
                        : `${API_URL}/${data.resume_path}`;
                    currentResumeLink.href = fullUrl;
                    if (currentResumeName) currentResumeName.textContent = data.resume_path.split("/").pop();
                }
            }
        }
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

async function updateProfile(e) {
    e.preventDefault();

    const profileData = {
        phone: document.getElementById("phone").value.trim(),
        location: document.getElementById("location").value.trim(),
        qualification: document.getElementById("qualification").value.trim(),
        experience: document.getElementById("experience").value.trim(),
        skills: document.getElementById("skills") ? document.getElementById("skills").value.trim() : "",
        preferred_role: document.getElementById("preferredRole") ? document.getElementById("preferredRole").value.trim() : "",
        bio: document.getElementById("bio").value.trim()
    };

    const saveBtn = document.getElementById("saveProfileBtn");
    if (saveBtn) saveBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/api/job-seeker/profile`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();

        if (response.ok) {
            showAlert("Profile details updated successfully!", "success");
        } else {
            showAlert(data.message || "Failed to update profile.", "error");
        }
    } catch (error) {
        console.error("Error updating profile:", error);
        showAlert("Server error updating profile.", "error");
    } finally {
        if (saveBtn) saveBtn.disabled = false;
    }
}

async function uploadResume(e) {
    e.preventDefault();

    const fileInput = document.getElementById("resumeFile");
    if (!fileInput || !fileInput.files[0]) {
        showAlert("Please select a file to upload.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("resume", fileInput.files[0]);

    const uploadBtn = document.getElementById("uploadResumeBtn");
    if (uploadBtn) uploadBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/api/job-seeker/resume`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showAlert("Resume uploaded successfully!", "success");
            fileInput.value = "";
            loadProfile();
        } else {
            showAlert(data.message || "Resume upload failed.", "error");
        }
    } catch (error) {
        console.error("Resume upload error:", error);
        showAlert("Server error during resume upload.", "error");
    } finally {
        if (uploadBtn) uploadBtn.disabled = false;
    }
}
