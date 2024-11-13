# AI Assistant

## Table of Contents
- [Overview](#overview)
- [Installation and Setup](#installation-and-setup)
- [API Documentation](#api-documentation)
  - [Endpoints](#endpoints)
- [User Guide](#user-guide)
  - [Features](#features)
  - [Usage Instructions](#usage-instructions)
- [Contributing](#contributing)
- [License](#license)

---

## Overview
- An AI-Assistant that helps improve documents text and grammar.

---

## Installation and Setup

### Prerequisites
- Python
- Node 18>  
- ReactJs

### Installation
1. **Clone the repository**:
    ```bash
    git clone https://github.com/ru0ya/AI-Assistant.git
    cd AI-Assistant
    ```
2. **Install dependencies**:
    ```bash

    pip3 install -r requirements.txt
    
    # Frontend dependencies (example for Node.js)
    cd frontend/assistant
    npm install
    ```

3. **Environment Variables**:
    - Create a `.env` file in the project root.
    - Add necessary environment variables:
        ```plaintext
        SECRET_KEY=your_secret_key
        DATABASE_URL=your_database_url
        ```

4. **Run Migrations** (if applicable):
    ```bash
    python manage.py migrate
    ```

5. **Start the Application**:
    - Backend:
      ```bash
      python manage.py runserver
      ```
    - Frontend:
      ```bash
      npm start
      ```

---

## API Documentation

### Base URL
- http://127.0.0.1:8000

### Endpoints

#### Authentication
- **`POST /user-auth/login/`** - Login to the application.
- **`POST /user/registration/`** - Register a new user.

#### User
- **`GET /user-auth/user/`** - Retrieve user information.

#### Documents
- **`GET /documents/`** - List all documents.
- **`POST /documents/upload/`** - Upload a document.
- **`GET /documents/{id}/`** - Retrieve a single document.
- **`PUT /documents/{id}/`** - Update a document.
- **`DELETE /documents/{id}/`** - Delete a document.

Each endpoint includes:
- **Parameters**: List of parameters, both required and optional.
- **Response**: Example JSON response for success and error cases.
- **Status Codes**: Expected HTTP status codes for each endpoint.
- (Swagger Docs)[http://127.0.0.1:8000/swagger/]
- (Redocs)[http://127.0.0.1:8000/redoc/#tag/user-auth/operation/user-auth_login_create]

---

## User Guide

### Features
- SignUp: User signs up to the application.
- SignIn: User signs in with their credentials.
- Upload Document: User uploads document.   
- Compare Document: User compares their old document with new and improved document.

### Usage Instructions

#### Accessing the Application
1. Go to `http://localhost:3000` to open the frontend application.

#### Login and Registration
- **Register**: Enter required information and submit.
- **Login**: Use your credentials to access your account.

#### Navigating the Application
- Document Upload: Upload your document.
- Document Compare: Compare your documents.

---

## Technologies
- Django
- ReactJs
- spacy  


