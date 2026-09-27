// =======================================
// JOB SEEKER AUTHENTICATION
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
// PAGE LOAD
// =======================================


document.addEventListener(
"DOMContentLoaded",
()=>{


    loadJobs();


});








// =======================================
// LOAD ALL JOBS
// =======================================


let allJobs = [];




async function loadJobs(){



try{


const response =
await fetch(

`${API_URL}/api/jobs`,

{


method:"GET"


}

);





const jobs =
await response.json();




allJobs = jobs;



displayJobs(
jobs
);



}



catch(error){


console.log(
"Job loading error:",
error
);


const container =
document.getElementById(
"jobsContainer"
);


container.innerHTML =

`

<p>
Unable to load jobs
</p>

`;


}



}









// =======================================
// DISPLAY JOB CARDS
// =======================================


function displayJobs(jobs){



const container =
document.getElementById(
"jobsContainer"
);



container.innerHTML="";





if(jobs.length===0){



container.innerHTML=

`

<div class="job-card">


<h4>
No Jobs Found
</h4>


<p>
Currently there are no available jobs.
</p>


</div>


`;


return;


}







jobs.forEach(job=>{





container.innerHTML +=



`

<div class="job-card">


<h4>

${job.title}

</h4>




<div class="company-name">

${job.company || "Company"}

</div>





<div class="job-info">


<span>

<i class="bi bi-geo-alt"></i>

${job.location}

</span>



<span>

<i class="bi bi-briefcase"></i>

${job.job_type}

</span>




<span>

${job.experience || "Experience not specified"}

</span>



</div>






<p class="job-description">


${job.description}

</p>




<button

class="apply-btn"

onclick="viewJob(${job.id})"

>


View Details


</button>



</div>


`;




});



}









// =======================================
// SEARCH JOBS
// =======================================



const searchInput =
document.getElementById(
"searchInput"
);



if(searchInput){



searchInput.addEventListener(
"input",
()=>{



const keyword =
searchInput.value.toLowerCase();




const filteredJobs =
allJobs.filter(job=>



job.title.toLowerCase()
.includes(keyword)

||

(job.skills &&
job.skills.toLowerCase()
.includes(keyword))



);




displayJobs(
filteredJobs
);



});


}









// =======================================
// VIEW JOB DETAILS
// =======================================


function viewJob(id){



window.location.href =

`job-details.html?id=${id}`;


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