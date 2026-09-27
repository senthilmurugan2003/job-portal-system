/* =========================================================
   API CONFIGURATION
========================================================= */

const API_ROOT_URL = window.API_URL || (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:5000" : (localStorage.getItem("API_URL") || "https://web-production-0d22b.up.railway.app"));
const API_BASE_URL = `${API_ROOT_URL}/api/applications`;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const loadingMessage = document.getElementById("loadingMessage");

const errorMessage = document.getElementById("errorMessage");

const errorText = document.getElementById("errorText");

const emptyMessage = document.getElementById("emptyMessage");

const tableContainer = document.getElementById("tableContainer");

const applicantsTableBody =
    document.getElementById("applicantsTableBody");

const applicantCount =
    document.getElementById("applicantCount");

const candidateDetails =
    document.getElementById("candidateDetails");

const logoutBtn =
    document.getElementById("logoutBtn");


/* =========================================================
   GET TOKEN
========================================================= */

const token = localStorage.getItem("token");


/* =========================================================
   AUTHENTICATION CHECK
========================================================= */

if (!token) {

    alert("Please login first.");

    window.location.href = "../login.html";

}


/* =========================================================
   LOAD APPLICANTS WHEN PAGE OPENS
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    loadApplicants();

});


/* =========================================================
   LOAD ALL RECRUITER APPLICANTS
========================================================= */

async function loadApplicants() {

    showLoading();

    try {

        const response = await fetch(
            `${API_BASE_URL}/recruiter`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );


        /*
         * Check HTTP response
         */

        if (!response.ok) {

            let errorData = {};

            try {
                errorData = await response.json();
            } catch (e) {
                // Ignore JSON parsing error
            }


            if (response.status === 401) {

                localStorage.removeItem("token");
                localStorage.removeItem("user");

                alert("Your session has expired. Please login again.");

                window.location.href = "../login.html";

                return;
            }


            if (response.status === 403) {

                throw new Error(
                    errorData.message ||
                    "You are not authorized to view applicants."
                );

            }


            throw new Error(
                errorData.message ||
                `Server returned status ${response.status}`
            );

        }


        const applicants = await response.json();


        console.log("Applicants API response:", applicants);


        /*
         * Check response format
         */

        if (!Array.isArray(applicants)) {

            throw new Error(
                "Invalid applicants response from server."
            );

        }


        /*
         * Filter out applicants for closed jobs
         */

        const activeApplicants = applicants.filter(a => a.job_status !== "closed");


        /*
         * Update count
         */

        applicantCount.textContent = activeApplicants.length;


        /*
         * No applicants
         */

        if (activeApplicants.length === 0) {

            showEmpty();

            return;

        }


        /*
         * Render applicants
         */

        renderApplicants(activeApplicants);

    }

    catch (error) {

        console.error(
            "Error loading applicants:",
            error
        );

        showError(
            error.message ||
            "Unable to connect to the server."
        );

    }

}


/* =========================================================
   RENDER APPLICANTS
========================================================= */

function renderApplicants(applicants) {

    applicantsTableBody.innerHTML = "";


    applicants.forEach(function (applicant) {

        const row = document.createElement("tr");


        /* -------------------------------------------------
           Applicant name
        ------------------------------------------------- */

        const name =
            applicant.name ||
            "Unknown Candidate";

        const email =
            applicant.email ||
            "No email";


        const avatarLetter =
            name.charAt(0).toUpperCase();


        /* -------------------------------------------------
           Qualification
        ------------------------------------------------- */

        const qualification =
            applicant.qualification ||
            "Not provided";


        /* -------------------------------------------------
           Experience
        ------------------------------------------------- */

        const experience =
            applicant.experience ||
            "Not provided";


        /* -------------------------------------------------
           Location
        ------------------------------------------------- */

        const location =
            applicant.location ||
            "Not provided";


        /* -------------------------------------------------
           Job title
        ------------------------------------------------- */

        const jobTitle =
            applicant.job_title ||
            "Unknown Job";


        /* -------------------------------------------------
           Company
        ------------------------------------------------- */

        const company =
            applicant.company ||
            "Company not available";


        /* -------------------------------------------------
           Applied date
        ------------------------------------------------- */

        const appliedDate =
            formatDate(applicant.applied_at);


        /* -------------------------------------------------
           Status
        ------------------------------------------------- */

        const status =
            applicant.status ||
            "Applied";


        /* -------------------------------------------------
           Create Applicant cell
        ------------------------------------------------- */

        const applicantCell =
            document.createElement("td");


        applicantCell.innerHTML = `

            <div class="applicant-info">

                <div class="applicant-avatar">
                    ${escapeHTML(avatarLetter)}
                </div>

                <div>

                    <div class="applicant-name">
                        ${escapeHTML(name)}
                    </div>

                    <div class="applicant-email">
                        ${escapeHTML(email)}
                    </div>

                </div>

            </div>

        `;


        /* -------------------------------------------------
           Job cell
        ------------------------------------------------- */

        const jobCell =
            document.createElement("td");


        jobCell.innerHTML = `

            <div class="job-title">
                ${escapeHTML(jobTitle)}
            </div>

            <div class="company-name">
                ${escapeHTML(company)}
            </div>

        `;


        /* -------------------------------------------------
           Qualification cell
        ------------------------------------------------- */

        const qualificationCell =
            document.createElement("td");

        qualificationCell.textContent =
            qualification;


        /* -------------------------------------------------
           Experience cell
        ------------------------------------------------- */

        const experienceCell =
            document.createElement("td");

        experienceCell.textContent =
            experience;


        /* -------------------------------------------------
           Location cell
        ------------------------------------------------- */

        const locationCell =
            document.createElement("td");

        locationCell.textContent =
            location;


        /* -------------------------------------------------
           Date cell
        ------------------------------------------------- */

        const dateCell =
            document.createElement("td");

        dateCell.textContent =
            appliedDate;


        /* -------------------------------------------------
           Status cell
        ------------------------------------------------- */

        const statusCell =
            document.createElement("td");


        const statusSelect =
            document.createElement("select");


        statusSelect.className =
            "status-select";


        const statuses = [
            "Applied",
            "Shortlisted",
            "Interview",
            "Selected",
            "Rejected"
        ];


        statuses.forEach(function (statusOption) {

            const option =
                document.createElement("option");

            option.value =
                statusOption;

            option.textContent =
                statusOption;


            if (
                statusOption ===
                status
            ) {

                option.selected = true;

            }


            statusSelect.appendChild(option);

        });


        /*
         * Store original status
         */

        statusSelect.dataset.originalStatus =
            status;


        /*
         * Update status when changed
         */

        statusSelect.addEventListener(
            "change",
            function () {

                updateApplicationStatus(
                    applicant.application_id,
                    statusSelect.value,
                    statusSelect
                );

            }
        );


        statusCell.appendChild(
            statusSelect
        );


        /* -------------------------------------------------
           Resume cell
        ------------------------------------------------- */

        const resumeCell =
            document.createElement("td");


        if (applicant.resume_path) {

            const resumeButton =
                document.createElement("a");


            resumeButton.href =
                buildResumeUrl(
                    applicant.resume_path
                );


            resumeButton.target =
                "_blank";


            resumeButton.rel =
                "noopener noreferrer";


            resumeButton.className =
                "btn-resume";


            resumeButton.innerHTML = `
                <i class="bi bi-file-earmark-pdf"></i>
                View
            `;


            resumeCell.appendChild(
                resumeButton
            );

        } else {

            resumeCell.innerHTML = `
                <span class="text-muted">
                    Not uploaded
                </span>
            `;

        }


        /* -------------------------------------------------
           Action cell
        ------------------------------------------------- */

        const actionCell =
            document.createElement("td");


        const viewButton =
            document.createElement("button");


        viewButton.type =
            "button";


        viewButton.className =
            "btn-view";


        viewButton.innerHTML = `
            <i class="bi bi-eye"></i>
            Details
        `;


        viewButton.addEventListener(
            "click",
            function () {

                showCandidateDetails(
                    applicant
                );

            }
        );


        actionCell.appendChild(
            viewButton
        );

        if (applicant.job_id) {
            const closeButton = document.createElement("button");
            closeButton.type = "button";
            closeButton.className = "btn-view btn-danger ms-1 text-white bg-danger border-0";
            closeButton.style.padding = "4px 8px";
            closeButton.style.fontSize = "12px";
            closeButton.innerHTML = `<i class="bi bi-x-circle me-1"></i> Close Job`;
            closeButton.addEventListener("click", function() {
                closeJobApplications(applicant.job_id);
            });
            actionCell.appendChild(closeButton);
        }


        /* -------------------------------------------------
           Add cells to row
        ------------------------------------------------- */

        row.appendChild(
            applicantCell
        );

        row.appendChild(
            jobCell
        );

        row.appendChild(
            qualificationCell
        );

        row.appendChild(
            experienceCell
        );

        row.appendChild(
            locationCell
        );

        row.appendChild(
            dateCell
        );

        row.appendChild(
            statusCell
        );

        row.appendChild(
            resumeCell
        );

        row.appendChild(
            actionCell
        );


        applicantsTableBody.appendChild(
            row
        );

    });


    loadingMessage.style.display =
        "none";

    errorMessage.style.display =
        "none";

    emptyMessage.style.display =
        "none";

    tableContainer.style.display =
        "block";

}


/* =========================================================
   UPDATE APPLICATION STATUS
========================================================= */

async function updateApplicationStatus(
    applicationId,
    newStatus,
    selectElement
) {

    if (!applicationId) {

        alert(
            "Application ID is missing."
        );

        return;

    }


    try {

        selectElement.disabled = true;


        const response = await fetch(
            `${API_BASE_URL}/${applicationId}/status`,
            {
                method: "PUT",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    status: newStatus
                })
            }
        );


        const data =
            await response.json();


        console.log(
            "Status update response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to update application status."
            );

        }


        /*
         * Update successful
         */

        selectElement.dataset.originalStatus =
            newStatus;


        alert(
            "Application status updated successfully."
        );

    }

    catch (error) {

        console.error(
            "Status update error:",
            error
        );


        /*
         * Restore previous status
         */

        selectElement.value =
            selectElement.dataset.originalStatus;


        alert(
            error.message ||
            "Unable to update status."
        );

    }

    finally {

        selectElement.disabled = false;

    }

}


/* =========================================================
   SHOW CANDIDATE DETAILS
========================================================= */

function showCandidateDetails(applicant) {

    const name =
        applicant.name ||
        "Unknown Candidate";


    const email =
        applicant.email ||
        "Not provided";


    const phone =
        applicant.phone ||
        "Not provided";


    const qualification =
        applicant.qualification ||
        "Not provided";


    const experience =
        applicant.experience ||
        "Not provided";


    const location =
        applicant.location ||
        "Not provided";


    const bio =
        applicant.bio ||
        "No bio provided";


    const jobTitle =
        applicant.job_title ||
        "Unknown Job";


    const company =
        applicant.company ||
        "Not available";


    const status =
        applicant.status ||
        "Applied";


    const appliedDate =
        formatDate(
            applicant.applied_at
        );


    const coverLetter =
        applicant.cover_letter ||
        "No cover letter provided.";


    const avatarLetter =
        name.charAt(0).toUpperCase();


    candidateDetails.innerHTML = `

        <div class="candidate-header">

            <div class="candidate-avatar-large">
                ${escapeHTML(avatarLetter)}
            </div>

            <div>

                <h4>
                    ${escapeHTML(name)}
                </h4>

                <p>
                    ${escapeHTML(email)}
                </p>

            </div>

        </div>


        <div class="row">

            <div class="col-md-6">

                <div class="detail-item">

                    <span class="detail-label">
                        Phone
                    </span>

                    <div class="detail-value">
                        ${escapeHTML(phone)}
                    </div>

                </div>

            </div>


            <div class="col-md-6">

                <div class="detail-item">

                    <span class="detail-label">
                        Location
                    </span>

                    <div class="detail-value">
                        ${escapeHTML(location)}
                    </div>

                </div>

            </div>


            <div class="col-md-6">

                <div class="detail-item">

                    <span class="detail-label">
                        Qualification
                    </span>

                    <div class="detail-value">
                        ${escapeHTML(qualification)}
                    </div>

                </div>

            </div>


            <div class="col-md-6">

                <div class="detail-item">

                    <span class="detail-label">
                        Experience
                    </span>

                    <div class="detail-value">
                        ${escapeHTML(experience)}
                    </div>

                </div>

            </div>


            <div class="col-md-6">

                <div class="detail-item">

                    <span class="detail-label">
                        Applied For
                    </span>

                    <div class="detail-value">
                        ${escapeHTML(jobTitle)}
                    </div>

                </div>

            </div>


            <div class="col-md-6">

                <div class="detail-item">

                    <span class="detail-label">
                        Company
                    </span>

                    <div class="detail-value">
                        ${escapeHTML(company)}
                    </div>

                </div>

            </div>


            <div class="col-md-6">

                <div class="detail-item">

                    <span class="detail-label">
                        Applied Date
                    </span>

                    <div class="detail-value">
                        ${escapeHTML(appliedDate)}
                    </div>

                </div>

            </div>


            <div class="col-md-6">

                <div class="detail-item">

                    <span class="detail-label">
                        Current Status
                    </span>

                    <div class="detail-value">
                        ${escapeHTML(status)}
                    </div>

                </div>

            </div>

        </div>


        <div class="detail-item">

            <span class="detail-label">
                Bio
            </span>

            <div class="bio-box">
                ${escapeHTML(bio)}
            </div>

        </div>


        <div class="detail-item">

            <span class="detail-label">
                Cover Letter
            </span>

            <div class="bio-box">
                ${escapeHTML(coverLetter)}
            </div>

        </div>

    `;


    /*
     * Open Bootstrap modal
     */

    const modalElement =
        document.getElementById(
            "candidateModal"
        );


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );


    modal.show();

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(dateValue) {

    if (!dateValue) {

        return "Not available";

    }


    const date =
        new Date(dateValue);


    if (isNaN(date.getTime())) {

        return dateValue;

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================================
   BUILD RESUME URL
========================================================= */

function buildResumeUrl(resumePath) {

    if (!resumePath) {

        return "#";

    }


    /*
     * If backend already returns
     * complete URL
     */

    if (
        resumePath.startsWith("http://") ||
        resumePath.startsWith("https://")
    ) {

        return resumePath;

    }


    /*
     * Otherwise assume Flask server
     */

    if (resumePath.startsWith("/")) {
        return `${API_ROOT_URL}${resumePath}`;
    }

    return `${API_ROOT_URL}/${resumePath}`;
}


/* =========================================================
   SHOW LOADING
========================================================= */

function showLoading() {

    loadingMessage.style.display =
        "block";

    errorMessage.style.display =
        "none";

    emptyMessage.style.display =
        "none";

    tableContainer.style.display =
        "none";

}


/* =========================================================
   SHOW EMPTY
========================================================= */

function showEmpty() {

    loadingMessage.style.display =
        "none";

    errorMessage.style.display =
        "none";

    emptyMessage.style.display =
        "block";

    tableContainer.style.display =
        "none";

}


/* =========================================================
   SHOW ERROR
========================================================= */

function showError(message) {

    loadingMessage.style.display =
        "none";

    emptyMessage.style.display =
        "none";

    tableContainer.style.display =
        "none";

    errorMessage.style.display =
        "block";

    errorText.textContent =
        message;

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    if (value === null ||
        value === undefined) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   LOGOUT
========================================================= */

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            localStorage.removeItem("token");

            localStorage.removeItem("user");


            window.location.href =
                "../login.html";

        }
    );

}


/* =========================================================
   CLOSE JOB APPLICATIONS
========================================================= */

async function closeJobApplications(jobId) {
    if (!jobId) return;

    if (!confirm("Are you sure you want to close applications for this job? New candidates will no longer be able to apply.")) {
        return;
    }

    try {
        const response = await fetch(`${API_ROOT_URL}/api/jobs/${jobId}/close`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message || "Applications closed successfully.");
            loadApplicants();
        } else {
            alert(data.message || "Failed to close applications.");
        }
    } catch (error) {
        console.error("Error closing job:", error);
        alert("Server error when closing job applications.");
    }
}