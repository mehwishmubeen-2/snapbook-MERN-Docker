# snapbook-MERN-Docker
Full-stack e-commerce app built with MERN stack, containerized with Docker. MongoDB hosted on Atlas.
#  Snapbook — Full Stack E-Commerce Platform

A full-featured e-commerce web application built with the **MERN stack**, containerized with **Docker** for consistent and portable deployment. Database is hosted on **MongoDB Atlas**.

---

##  Features

- 🛒 Photographer listing with search and filter
- 🔐 User authentication (register / login)
- 💳 Payment integration
- 🧾 Order management
- 📦 Cart functionality
- 👤 User profile & order history

---

##  Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas (cloud-hosted) |
| Containerization | Docker + Docker Compose |

---

##  Docker Setup

This app runs in a **single Docker container**. MongoDB is not containerized — it connects to a **MongoDB Atlas** cloud cluster via URI.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account with a cluster set up

### Run with Docker

```bash
# 1. Clone the repository
git clone https://github.com/mehwishmubeen-2/snapbook-ecommerce.git
cd snapbook-ecommerce

# 2. Create your environment file
cp backend/.env.example backend/.env
# Add your MongoDB Atlas URI and other secrets

# 3. Build and start the container
docker compose up --build

# 4. Visit the app
http://localhost:5055
```

### Stop the container

```bash
docker compose down
```

---

##  Environment Variables

Create a `backend/.env` file:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/snapbook?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret
PORT=5055
```


---

##  docker-compose.yml Overview

```yaml
services:
  snapbook-app:
    build: .
    container_name: snapbook-container
    ports:
      - "5055:5055"
    env_file:
      - ./backend/.env
    restart: unless-stopped
```

> MongoDB runs on **Atlas** (cloud), not as a Docker service — so no `mongo` service is needed here.

---

##  Project Structure

```
snapbook-ecommerce/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── server.js
│   └── .env.example
├── frontend/
│   ├── src/
│   └── public/
├── Dockerfile
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

##  Run Without Docker (Local Dev)

```bash
# Backend
cd backend
npm install
npm start

# Frontend (in a new terminal)
cd frontend
npm install
npm start
```

---

##  Author

**Mehwish Mubeen**
CS Undergraduate — COMSATS University Islamabad (Lahore Campus)
GitHub: [@mehwishmubeen-2](https://github.com/mehwishmubeen-2)

---

##  License

This project is open source and available under the [MIT License](LICENSE).
