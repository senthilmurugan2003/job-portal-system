

const token = localStorage.getItem("token");

const userData = localStorage.getItem("user");


const API_URL = window.API_URL || (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:5000" : (localStorage.getItem("API_URL") || "https://job-portal-production.up.railway.app"));



if(!token){

    window.location.href="../login.html";

}




let user = null;


if(userData){

    user = JSON.parse(userData);

}







// =======================================
// FORM SUBMIT
// =======================================

const jobForm = document.getElementById("jobForm");
let isSubmitting = false;

if (jobForm) {
    jobForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        if (isSubmitting) {
            return;
        }

        const submitBtn = jobForm.querySelector("button[type='submit']");
        const originalBtnContent = submitBtn ? submitBtn.innerHTML : "Post Job";

        // Collect form data
        const jobData = {
            title: document.getElementById("title").value.trim(),
            location: document.getElementById("location").value.trim(),
            experience: document.getElementById("experience").value.trim(),
            job_type: document.getElementById("jobType").value,
            skills: document.getElementById("skills").value.trim(),
            description: document.getElementById("description").value.trim()
        };

        if (!jobData.title || !jobData.location || !jobData.description) {
            alert("Please fill in all required fields.");
            return;
        }

        try {
            isSubmitting = true;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Posting Job...`;
            }

            const response = await fetch(`${API_URL}/api/jobs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(jobData)
            });

            const data = await response.json();

            if (response.ok) {
                alert("Job posted successfully");
                window.location.href = "dashboard.html";
            } else {
                alert(data.message || "Unable to post job");
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnContent;
                }
                isSubmitting = false;
            }
        } catch (error) {
            console.log("Server Error:", error);
            alert("Server connection failed. Please try again.");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnContent;
            }
            isSubmitting = false;
        }
    });
}