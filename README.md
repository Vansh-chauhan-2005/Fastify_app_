# Fastify Backend & Asset Manager

A production-ready, high-performance RESTful API built using **Fastify** and **MongoDB**, designed for speed and strict schema validation.

## 🚀 Key Features

- **High-Performance Architecture:** Leverages Fastify's lightning-fast asynchronous routing and built-in AJV environment schema validation (`@fastify/env`).
- **Secure Authentication:** Complete Auth flow including password hashing (`bcryptjs`), stateless `JWT` verification middleware, and a secure token-based password reset mechanism.
- **Asset & File Management:** Handles multipart file uploads using `@fastify/multipart` with stream pipelines, local storage routing, and static file serving.
- **Modular Codebase:** Clean separation of concerns with dedicated controllers, Mongoose models, and scoped plugin routing.

## 🛠️ Tech Stack

- **Framework:** Fastify, Node.js
- **Database:** MongoDB, Mongoose
- **Security & Auth:** JSON Web Tokens (JWT), Bcrypt.js, Crypto
- **Utilities:** `@fastify/sensible`, `@fastify/cors`, `@fastify/multipart`, `@fastify/static`
