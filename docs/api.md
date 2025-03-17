# API Documentation

## Overview

This document details the API endpoints available in the CRM Sales Platform. All API routes are protected and require proper authentication.

## Authentication

All API requests must include a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

## Base URL

```
Production: https://api.your-company.com
Development: http://localhost:3000/api
```

## API Endpoints

### Authentication

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

#### Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "string"
}
```

### Leads

#### Get Leads

```http
GET /api/leads
Query Parameters:
  - page: number
  - limit: number
  - status: string
  - sortBy: string
```

#### Create Lead

```http
POST /api/leads
Content-Type: application/json

{
  "name": "string",
  "email": "string",
  "company": "string",
  "status": "string",
  "source": "string"
}
```

#### Update Lead

```http
PUT /api/leads/:id
Content-Type: application/json

{
  "status": "string",
  "notes": "string"
}
```

### Notifications

#### Get Notifications

```http
GET /api/notifications
Query Parameters:
  - unreadOnly: boolean
  - limit: number
```

#### Mark Notification as Read

```http
PUT /api/notifications/:id/read
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

### Common Error Codes

- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `429`: Rate Limit Exceeded
- `500`: Internal Server Error

## Rate Limiting

- Rate limit: 100 requests per minute per IP
- Rate limit headers included in response:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Webhooks

### Webhook Events

- `lead.created`
- `lead.updated`
- `notification.created`

### Webhook Payload Format

```json
{
  "event": "string",
  "timestamp": "string",
  "data": {}
}
```

## Security

1. **Authentication**

   - JWT-based authentication
   - Token expiration: 1 hour
   - Refresh token expiration: 7 days

2. **Authorization**

   - Role-based access control
   - Workspace-level permissions

3. **Data Protection**
   - All requests must use HTTPS
   - Input validation on all endpoints
   - Rate limiting enabled
   - CORS configuration

## Best Practices

1. **API Calls**

   - Use appropriate HTTP methods
   - Include error handling
   - Implement request timeout
   - Cache responses when appropriate

2. **Error Handling**

   - Catch and handle all errors
   - Log errors appropriately
   - Return meaningful error messages

3. **Performance**
   - Use pagination for large datasets
   - Implement caching strategies
   - Optimize database queries

## Testing

1. **Required Tests**

   - Unit tests for controllers
   - Integration tests for endpoints
   - Load testing for performance
   - Security testing

2. **Test Environment**
   - Separate test database
   - Mock external services
   - CI/CD pipeline integration

## Version History

| Version | Date | Changes                   |
| ------- | ---- | ------------------------- |
| 1.0.0   | 2024 | Initial API documentation |
