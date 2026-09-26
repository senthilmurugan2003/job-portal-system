// ==========================================================================
// JOBPORTAL MAIN JAVASCRIPT
// ==========================================================================

document.addEventListener("DOMContentLoaded", function () {
    // 1. Initialize AOS Scroll Animation
    if (typeof AOS !== "undefined") {
        AOS.init({
            duration: 800,
            easing: "ease-in-out",
            once: true,
            mirror: false
        });
    }

    // 2. Navbar Scroll Effect Handling
    const navbar = document.getElementById("mainNavbar");

    function handleNavbarScroll() {
        if (!navbar) return;
        // Only toggle scroll effects if navbar started transparent (e.g. hero section on index.html)
        if (!navbar.dataset.transparent && !navbar.classList.contains("navbar-transparent")) {
            return;
        }
        navbar.dataset.transparent = "true";

        if (window.scrollY > 50) {
            navbar.classList.add("navbar-scrolled");
            navbar.classList.remove("navbar-transparent");
        } else {
            navbar.classList.remove("navbar-scrolled");
            navbar.classList.add("navbar-transparent");
        }
    }

    window.addEventListener("scroll", handleNavbarScroll);
    handleNavbarScroll(); // Initial check on load

    // 3. Smooth Scrolling for Internal Navigation Links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener("click", function (e) {
            const targetId = this.getAttribute("href");
            if (targetId === "#" || !targetId) return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();

                // Close mobile navbar if open
                const navbarCollapse = document.getElementById("navbarMenu");
                if (navbarCollapse && navbarCollapse.classList.contains("show")) {
                    const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                    if (bsCollapse) {
                        bsCollapse.hide();
                    }
                }

                // Smooth scroll to target
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // 4. Statistics Animated Counter Effect
    const counters = document.querySelectorAll(".counter");
    let animated = false;

    function startCounters() {
        counters.forEach(counter => {
            const target = +counter.getAttribute("data-target");
            const duration = 2000; // 2 seconds
            const stepTime = 20; // 20ms steps
            const steps = duration / stepTime;
            const increment = target / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target.toLocaleString();
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.ceil(current).toLocaleString();
                }
            }, stepTime);
        });
    }

    // IntersectionObserver for Counter Trigger
    const statsSection = document.getElementById("stats");
    if (statsSection && counters.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !animated) {
                    animated = true;
                    startCounters();
                }
            });
        }, { threshold: 0.3 });

        observer.observe(statsSection);
    }

    // 5. Contact Form Handler
    const contactForm = document.getElementById("contactForm");
    const contactAlert = document.getElementById("contactAlert");

    if (contactForm) {
        contactForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const name = document.getElementById("contactName").value.trim();
            const email = document.getElementById("contactEmail").value.trim();
            const subject = document.getElementById("contactSubject").value.trim();
            const message = document.getElementById("contactMessage").value.trim();

            if (!name || !email || !subject || !message) {
                if (contactAlert) {
                    contactAlert.className = "alert alert-danger mt-3";
                    contactAlert.textContent = "Please fill in all required fields.";
                    contactAlert.classList.remove("d-none");
                }
                return;
            }

            // Simulate form submission
            if (contactAlert) {
                contactAlert.className = "alert alert-success mt-3";
                contactAlert.innerHTML = `<i class="bi bi-check-circle-fill me-2"></i> Thank you, <strong>${name}</strong>! Your message has been sent successfully. We will get back to you shortly.`;
                contactAlert.classList.remove("d-none");
            }

            contactForm.reset();

            setTimeout(() => {
                if (contactAlert) contactAlert.classList.add("d-none");
            }, 6000);
        });
    }
});