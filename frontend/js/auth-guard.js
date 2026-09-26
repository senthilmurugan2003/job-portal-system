// =========================================
// REUSABLE AUTH GUARD & JWT SESSION CHECK
// =========================================

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

function checkAuthSession(requiredRole = null) {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
        handleSessionExpired("Please login to access your dashboard.");
        return null;
    }

    const payload = parseJwt(token);
    if (!payload || !payload.exp) {
        handleSessionExpired("Invalid session token. Please login again.");
        return null;
    }

    // Check expiration timestamp (payload.exp is in seconds)
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp < currentTime) {
        handleSessionExpired("Session expired. Please login again.");
        return null;
    }

    let user = null;
    if (userData) {
        try {
            user = JSON.parse(userData);
        } catch (e) {
            user = null;
        }
    }

    if (requiredRole && user && user.role !== requiredRole) {
        alert(`Access denied. Page requires ${requiredRole} role.`);
        window.location.href = getLoginRedirectPath();
        return null;
    }

    return { token, user, payload };
}

function handleSessionExpired(message) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.setItem("sessionNotice", message || "Session expired. Please login again.");
    window.location.href = getLoginRedirectPath();
}

function getLoginRedirectPath() {
    const path = window.location.pathname;
    if (path.includes("/job-seeker/") || path.includes("/recruiter/") || path.includes("/admin/")) {
        return "../login.html";
    }
    return "pages/login.html";
}

// Global Interceptor for HTTP 401 / 422 (Expired Token Responses from Flask API)
(function interceptFetch() {
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);
        if (response.status === 401 || response.status === 422) {
            // Check if request was to an authenticated API endpoint
            const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
            if (url.includes("/api/") && !url.includes("/api/auth/login") && !url.includes("/api/auth/register")) {
                console.warn("JWT Token Expired or Invalid. Redirecting to login...");
                handleSessionExpired("Session expired. Please login again.");
            }
        }
        return response;
    };
})();

// Periodic Live Monitoring of Token Expiry (Every 10 seconds)
setInterval(function () {
    const scriptTag = document.querySelector("script[data-required-role]");
    if (scriptTag) {
        const role = scriptTag.getAttribute("data-required-role");
        const token = localStorage.getItem("token");
        if (token) {
            const payload = parseJwt(token);
            const currentTime = Math.floor(Date.now() / 1000);
            if (payload && payload.exp && payload.exp < currentTime) {
                console.warn("Token expired during active session. Redirecting to login...");
                handleSessionExpired("Session expired. Please login again.");
            }
        }
    }
}, 10000);

// Auto-check on script inclusion if data-required-role attribute is set
document.addEventListener("DOMContentLoaded", function () {
    const scriptTag = document.querySelector("script[data-required-role]");
    if (scriptTag) {
        const role = scriptTag.getAttribute("data-required-role");
        checkAuthSession(role);
    }

    // Display session expiry notice on login page if present
    const notice = sessionStorage.getItem("sessionNotice");
    if (notice && (window.location.pathname.endsWith("login.html") || window.location.pathname.endsWith("/login"))) {
        sessionStorage.removeItem("sessionNotice");
        setTimeout(function() {
            if (typeof showToast === "function") {
                showToast(notice, "error");
            } else {
                const toastText = document.getElementById("toastText");
                const toast = document.getElementById("toast");
                if (toastText && toast) {
                    toastText.textContent = notice;
                    toast.classList.add("error", "show");
                }
            }
        }, 300);
    }
});
