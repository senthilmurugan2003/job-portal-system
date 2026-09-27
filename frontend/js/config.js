// ==========================================================================
// JOB PORTAL API CONFIGURATION (Localhost / Railway / Vercel)
// ==========================================================================

(function () {

    // 1. Check if user configured a custom API URL in localStorage
    const savedApiUrl = localStorage.getItem("API_URL");

    if (savedApiUrl) {
        window.API_URL = savedApiUrl.replace(/\/+$/, "");
        return;
    }

    // 2. Local development detection
    const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.protocol === "file:";

    if (isLocal) {

        window.API_URL = "http://127.0.0.1:5000";

    } else {

        // Railway Production Backend URL
        window.API_URL = "https://web-production-0d22b.up.railway.app";

    }

})();

// Fallback constant for files expecting local API_URL variable
var API_URL = window.API_URL;