# CRM Sales Platform

A modern, full-stack CRM (Customer Relationship Management) platform built with Next.js, Supabase, and TypeScript. This platform helps sales teams manage leads, track interactions, and boost productivity through real-time notifications and analytics.

## 🚀 Features

- **Authentication & Authorization**

  - Secure user authentication with Supabase
  - Role-based access control
  - Workspace-based multi-tenancy

- **Lead Management**

  - Real-time lead tracking
  - Lead status updates
  - Automated notifications
  - Lead trend analysis

- **Dashboard**

  - Interactive data visualization
  - Performance metrics
  - Custom widgets
  - Real-time updates

- **Notifications**
  - Real-time lead activity notifications
  - Email notifications
  - Toast notifications
  - Read/unread status tracking

## 🛠️ Tech Stack

- **Frontend:**

  - Next.js 13+ (App Router)
  - TypeScript
  - React
  - Redux (State Management)
  - Tailwind CSS

- **Backend:**

  - Supabase (PostgreSQL)
  - Next.js API Routes
  - Node.js

- **Authentication:**

  - Supabase Auth

- **Development Tools:**
  - ESLint
  - Prettier
  - TypeScript
  - Git

## 📦 Project Structure

```
crm-sales/
├── app/                 # Next.js 13+ App Router
│   ├── (auth)/         # Authentication routes
│   ├── (dashboard)/    # Dashboard routes
│   ├── (home)/         # Home page routes
│   └── providers.tsx    # Global providers
├── components/         # Reusable components
│   ├── ui/            # UI component library
│   ├── dashboard/     # Dashboard components
│   └── layout/        # Layout components
├── hooks/             # Custom React hooks
├── lib/               # Core utilities
│   ├── store/         # State management
│   ├── types/         # TypeScript types
│   └── manager/       # Business logic
├── pages/             # API routes
└── utils/             # Helper functions
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Git
- Supabase account

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/crm-sales.git
   cd crm-sales
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Development

### Code Style

- Follow the ESLint configuration
- Use TypeScript for type safety
- Follow component naming conventions
- Keep components small and focused
- Use custom hooks for logic reuse

### State Management

- Use Redux for global state
- Use React Query for server state
- Implement local state with useState/useReducer
- Follow the flux pattern

### API Routes

- Located in `/pages/api`
- Follow RESTful conventions
- Implement proper error handling
- Use middleware for authentication

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run lint
npm run lint
```

## 📚 Documentation

- [Component Documentation](./docs/components.md)
- [API Documentation](./docs/api.md)
- [Database Schema](./docs/schema.md)

## 🔐 Security

- All API routes are protected
- Authentication using Supabase
- CORS configuration
- Rate limiting implemented
- Input validation on all forms
- XSS protection
- CSRF protection

## 🚀 Deployment

1. Build the application:

   ```bash
   npm run build
   # or
   yarn build
   ```



## 📈 Performance Optimization

- Implement proper caching strategies
- Use Image optimization
- Lazy loading of components
- Code splitting
- Bundle optimization

## 🤝 Development Guidelines

### Code Review Process

- All changes must go through the internal code review process
- Follow the team's branching strategy:
  - `main` - production branch
  - `develop` - development branch
  - `feature/*` - feature branches
  - `hotfix/*` - hotfix branches
- Create detailed pull request descriptions using the company template

### Development Workflow

1. Create a JIRA ticket for the task
2. Branch from `develop` using the correct naming convention
3. Follow the coding standards and patterns established in the codebase
4. Write/update tests as required
5. Submit for code review
6. Address review comments
7. Merge after approval

### Quality Standards

- Maintain minimum 80% test coverage
- Zero critical or high severity issues
- Pass all linting rules
- Update documentation for API changes
- Follow secure coding guidelines

## 📝 License

This project is proprietary software. See the [LICENSE](LICENSE) file in the root directory for the full license text.

All rights reserved. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.


---

© 2024 [Your Company Name]. All Rights Reserved.
