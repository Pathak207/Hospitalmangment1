# Doctor Care - Healthcare Management System

This is a [Next.js](https://nextjs.org) healthcare management application for managing patients, appointments, prescriptions, and medical records.

## Getting Started

### 1. Environment Setup

First, copy the example environment file and configure your credentials:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your actual credentials:

```bash
# Database Configuration
MONGODB_URI=your_mongodb_connection_string_here

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_key_here
NEXTAUTH_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

**Important:** Never commit your `.env.local` file to version control. It contains sensitive credentials.

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Seed the Database (Optional)

To populate the database with sample data:

```bash
npm run seed
# or
npm run seed:force  # to overwrite existing data
```

### 4. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **Patient Management**: Add, edit, and view patient records
- **Appointment Scheduling**: Manage appointments with calendar integration
- **Prescription Management**: Create and track prescriptions
- **Medication Database**: Comprehensive medication information
- **Reports & Analytics**: Generate healthcare reports
- **User Authentication**: Secure login with NextAuth.js
- **Real-time Settings Management**: Changes in settings are immediately reflected across all pages without requiring page reload

## Project Structure

- `/app` - Next.js 13+ app directory with pages and API routes
- `/components` - Reusable React components
- `/lib` - Utility functions and database connections
- `/models` - MongoDB/Mongoose data models
- `/scripts` - Database seeding and utility scripts

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Recent Updates

### Global Settings Context Implementation

The application now features a global settings context that allows real-time updates of practice settings across all pages:

#### Key Features:
- **Date Format Settings**: Choose from MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, or MMM DD, YYYY
- **Currency Settings**: Support for USD, EUR, GBP, CAD, AUD, INR with proper formatting
- **Real-time Updates**: Changes in settings are immediately reflected across all pages without requiring page reload
- **Persistent Storage**: Settings are saved to localStorage and synchronized across browser tabs

#### How It Works:
1. The `SettingsProvider` wraps the entire application
2. Components use the `useSettings()` hook to access formatting functions
3. When settings are updated, a custom event notifies all components
4. Date and currency formatting is automatically applied throughout the application

#### Usage:
```tsx
import { useSettings } from '@/lib/settings-context';

function MyComponent() {
  const { formatDate, formatCurrency, settings, updateSettings } = useSettings();
  
  return (
    <div>
      <p>Date: {formatDate(new Date())}</p>
      <p>Price: {formatCurrency(199.99)}</p>
    </div>
  );
}
```

#### Components Using Real-time Settings:
- **Payments Page**: Currency formatting with selected currency symbol and format
- **Appointments Page**: Date formatting according to selected format
- **Reports Page**: Both date and currency formatting
- **Prescriptions Page**: Date formatting for prescription dates
- **Settings Page**: Real-time preview of format changes

#### Technical Implementation:
- Uses React Context API for state management
- Custom event system for same-tab updates
- Storage event listener for cross-tab synchronization
- Fallback formatting for unsupported currencies
- Type-safe with TypeScript interfaces

## Environment Variables

Create a `.env.local` file with the following variables:

```
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=your_mongodb_connection_string
```

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: MongoDB with Mongoose
- **UI Components**: Custom components with Radix UI primitives
- **Styling**: Tailwind CSS with dark mode support
- **State Management**: React Context API, SWR for data fetching
