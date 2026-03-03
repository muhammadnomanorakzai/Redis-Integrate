🟢 STEP 5 — Documentation (Very Important)

Create README.md

Include:

📌 Redis Integrated Todo App
🛠 Tech Stack

Node.js

Express.js

MongoDB Atlas

Redis

WSL Ubuntu

🚀 Features

Add Todo

Get Todos

Redis caching

TTL 30 seconds

Cache invalidation on create

🧠 How Redis Works Here

GET /todos

Check Redis

If found → return cached data

Else → fetch from MongoDB

Store in Redis with TTL

POST /add

Add new todo
🔧 Run Locally (WSL Ubuntu)
git clone <repo>
cd project
yarn install
redis-server
node index.js
🌍 Deployment

Deployed on Vercel:
https://redis-integrate.vercel.app/

Delete Redis key

Cache refreshed on next request
