// =========================================
// API CONFIGURATION
// =========================================

const API_URL = window.API_URL || (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:5000" : (localStorage.getItem("API_URL") || "https://job-portal-production.up.railway.app"));


// =========================================
// LOGIN ELEMENTS
// =========================================

const loginForm = document.getElementById("loginForm");

const emailInput = document.getElementById("email");

const passwordInput = document.getElementById("password");

const togglePassword = document.getElementById("togglePassword");

const passwordIcon = document.getElementById("passwordIcon");

const loginBtn = document.getElementById("loginBtn");

const loginText = document.getElementById("loginText");

const loginLoader = document.getElementById("loginLoader");


// =========================================
// TOGGLE PASSWORD
// =========================================

if (togglePassword) {

    togglePassword.addEventListener("click", function () {

        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            passwordIcon.classList.remove("bi-eye");

            passwordIcon.classList.add("bi-eye-slash");

            togglePassword.setAttribute(
                "aria-label",
                "Hide password"
            );

        } else {

            passwordInput.type = "password";

            passwordIcon.classList.remove("bi-eye-slash");

            passwordIcon.classList.add("bi-eye");

            togglePassword.setAttribute(
                "aria-label",
                "Show password"
            );

        }

    });

}


// =========================================
// TOAST FUNCTION
// =========================================

function showToast(message, type = "success") {

    const toast = document.getElementById("toast");

    const toastText = document.getElementById("toastText");

    const toastIcon = document.getElementById("toastIcon");


    if (!toast || !toastText || !toastIcon) {

        return;

    }


    toastText.textContent = message;


    toast.classList.remove(
        "success",
        "error"
    );


    toast.classList.add(type);


    if (type === "success") {

        toastIcon.className =
            "bi bi-check-circle-fill";

    } else {

        toastIcon.className =
            "bi bi-exclamation-circle-fill";

    }


    toast.classList.add("show");


    setTimeout(function () {
        toast.classList.remove("show");
    }, 4000);
}

// Display session expiry notice if redirected from auth guard
document.addEventListener("DOMContentLoaded", function () {
    const notice = sessionStorage.getItem("sessionNotice");
    if (notice) {
        sessionStorage.removeItem("sessionNotice");
        setTimeout(function () {
            showToast(notice, "error");
        }, 300);
    }
});


// =========================================
// LOGIN LOADING STATE
// =========================================

function setLoginLoading(isLoading) {

    if (isLoading) {

        loginBtn.disabled = true;

        loginText.textContent = "Signing in...";

        loginLoader.classList.remove("d-none");

    } else {

        loginBtn.disabled = false;

        loginText.textContent = "Login";

        loginLoader.classList.add("d-none");

    }

}


// =========================================
// LOGIN FORM
// =========================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                emailInput.value.trim();


            const password =
                passwordInput.value;


            // Basic validation

            if (!email || !password) {

                showToast(
                    "Email and password are required.",
                    "error"
                );

                return;

            }


            setLoginLoading(true);


            try {

                const response = await fetch(
                    `${API_URL}/api/auth/login`,
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body: JSON.stringify({

                            email: email,

                            password: password

                        })

                    }
                );


                const data =
                    await response.json();


                // Login failed

                if (!response.ok) {

                    showToast(
                        data.message ||
                        "Invalid email or password.",
                        "error"
                    );

                    setLoginLoading(false);

                    return;

                }


                // =====================================
                // LOGIN SUCCESSFUL
                // =====================================

                localStorage.setItem(
                    "token",
                    data.access_token
                );


                // Store user information

                if (data.user) {

                    localStorage.setItem(
                        "user",
                        JSON.stringify(data.user)
                    );

                }


                showToast(
                    "Login successful.",
                    "success"
                );


                // =====================================
                // ROLE BASED REDIRECT
                // =====================================

                const role =
                    data.user?.role;


                setTimeout(function () {

                    if (role === "job_seeker") {

                        window.location.href =
                            "job-seeker/dashboard.html";

                    }

                    else if (role === "recruiter") {

                        window.location.href =
                            "recruiter/dashboard.html";

                    }

                    else if (role === "admin") {

                        window.location.href =
                            "admin/dashboard.html";

                    }

                    else {

                        showToast(
                            "Invalid user role.",
                            "error"
                        );

                        setLoginLoading(false);

                    }

                }, 1000);


            }

            catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                showToast(
                    "Unable to connect to the server.",
                    "error"
                );


                setLoginLoading(false);

            }

        }
    );

}


// =========================================
// REGISTER FORM & CONFIRM PASSWORD TOGGLE
// =========================================

const registerForm = document.getElementById("registerForm");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const confirmPasswordIcon = document.getElementById("confirmPasswordIcon");

if (toggleConfirmPassword && confirmPasswordInput && confirmPasswordIcon) {
    toggleConfirmPassword.addEventListener("click", function () {
        if (confirmPasswordInput.type === "password") {
            confirmPasswordInput.type = "text";
            confirmPasswordIcon.classList.remove("bi-eye");
            confirmPasswordIcon.classList.add("bi-eye-slash");
        } else {
            confirmPasswordInput.type = "password";
            confirmPasswordIcon.classList.remove("bi-eye-slash");
            confirmPasswordIcon.classList.add("bi-eye");
        }
    });
}

function setRegisterLoading(isLoading) {
    const registerBtn = document.getElementById("registerBtn");
    const registerText = document.getElementById("registerText");
    const registerLoader = document.getElementById("registerLoader");

    if (!registerBtn) return;

    if (isLoading) {
        registerBtn.disabled = true;
        if (registerText) registerText.textContent = "Creating Account...";
        if (registerLoader) registerLoader.classList.remove("d-none");
    } else {
        registerBtn.disabled = false;
        if (registerText) registerText.textContent = "Create Account";
        if (registerLoader) registerLoader.classList.add("d-none");
    }
}

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("name")?.value.trim();
        const email = document.getElementById("email")?.value.trim();
        const role = document.getElementById("role")?.value;
        const password = document.getElementById("password")?.value;
        const confirmPassword = confirmPasswordInput?.value;

        if (!name || !email || !role || !password || !confirmPassword) {
            showToast("Please fill in all required fields.", "error");
            return;
        }

        if (password !== confirmPassword) {
            showToast("Passwords do not match.", "error");
            return;
        }

        if (password.length < 6) {
            showToast("Password must be at least 6 characters long.", "error");
            return;
        }

        setRegisterLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    role: role,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                showToast(data.message || "Registration failed.", "error");
                setRegisterLoading(false);
                return;
            }

            showToast("Account created successfully! Redirecting to login...", "success");

            setTimeout(function () {
                window.location.href = "login.html";
            }, 1500);
        } catch (error) {
            console.error("Register error:", error);
            showToast("Unable to connect to the server.", "error");
            setRegisterLoading(false);
        }
    });
}