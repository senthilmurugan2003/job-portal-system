// =======================================
// JOB DETAILS AUTHENTICATION
// =======================================


const token = localStorage.getItem("token");

const userData = localStorage.getItem("user");


const API_URL = window.API_URL || (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:5000" : (localStorage.getItem("API_URL") || "https://web-production-0d22b.up.railway.app"));



if(!token){

    window.location.href="../login.html";

}



let user = null;



if(userData){

    user = JSON.parse(userData);

}




// Role Check


if(!user || user.role !== "job_seeker"){


    alert(
        "Only job seekers can access this page"
    );


    window.location.href="../login.html";


}







// =======================================
// GET JOB ID FROM URL
// =======================================


const urlParams =
new URLSearchParams(
    window.location.search
);



const jobId =
urlParams.get("id");






if(!jobId){


    alert(
        "Job not found"
    );


    window.location.href =
    "jobs.html";


}









// =======================================
// LOAD JOB DETAILS
// =======================================


document.addEventListener(
"DOMContentLoaded",
()=>{


    loadJobDetails();


});








async function loadJobDetails(){



try{


const response =
await fetch(

`${API_URL}/api/jobs/${jobId}`

);



const job =
await response.json();





const container =
document.getElementById(
"jobDetails"
);





if(response.ok){



container.innerHTML =



`

<h1 class="job-title">

${job.title}

</h1>



<p class="company-name">

<i class="bi bi-building"></i>

Company

</p>




<div class="job-meta">


<span>

<i class="bi bi-geo-alt"></i>

${job.location}

</span>



<span>

<i class="bi bi-briefcase"></i>

${job.job_type}

</span>



<span>

${job.experience || "Not Specified"}

</span>



<span>

${job.salary || "Salary not mentioned"}

</span>


</div>






<h3 class="section-title">

Job Description

</h3>



<p class="description">

${job.description}

</p>







<h3 class="section-title">

Required Skills

</h3>



<p class="description">

${job.skills || "Skills not mentioned"}

</p>






<button

class="apply-btn"

id="applyBtn"

>


Apply Now


</button>


`;





const applyBtn =
document.getElementById(
"applyBtn"
);



applyBtn.addEventListener(
"click",
applyJob
);



}

else{


container.innerHTML =

`

<h3>
Job not found
</h3>

`;

}



}



catch(error){



console.log(
"Job details error:",
error
);



}



}









// =======================================
// APPLY JOB
// =======================================



async function applyJob(){



try{


const response =
await fetch(

`${API_URL}/api/applications/apply/${jobId}`,

{


method:"POST",


headers:{


"Authorization":
`Bearer ${token}`,


"Content-Type":
"application/json"


}


}

);





const data =
await response.json();





if(response.ok){



alert(
"Job applied successfully"
);



}

else{


alert(

data.message ||
"Unable to apply"

);


}



}



catch(error){


console.log(
"Apply Error:",
error
);


alert(
"Server connection failed"
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
(e)=>{


e.preventDefault();



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