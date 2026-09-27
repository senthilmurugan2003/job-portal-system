// =======================================
// RECRUITER DASHBOARD AUTHENTICATION
// =======================================


const token = localStorage.getItem("token");

const userData = localStorage.getItem("user");


const API_URL = window.API_URL || (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:5000" : (localStorage.getItem("API_URL") || "https://web-production-0d22b.up.railway.app"));



if(!token){

    window.location.href = "../login.html";

}




let user = null;


if(userData){

    user = JSON.parse(userData);

}







// =======================================
// PAGE LOAD
// =======================================


document.addEventListener(
"DOMContentLoaded",
()=>{


    displayRecruiterDetails();


    loadCompanyProfile();


    loadRecruiterJobs();


    loadRecruiterApplications();


}

);








// =======================================
// DISPLAY USER DETAILS
// =======================================


function displayRecruiterDetails(){


    if(!user){

        return;

    }



    const name =
    document.querySelector(
        ".user-profile h6"
    );



    const role =
    document.querySelector(
        ".user-profile span"
    );



    const image =
    document.querySelector(
        ".user-profile img"
    );




    if(name){

        name.textContent =
        user.name;

    }



    if(role){

        role.textContent =
        "Recruiter";

    }



    if(image){

        image.src =
        `https://ui-avatars.com/api/?name=${user.name}`;

    }


}








// =======================================
// LOAD COMPANY PROFILE
// =======================================


async function loadCompanyProfile(){



try{


const response =
await fetch(

`${API_URL}/api/company/profile`,

{

method:"GET",


headers:{


Authorization:
`Bearer ${token}`


}


}

);



const data =
await response.json();





const container =
document.getElementById(
"companyDetails"
);




if(!container){

    return;

}





if(response.ok){


container.innerHTML =


`

<p>
<b>Company Name:</b>
${data.company_name || "Not Added"}
</p>


<p>
<b>Industry:</b>
${data.industry || "Not Added"}
</p>


<p>
<b>Location:</b>
${data.location || "Not Added"}
</p>


<p>
<b>Website:</b>
${data.website || "Not Added"}
</p>


`;



}

else{


container.innerHTML =

`

<p>
Create company profile first
</p>

`;



}



}



catch(error){


console.log(
"Company Error:",
error
);



}



}








// =======================================
// LOAD RECRUITER JOBS
// =======================================


async function loadRecruiterJobs(){


try{


const response =
await fetch(

`${API_URL}/api/jobs/recruiter`,

{

method:"GET",


headers:{


Authorization:
`Bearer ${token}`


}


}

);



const jobs =
await response.json();





const container =
document.getElementById(
"recentJobs"
);



if(!container){

return;

}




container.innerHTML="";





        const activeJobs = Array.isArray(jobs)
            ? jobs.filter(j => (j.status || "").toLowerCase() === "open")
            : [];

        const jobCount = document.getElementById("jobCount");
        if (jobCount) {
            jobCount.textContent = activeJobs.length;
        }

        if (activeJobs.length === 0) {
            container.innerHTML = `
                <p class="text-muted mb-0">No active jobs posted yet</p>
            `;
            return;
        }

        activeJobs.slice(0, 5).forEach(job => {
            container.innerHTML += `
                <div class="job-item">
                    <div>
                        <h5>${escapeHTML(job.title)}</h5>
                        <p>${escapeHTML(job.location || "Remote")}</p>
                    </div>
                    <span class="status-badge open">open</span>
                </div>
            `;
        });





}



catch(error){


console.log(
"Jobs Error:",
error
);


}



}









// =======================================
// LOAD APPLICATIONS
// =======================================


async function loadRecruiterApplications(){



try{


const response =
await fetch(

`${API_URL}/api/applications/recruiter`,

{

method:"GET",


headers:{


Authorization:
`Bearer ${token}`


}


}

);



const applications =
await response.json();





    const count = document.getElementById("applicationCount");
    const shortlisted = document.getElementById("shortlistedCount");

    if (count && Array.isArray(applications)) {
        count.textContent = applications.length;
    }

    if (shortlisted && Array.isArray(applications)) {
        const countShort = applications.filter(a => (a.status || "").toLowerCase() === "shortlisted").length;
        shortlisted.textContent = countShort;
    }





}



catch(error){


console.log(
"Application Error:",
error
);


}



}









// =======================================
// LOGOUT
// =======================================


const logout =
document.querySelector(
".logout a"
);



if(logout){


logout.addEventListener(
"click",
(event)=>{


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
// ESCAPE HTML HELPER
// =======================================
function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
