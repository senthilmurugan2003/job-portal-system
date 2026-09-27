// =======================================
// JOB SEEKER AUTHENTICATION
// =======================================

const token = localStorage.getItem("token");

const userData = localStorage.getItem("user");

const API_URL = window.API_URL || (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:5000" : (localStorage.getItem("API_URL") || "https://web-production-0d22b.up.railway.app"));


// Check token

if (!token) {

    window.location.href = "../login.html";

}



let user = null;


if (userData) {

    user = JSON.parse(userData);

}


// Check role

if (!user || user.role !== "job_seeker") {


    alert(
        "Only job seekers can access this page"
    );


    window.location.href = "../login.html";

}





// =======================================
// PAGE LOAD
// =======================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadApplications();

    }
);






// =======================================
// LOAD MY APPLICATIONS
// =======================================

async function loadApplications() {


    const container =
        document.getElementById(
            "applicationsContainer"
        );


    try {


        const response = await fetch(

            `${API_URL}/api/applications/my`,

            {

                method: "GET",

                headers: {

                    "Authorization":
                        `Bearer ${token}`,

                    "Content-Type":
                        "application/json"

                }

            }

        );



        const data = await response.json();



        console.log(
            "Applications API Response:",
            data
        );




        if (!response.ok) {


            container.innerHTML = `

            <div class="application-card">

                <h4>
                    ${data.msg || data.message || 
                    "Unable to load applications"}
                </h4>

            </div>

            `;


            return;

        }





        displayApplications(data);



    }

    catch(error) {


        console.error(
            "Application Error:",
            error
        );



        container.innerHTML = `

        <div class="application-card">

            <h4>
                Server connection failed
            </h4>

        </div>

        `;


    }


}







// =======================================
// DISPLAY APPLICATIONS
// =======================================


function displayApplications(applications) {



    const container =
        document.getElementById(
            "applicationsContainer"
        );



    container.innerHTML = "";





    if (!applications || applications.length === 0) {


        container.innerHTML = `

        <div class="application-card">


            <h4>
                No Applications Found
            </h4>


            <p>
                You have not applied for any jobs yet.
            </p>


        </div>

        `;


        return;

    }






    applications.forEach(app => {



        let statusClass =
            "status-applied";



        if (app.status) {


            let status =
                app.status.toLowerCase();



            if (status === "shortlisted") {

                statusClass =
                    "status-shortlisted";

            }


            else if (status === "interview") {

                statusClass =
                    "status-interview";

            }


            else if (status === "selected") {

                statusClass =
                    "status-selected";

            }


            else if (status === "rejected") {

                statusClass =
                    "status-rejected";

            }


        }






        container.innerHTML += `


        <div class="application-card">


            <h3 class="job-title">

                ${app.role || "Job Role"}

            </h3>



            <p class="company">


                <i class="bi bi-building"></i>

                ${app.company || "Company"}

            </p>




            <div class="details">



                <p>

                    <i class="bi bi-geo-alt"></i>

                    ${app.location || "Not available"}

                </p>




                <p>

                    <i class="bi bi-briefcase"></i>

                    ${app.job_type || "-"}

                </p>




                <p>

                    <i class="bi bi-cash"></i>

                    ${app.salary || "-"}

                </p>



                <p>

                    <i class="bi bi-calendar"></i>

                    Applied Date:

                    ${
                        app.applied_at
                        ?
                        new Date(app.applied_at)
                        .toLocaleDateString()
                        :
                        "-"
                    }

                </p>



            </div>





            <span class="status ${statusClass}">


                ${app.status || "Applied"}


            </span>



        </div>


        `;



    });



}








// =======================================
// LOGOUT
// =======================================


const logout =
    document.querySelector(
        ".logout a"
    );



if (logout) {


    logout.addEventListener(
        "click",
        (event) => {


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