# HackPSU Check-in App

A comprehensive event management web application designed for HackPSU organizers and judges to handle participant check-ins, project judging, and event analytics during hackathon events.

## Project Overview

The HackPSU Check-in App serves as the central management platform for HackPSU events, providing real-time check-in capabilities, project evaluation workflows, and administrative tools. Built as a Progressive Web App (PWA), it functions seamlessly on mobile devices for on-the-ground event management.

**Target Users:** HackPSU organizers, judges, and volunteer staff
**Primary Use Cases:**
- QR code-based participant check-ins for events
- Real-time project judging and scoring
- Event analytics and attendance tracking
- Manual participant management and administrative tools

**Key Capabilities:**
- Camera-based QR code scanning for instant check-ins
- Comprehensive project judging interface with customizable criteria
- Real-time analytics dashboards with interactive charts
- Role-based authentication and authorization system
- Offline-capable PWA functionality

## Tech Stack

### Core Framework
- **Next.js** - React framework providing App Router architecture, server-side rendering, and optimized build system for production deployment
- **React** - Component-based UI library with hooks for state management and lifecycle handling
- **TypeScript** - Static type checking for enhanced code reliability and developer experience

### Styling & UI Components
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development and consistent design system
- **Radix UI** - Accessible, unstyled component primitives providing robust form controls, dialogs, and interactive elements
- **Material-UI Icons** - Comprehensive icon library integrated with React components
- **Framer Motion** - Animation library for smooth transitions and interactive UI feedback
- **Lucide React** - Modern icon set with consistent styling and SVG optimization

### Authentication & Backend Integration
- **Firebase** - Backend-as-a-service providing authentication, real-time database, and cloud functions
- **JWT Decode** - Token parsing for role-based authorization and session management
- **Axios** - HTTP client for API communications with comprehensive error handling

### Form Handling & Validation
- **React Hook Form** - Performant form library with minimal re-renders and built-in validation
- **React Query (TanStack Query)** - Server state management with caching, synchronization, and optimistic updates

### Analytics & Monitoring
- **PostHog** - Product analytics platform for user behavior tracking and feature usage insights
- **Vercel Analytics** - Performance monitoring and Core Web Vitals tracking
- **Chart.js + React-ChartJS-2** - Interactive data visualization for analytics dashboards
- **Recharts** - React-native chart library for responsive data visualization

### Development Tools
- **ESLint** - Code linting with Next.js-specific rules and best practices
- **Prettier** - Code formatting for consistent style across the codebase
- **Husky** - Git hooks for pre-commit code quality checks
- **Jest + Testing Library** - Unit testing framework with React component testing utilities

## Architecture & Design Decisions

### App Router Structure
- Implements Next.js 13+ App Router for file-based routing with layout nesting
- Page-level components handle route-specific logic and data fetching
- Shared layouts provide consistent navigation and authentication context

### Authentication Strategy
- Custom AuthGuard component implementing role-based access control
- Integration with external HackPSU authentication server for centralized user management
- JWT-based session handling with automatic token refresh
- Tiered permission system (None, Volunteer, Team, Executive, Tech, Finance)

### State Management
- React Query for server state with automatic caching and background refetching
- React Context for global authentication and Firebase integration
- Local state management using React hooks for component-specific data
- LocalStorage integration for persistent user preferences and offline functionality

### API Architecture
- Modular API client structure with dedicated entity types and hooks
- Consistent naming conventions across all API modules (entity.ts, hook.ts, provider.ts)
- TypeScript interfaces ensuring type safety across data flows
- Error handling and loading states managed at the hook level

### Styling Architecture
- Tailwind CSS utility classes for rapid development and consistent spacing
- Custom CSS variables for theme customization and brand colors
- Component-level styling with shadcn/ui design system
- Responsive design patterns optimized for mobile-first usage

### Performance Optimizations
- Next.js automatic code splitting and image optimization
- React Query caching reduces redundant API calls
- PWA implementation with service worker for offline functionality
- Lazy loading for non-critical components and routes

## Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- npm, yarn, pnpm, or bun package manager
- Firebase project configuration
- Access to HackPSU authentication system

### Installation
1. Clone the repository
   ```bash
   git clone <repository-url>
   cd check-in
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Configure environment variables
   ```bash
   cp .env.example .env.local
   ```
   Set required Firebase and API configuration variables

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts
- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build production-optimized application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint code analysis
- `npm run format` - Format code with Prettier
- `npm run test` - Execute Jest test suite

### Environment Setup
Configure the following environment variables in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_BASE_URL_V3=your_api_base_url
```

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── globals.css              # Global styles and Tailwind imports
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home page component
│   ├── scan/                    # QR code scanning functionality
│   ├── judging/                 # Project evaluation interface
│   ├── manual/                  # Manual check-in tools
│   ├── schedule/                # Event schedule display
│   └── tools/                   # Administrative utilities
├── common/
│   ├── api/                     # API client modules
│   │   ├── event/              # Event management API
│   │   ├── judging/            # Project scoring API
│   │   ├── user/               # User management API
│   │   └── [module]/           # Additional API modules
│   │       ├── entity.ts       # TypeScript type definitions
│   │       ├── hook.ts         # React Query hooks
│   │       └── provider.ts     # API client functions
│   ├── config/                 # Application configuration
│   │   ├── environment.ts      # Environment variable handling
│   │   └── firebase.ts         # Firebase initialization
│   ├── context/                # React Context providers
│   │   ├── AuthGuard.tsx       # Authentication wrapper
│   │   ├── FirebaseProvider.tsx # Firebase integration
│   │   └── LayoutProvider.tsx   # Global layout state
│   └── types/                  # Shared TypeScript definitions
├── components/
│   ├── ui/                     # Reusable UI components (shadcn/ui)
│   ├── BottomNavbar.tsx        # Mobile navigation component
│   ├── CheckInLogTable.tsx     # Data table for check-in history
│   └── PWAInstallPrompt.tsx    # Progressive Web App installation
└── lib/
    └── utils.ts                # Utility functions and helpers
```

## Key Features

### QR Code Scanning
- Real-time camera-based QR code detection using jsQR library
- Automatic participant check-in with duplicate prevention
- Visual feedback system with scanning status indicators
- Support for multiple concurrent events and manual scanning mode

### Project Judging System
- Multi-criteria scoring interface with customizable evaluation categories
- Track-specific judging criteria (Machine Learning, Entrepreneurship, Timeless Tech)
- Real-time score submission with optimistic UI updates
- Local note-taking functionality with persistent storage
- Historical score review and editing capabilities

### Event Management
- Dynamic event selection with real-time synchronization
- Attendance tracking and analytics visualization
- Manual check-in tools for edge cases and administrative needs
- Comprehensive logging system for audit trails

### Analytics Dashboard
- Interactive charts displaying check-in trends and attendance metrics
- Real-time data visualization with Chart.js integration
- Exportable reports for post-event analysis
- Performance monitoring and usage analytics

## Deployment

The application is optimized for deployment on Vercel with automatic PWA generation and Firebase integration. The build process includes:

- Static asset optimization and image compression
- Service worker generation for offline functionality
- PostHog analytics integration with custom routing
- Firebase security rules validation

## Contributing

### Code Standards
- Follow TypeScript strict mode guidelines with comprehensive type definitions
- Implement responsive design patterns using Tailwind CSS utilities
- Maintain consistent API patterns across all modules
- Include comprehensive error handling and loading states

### Development Workflow
- Create feature branches from main for all development work
- Run lint and format checks before committing changes
- Write unit tests for new components and utility functions
- Update documentation for significant feature additions or API changes