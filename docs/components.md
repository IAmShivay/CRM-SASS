# Component Documentation

## Overview

This document provides detailed information about the reusable components in the CRM Sales Platform. Components are organized by their functional areas and include usage examples, props documentation, and best practices.

## Table of Contents

1. [UI Components](#ui-components)
2. [Dashboard Components](#dashboard-components)
3. [Layout Components](#layout-components)
4. [Theme Components](#theme-components)

## UI Components

### Location: `/components/ui/*`

Common UI components used throughout the application.

#### Toast Component

- **File**: `hooks/use-toast.ts`
- **Usage**: Provides toast notifications across the application
- **Props**: Inherits from native toast library
- **Example**:

```typescript
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();
toast({
  title: "Success",
  description: "Operation completed successfully",
});
```

## Dashboard Components

### Location: `/components/dashboard/*`

Components specific to the dashboard functionality.

#### Lead Notifications

- **File**: `hooks/useLeadNotifications.tsx`
- **Purpose**: Manages and displays lead-related notifications
- **Features**:
  - Real-time updates
  - Read/unread status
  - Notification grouping
  - Action handlers

## Layout Components

### Location: `/components/layout/*`

Components that handle the application's layout structure.

#### Theme Toggle

- **File**: `components/theme-toggle.tsx`
- **Purpose**: Handles dark/light theme switching
- **Implementation**: Uses system preferences and local storage
- **Example**:

```typescript
import { ThemeToggle } from "@/components/theme-toggle";

<ThemeToggle />;
```

## Best Practices

1. **Component Structure**

   - Keep components small and focused
   - Use TypeScript interfaces for props
   - Implement error boundaries where necessary

2. **State Management**

   - Use hooks for complex state logic
   - Implement proper loading states
   - Handle error cases gracefully

3. **Performance**

   - Implement React.memo for expensive renders
   - Use proper key props in lists
   - Lazy load components when appropriate

4. **Accessibility**
   - Include ARIA labels
   - Ensure keyboard navigation
   - Maintain proper contrast ratios

## Adding New Components

When adding new components:

1. Create component in appropriate directory
2. Add TypeScript interfaces for props
3. Include JSDoc documentation
4. Add usage examples
5. Update this documentation

## Testing

Components should have:

1. Unit tests for logic
2. Integration tests for complex interactions
3. Snapshot tests for UI consistency
4. Accessibility tests

## Version History

| Version | Date | Changes |
| ------- | ---- | ------- |
