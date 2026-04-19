# CollabOne Frontend (`one-collab`)

This is the primary user-facing interface for **CollabOne**, a federated multi-college platform. It is built with **Next.js** using the modern App Router architecture, providing a seamless and responsive experience for students and researchers.

## 🚀 Features

- **Tenant-Aware Authentication**: Seamlessly integrates with the backend's multi-tenant architecture. Client requests correctly map and pass the necessary tenant headers (`Host` mapping / `X-College-Key`) to ensure complete data isolation.
- **Project Discovery & Collaboration**: A dynamic UI to browse projects across different colleges, join teams, and manage project workflows.
- **Matchmaking Dashboard**: Visually displays intelligent matchmaking recommendations for both users looking for projects, and projects looking for specific talent, based on the backend's Jaccard skill overlaps and reputation scores.
- **Unified Messaging**: Real-time ready chat interfaces for team communication securely isolated within project scopes.
- **Reputation Ecosystem**: Interfaces for submitting peer reviews and viewing dynamically calculated reputation points after collaborations.

## 📋 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (or Node.js 18+)
- The CollabOne backend must be running locally (usually on `http://localhost:8000`).
- Make sure your local `hosts` file is configured for tenant routing as described in the backend documentation (e.g., routing `projects.a.localhost` to `127.0.0.1`).

### Installation

Navigate into the application folder and install the dependencies:

```bash
bun install
```

### Running the Development Server

Start the Next.js development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser. To test tenant logic and domain isolation locally, you may need to access the app via custom subdomains specified in your hosts file (e.g., `projects.a.localhost:3000`).

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, v16+)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI Primitives, Lucide React icons
- **Animations**: Framer Motion

## 📖 Learn More

For more details on the backend architecture, API endpoints, and database schema that power this frontend, please refer to the main repository's `/docs` directory or the backend `README.md`.
