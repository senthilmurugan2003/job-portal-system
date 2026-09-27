// =======================================
// DASHBOARD AUTHENTICATION
// =======================================


const token = localStorage.getItem("token");

const userData = localStorage.getItem("user");

const API_URL = window.API_URL || (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:5000" : (localStorage.getItem("API_URL") || "https://web-production-0d22b.up.railway.app"));



if (!token) {

    window.location.href = "../login.html";

}



// Convert user data

let user = null;


if (userData) {

    user = JSON.parse(userData);

}





// =======================================
// PAGE LOAD
// =======================================


document.addEventListener(
    "DOMContentLoaded",
    function () {


        displayUserDetails();


        loadJobSeekerProfile();


        loadJobs();


        loadApplications();


    }
);







// =======================================
// DISPLAY USER DETAILS
// =======================================


function displayUserDetails(){


    if(!user){

        return;

    }


    const nameElements =
    document.querySelectorAll(
        ".user-profile h6"
    );

    nameElements.forEach(
        element => {

            element.textContent =
            user.name;

        }
    );




    const roleElements =
    document.querySelectorAll(
        ".user-profile span"
    );



    roleElements.forEach(
        element => {


            element.textContent =
            formatRole(user.role);


        }
    );




    const avatar =
    document.querySelector(
        ".user-profile img"
    );



    if(avatar){


        avatar.src =
        `https://ui-avatars.com/api/?name=${user.name}`;


    }



}






// =======================================
// FORMAT ROLE
// =======================================


function formatRole(role){


    if(role==="job_seeker"){

        return "Job Seeker";

    }


    if(role==="recruiter"){

        return "Recruiter";

    }


    if(role==="admin"){

        return "Admin";

    }


    return role;


}







// =======================================
// LOGOUT
// =======================================


const logoutButton =
document.querySelector(
    ".logout a"
);



if(logoutButton){


    logoutButton.addEventListener(
        "click",
        function(event){


            event.preventDefault();



            localStorage.removeItem(
                "token"
            );


            localStorage.removeItem(
                "user"
            );



            window.location.href =
            "../login.html";


        }
    );


}








// =======================================
// LOAD JOB SEEKER PROFILE
// =======================================


async function loadJobSeekerProfile(){


try{


const response =
await fetch(

`${API_URL}/api/job-seeker/profile`,

{

method:"GET",


headers:{


"Authorization":
`Bearer ${token}`


}


}

);



const data =
await response.json();





if(response.ok){



const profileName =
document.getElementById("profileName");


if(profileName){

    profileName.textContent =
    user.name;

}


const qualification =
document.getElementById(
"profileQualification"
);


if(qualification){

    qualification.textContent =
    data.qualification ||
    "Qualification not added";

}
const location =
document.getElementById(
"profileLocation"
);


if(location){

    location.textContent =
    data.location ||
    "Location not added";

}



calculateProfileCompletion(
data
);



}

else{


console.log(
data.message
);


}



}


catch(error){


console.log(
"Profile Error:",
error
);


}



}








// =======================================
// PROFILE COMPLETION
// =======================================


function calculateProfileCompletion(data){



let completed = 0;



if(data.phone){

    completed++;

}



if(data.qualification){

    completed++;

}



if(data.location){

    completed++;

}



if(data.resume_path){

    completed++;

}




const percentage =
(completed / 4) * 100;



const element =
document.getElementById(
"profileCompletion"
);



if(element){


element.textContent =
percentage + "%";


}



}








// =======================================
// LOAD AVAILABLE JOBS
// =======================================


async function loadJobs() {
    try {
        const response = await fetch(`${API_URL}/api/job-seeker/recommendations`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const jobs = await response.json();

        const countElement = document.getElementById("jobCount");
        if (countElement && Array.isArray(jobs)) {
            countElement.textContent = jobs.length;
        }

        const container = document.getElementById("recommendedJobs");
        if (!container) return;

        container.innerHTML = "";

        if (!Array.isArray(jobs) || jobs.length === 0) {
            container.innerHTML = `<p class="text-muted text-center py-3">No matching jobs available right now.</p>`;
            return;
        }

        jobs.slice(0, 6).forEach(job => {
            let matchClass = "medium";
            if (job.match_percentage >= 75) matchClass = "high";
            else if (job.match_percentage < 45) matchClass = "low";

            const matchedPills = (job.matched_skills || []).map(s => `<span class="skill-pill matched"><i class="bi bi-check-circle-fill"></i> ${escapeHTML(s)}</span>`).join("");
            const missingPills = (job.missing_skills || []).map(s => `<span class="skill-pill missing"><i class="bi bi-exclamation-triangle-fill"></i> ${escapeHTML(s)}</span>`).join("");

            const breakdownHtml = job.breakdown ? `
                <div class="d-flex flex-wrap gap-2 mt-2 pt-2 border-top small text-secondary">
                    <span class="badge bg-light text-dark border"><i class="bi bi-code-slash text-primary me-1"></i>Skills: ${job.breakdown.skill_score}/40</span>
                    <span class="badge bg-light text-dark border"><i class="bi bi-briefcase text-success me-1"></i>Exp: ${job.breakdown.experience_score}/25</span>
                    <span class="badge bg-light text-dark border"><i class="bi bi-mortarboard text-warning me-1"></i>Qual: ${job.breakdown.qualification_score}/15</span>
                    <span class="badge bg-light text-dark border"><i class="bi bi-geo-alt text-danger me-1"></i>Loc: ${job.breakdown.location_score}/10</span>
                    <span class="badge bg-light text-dark border"><i class="bi bi-person-badge text-info me-1"></i>Role: ${job.breakdown.role_score}/10</span>
                </div>
            ` : '';

            container.innerHTML += `
                <div class="recommendation-card mb-3 p-3">
                    <div class="d-flex align-items-start justify-content-between mb-2">
                        <div>
                            <h5 class="fw-bold mb-1 text-dark">${escapeHTML(job.title)}</h5>
                            <span class="text-muted small"><i class="bi bi-building me-1"></i>${escapeHTML(job.company)} • <i class="bi bi-geo-alt me-1"></i>${escapeHTML(job.location || "Remote")} • <i class="bi bi-clock-history me-1"></i>${escapeHTML(job.experience || "Not specified")}</span>
                        </div>
                        <span class="match-badge ${matchClass} fs-6">
                            <i class="bi bi-lightning-charge-fill"></i> Match: ${job.match_percentage}%
                        </span>
                    </div>

                    ${(job.matched_skills && job.matched_skills.length > 0) ? `
                        <div class="mt-2">
                            <span class="text-muted small fw-bold d-block mb-1">Matched Skills:</span>
                            <div class="d-flex flex-wrap">${matchedPills}</div>
                        </div>
                    ` : ''}

                    ${(job.missing_skills && job.missing_skills.length > 0) ? `
                        <div class="mt-2">
                            <span class="text-muted small fw-bold d-block mb-1">Missing Skills:</span>
                            <div class="d-flex flex-wrap">${missingPills}</div>
                        </div>
                    ` : ''}

                    ${breakdownHtml}

                    <div class="mt-3 pt-2 border-top d-flex align-items-center justify-content-between">
                        <span class="badge bg-light text-dark border">${escapeHTML(job.job_type || "Full Time")}</span>
                        <button class="btn btn-sm btn-primary px-3 rounded-pill" onclick="applyDirectly(${job.job_id})">
                            <i class="bi bi-send me-1"></i> Quick Apply
                        </button>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.log("Jobs Error:", error);
    }
}

async function applyDirectly(jobId) {
    if (!jobId) return;
    try {
        const response = await fetch(`${API_URL}/api/applications/apply/${jobId}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ cover_letter: "Applied via Dashboard Recommendations" })
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message || "Job applied successfully!");
            loadApplications();
        } else {
            alert(data.message || "Could not apply for job.");
        }
    } catch (err) {
        console.error("Apply error:", err);
        alert("Error connecting to server.");
    }
}

function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}









// =======================================
// LOAD APPLICATIONS
// =======================================


async function loadApplications(){


try{


const response =
await fetch(

`${API_URL}/api/applications/my`,

{

method:"GET",

headers:{


"Authorization":
`Bearer ${token}`


}


}

);



const applications =
await response.json();




const countElement =
document.getElementById(
"applicationCount"
);



    if (countElement && Array.isArray(applications)) {
        countElement.textContent = applications.length;
    }

    const tableBody = document.getElementById("recentApplicationsTableBody");
    if (tableBody && Array.isArray(applications)) {
        tableBody.innerHTML = "";
        if (applications.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No applications submitted yet</td></tr>`;
        } else {
            applications.slice(0, 5).forEach(app => {
                let badgeClass = "pending";
                const st = (app.status || "Applied").toLowerCase();
                if (st === "selected") badgeClass = "success";
                else if (st === "rejected") badgeClass = "danger";
                else if (st === "shortlisted") badgeClass = "info";

                tableBody.innerHTML += `
                    <tr>
                        <td>${app.company || "Company"}</td>
                        <td>${app.role || "Job Role"}</td>
                        <td><span class="status ${badgeClass}">${app.status || "Applied"}</span></td>
                    </tr>
                `;
            });
        }
    }
} catch (error) {
    console.log("Application Error:", error);
}



}
