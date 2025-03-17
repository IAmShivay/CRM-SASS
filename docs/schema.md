# Database Schema Documentation

## Overview

This document outlines the database schema for the CRM Sales Platform. The platform uses Supabase (PostgreSQL) as its database system.

## Tables

### Users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
```

### Workspaces

```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Workspace Members

```sql
CREATE TABLE workspace_members (
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (workspace_id, user_id)
);
```

### Leads

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  company VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  source VARCHAR(100),
  assigned_to UUID REFERENCES users(id),
  last_contacted TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_leads_workspace ON leads(workspace_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
```

### Lead Notes

```sql
CREATE TABLE lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id),
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_lead_notes_lead ON lead_notes(lead_id);
```

### Notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES users(id),
  lead_id UUID REFERENCES leads(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
CREATE INDEX idx_notifications_workspace ON notifications(workspace_id);
```

## Relationships

### One-to-Many

- Workspace -> Leads
- User -> Lead Notes
- Lead -> Lead Notes
- User -> Notifications

### Many-to-Many

- Users <-> Workspaces (through workspace_members)

## Enums

### User Roles

```sql
CREATE TYPE user_role AS ENUM (
  'admin',
  'manager',
  'user'
);
```

### Lead Status

```sql
CREATE TYPE lead_status AS ENUM (
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost'
);
```

## Functions and Triggers

### Update Timestamp Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_user_timestamp
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
-- (Similar triggers for other tables)
```

### Notification Creation Trigger

```sql
CREATE OR REPLACE FUNCTION create_lead_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    workspace_id,
    user_id,
    lead_id,
    type,
    title,
    content
  )
  VALUES (
    NEW.workspace_id,
    NEW.assigned_to,
    NEW.id,
    'lead_assigned',
    'New Lead Assigned',
    'You have been assigned a new lead: ' || NEW.name
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lead_assignment_notification
  AFTER INSERT OR UPDATE OF assigned_to ON leads
  FOR EACH ROW
  WHEN (NEW.assigned_to IS NOT NULL)
  EXECUTE FUNCTION create_lead_notification();
```

## Policies

### Row Level Security

```sql
-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view leads in their workspace"
  ON leads FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Similar policies for other operations and tables
```

## Backup and Recovery

1. **Automated Backups**

   - Daily full backups
   - Point-in-time recovery enabled
   - 30-day retention period

2. **Backup Location**
   - Primary: AWS S3
   - Secondary: Google Cloud Storage

## Performance Considerations

1. **Indexing Strategy**

   - Composite indexes for common queries
   - Regular index maintenance
   - Monitor index usage

2. **Partitioning**
   - Leads table partitioned by workspace_id
   - Notifications table partitioned by created_at

## Version History

| Version | Date | Changes                      |
| ------- | ---- | ---------------------------- |
| 1.0.0   | 2024 | Initial schema documentation |
