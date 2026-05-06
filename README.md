# Netflix Client Manager (Portfolio Edition)

A robust, full-stack subscription management system built with **Astro**, **React**, and **Cloudflare D1**. This project was designed to manage shared Netflix (and other services) credentials for clients with automated restriction handling.

## 🚀 Key Features

*   **Admin Dashboard**: Manage Master Accounts (Netflix, HBO, ChatGPT, etc.) and assign them to clients.
*   **Client Portal**: Secure access for clients using unique API Keys to view their assigned credentials and service links.
*   **Automated Link Fetching**: Integration with a background worker to retrieve temporary household access links.
*   **Restriction Logic**: Built-in 7-day restriction for certain services (e.g., ChatGPT) to prevent abuse.
*   **Modern UI**: High-fidelity dark mode interface inspired by premium streaming platforms, using Tailwind CSS and Lucide icons.

## 🛠 Tech Stack

*   **Framework**: Astro 5 (Hybrid Rendering)
*   **Frontend**: React & Tailwind CSS
*   **Database**: Cloudflare D1 (SQLite)
*   **Runtime**: Cloudflare Pages / Workers
*   **Icons**: Lucide React

## 🏁 Getting Started

### 1. Installation

```sh
npm install
```

### 2. Environment Setup

Copy your environment variables to a `.dev.vars` file (for local development):

```bash
AUTH_SECRET=your_secret_here
WORKER_URL=https://your-worker.workers.dev/get-link
```

Update the placeholders in `wrangler.toml` if deploying to Cloudflare.

### 3. Database Setup (Local)

This project uses Cloudflare D1. Initialize your local database with mock data:

```sh
npm run db:setup
```

### 4. Run Development Server

```sh
npm run dev
```

Visit [http://localhost:4321/admin-login](http://localhost:4321/admin-login) for the Admin Panel.
*   **Demo Email**: `admin@example.com`
*   **Demo Password**: `admin123`

Visit [http://localhost:4321/login](http://localhost:4321/login) for the Client Portal.
*   **Example API Key**: `key_12345`

## 🔒 Security Note

All sensitive production credentials, API keys, and private worker URLs have been removed from this public repository and replaced with environment variables/placeholders. Use `.env` or Wrangler secrets for production deployments.
