# EcoColeta

Desktop application connecting residents with recycling collection companies.

## Stack

- **Frontend**: Electron + React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (dev) with Prisma ORM
- **Real-time**: Socket.IO
- **Maps**: Google Maps API

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
# Install root dependencies
npm install

# Install server dependencies (auto via workspaces)
cd server
npx prisma generate
npx prisma db push
npx tsx src/database/seed.ts
```

### Development

```bash
# Start backend server
npm run dev:server

# Or start everything
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Architecture

See the full plan at `.mimocode/plans/` for detailed architecture, data models, and API contracts.
