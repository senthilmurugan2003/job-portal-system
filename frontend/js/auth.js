// =========================================
// API CONFIGURATION
// =========================================

const API_URL = window.API_URL || (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:5000" : (localStorage.getItem("API_URL") || "https://web-production-0d22b.up.railway.app"));


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


// =========================================
// FORGOT PASSWORD HANDLER
// =========================================

const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const forgotEmailInput = document.getElementById("forgotEmail");
const forgotBtn = document.getElementById("forgotBtn");
const forgotText = document.getElementById("forgotText");
const forgotLoader = document.getElementById("forgotLoader");
const forgotSuccessBox = document.getElementById("forgotSuccessBox");

function setForgotLoading(isLoading) {
    if (!forgotBtn) return;
    if (isLoading) {
        forgotBtn.disabled = true;
        if (forgotText) forgotText.textContent = "Sending...";
        if (forgotLoader) forgotLoader.classList.remove("d-none");
    } else {
        forgotBtn.disabled = false;
        if (forgotText) forgotText.textContent = "Send Reset Link";
        if (forgotLoader) forgotLoader.classList.add("d-none");
    }
}

if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = forgotEmailInput?.value.trim();
        if (!email) {
            showToast("Please enter your email address.", "error");
            return;
        }

        setForgotLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email: email })
            });

            const data = await response.json();

            if (!response.ok) {
                showToast(data.message || "Failed to process request.", "error");
                setForgotLoading(false);
                return;
            }

            showToast(data.message || "Password reset link sent to your email.", "success");
            if (forgotSuccessBox) {
                forgotSuccessBox.classList.remove("d-none");
            }
            if (forgotEmailInput) {
                forgotEmailInput.value = "";
            }
            setForgotLoading(false);
        } catch (error) {
            console.error("Forgot password error:", error);
            showToast("Unable to connect to the server.", "error");
            setForgotLoading(false);
        }
    });
}


// =========================================
// RESET PASSWORD HANDLER
// =========================================

const resetPasswordForm = document.getElementById("resetPasswordForm");
const newPasswordInput = document.getElementById("newPassword");
const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
const toggleNewPassword = document.getElementById("toggleNewPassword");
const newPasswordIcon = document.getElementById("newPasswordIcon");
const toggleConfirmNewPassword = document.getElementById("toggleConfirmNewPassword");
const confirmNewPasswordIcon = document.getElementById("confirmNewPasswordIcon");
const resetBtn = document.getElementById("resetBtn");
const resetText = document.getElementById("resetText");
const resetLoader = document.getElementById("resetLoader");
const invalidTokenBox = document.getElementById("invalidTokenBox");
const invalidTokenMsg = document.getElementById("invalidTokenMsg");

// Password toggles for reset page
if (toggleNewPassword && newPasswordInput && newPasswordIcon) {
    toggleNewPassword.addEventListener("click", function () {
        if (newPasswordInput.type === "password") {
            newPasswordInput.type = "text";
            newPasswordIcon.classList.remove("bi-eye");
            newPasswordIcon.classList.add("bi-eye-slash");
        } else {
            newPasswordInput.type = "password";
            newPasswordIcon.classList.remove("bi-eye-slash");
            newPasswordIcon.classList.add("bi-eye");
        }
    });
}

if (toggleConfirmNewPassword && confirmNewPasswordInput && confirmNewPasswordIcon) {
    toggleConfirmNewPassword.addEventListener("click", function () {
        if (confirmNewPasswordInput.type === "password") {
            confirmNewPasswordInput.type = "text";
            confirmNewPasswordIcon.classList.remove("bi-eye");
            confirmNewPasswordIcon.classList.add("bi-eye-slash");
        } else {
            confirmNewPasswordInput.type = "password";
            confirmNewPasswordIcon.classList.remove("bi-eye-slash");
            confirmNewPasswordIcon.classList.add("bi-eye");
        }
    });
}

function setResetLoading(isLoading) {
    if (!resetBtn) return;
    if (isLoading) {
        resetBtn.disabled = true;
        if (resetText) resetText.textContent = "Updating...";
        if (resetLoader) resetLoader.classList.remove("d-none");
    } else {
        resetBtn.disabled = false;
        if (resetText) resetText.textContent = "Reset Password";
        if (resetLoader) resetLoader.classList.add("d-none");
    }
}

if (resetPasswordForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get("token");

    if (!resetToken) {
        if (invalidTokenBox) {
            invalidTokenBox.classList.remove("d-none");
            if (invalidTokenMsg) invalidTokenMsg.textContent = "No reset token provided. Please request a password reset link.";
        }
        if (resetPasswordForm) resetPasswordForm.style.display = "none";
    }

    resetPasswordForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!resetToken) {
            showToast("Invalid or missing reset token.", "error");
            return;
        }

        const newPassword = newPasswordInput?.value;
        const confirmNewPassword = confirmNewPasswordInput?.value;

        if (!newPassword || !confirmNewPassword) {
            showToast("Please fill in both password fields.", "error");
            return;
        }

        if (newPassword.length < 6) {
            showToast("Password must be at least 6 characters long.", "error");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            showToast("Passwords do not match.", "error");
            return;
        }

        setResetLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/reset-password/${encodeURIComponent(resetToken)}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ password: newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                showToast(data.message || "Failed to reset password.", "error");
                if (response.status === 400 && invalidTokenBox) {
                    invalidTokenBox.classList.remove("d-none");
                    if (invalidTokenMsg) invalidTokenMsg.textContent = data.message || "Token is invalid or has expired.";
                    resetPasswordForm.style.display = "none";
                }
                setResetLoading(false);
                return;
            }

            showToast("Password reset successfully! Redirecting to login...", "success");

            setTimeout(function () {
                window.location.href = "login.html";
            }, 2000);
        } catch (error) {
            console.error("Reset password error:", error);
            showToast("Unable to connect to the server.", "error");
            setResetLoading(false);
        }
    });
}