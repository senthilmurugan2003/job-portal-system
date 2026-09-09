# Job Portal Database Design


## Database

job_portal_db


## Tables

1. users
2. job_seekers
3. recruiters
4. companies
5. jobs
6. applications

users
------------------
id              PK
name
email           UNIQUE
password_hash
role
created_at
updated_at

job_seekers
------------------
id
user_id        FK
phone
location
qualification
experience
bio
resume_path
created_at

recruiters
------------------
id
user_id        FK
phone
designation
created_at

companies
------------------
id
recruiter_id   FK
company_name
description
location
website
created_at

jobs
------------------
id
company_id     FK
title
description
location
salary
experience
job_type
skills
status
created_at

applications
------------------
id
job_id          FK
job_seeker_id   FK
cover_letter
status
applied_at