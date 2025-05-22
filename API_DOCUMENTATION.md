# SQL Analytics Platform API Documentation

## Database Schema

### Tables

#### 1. customers
| Column      | Type         | Nullable | Default                    | Key  |
|-------------|--------------|----------|----------------------------|------|
| id          | integer      | No       | nextval('customers_id_seq')| PK   |
| name        | varchar      | Yes      | -                          | -    |
| email       | varchar      | Yes      | -                          | -    |
| city        | varchar      | Yes      | -                          | -    |
| signup_date | date         | Yes      | -                          | -    |

#### 2. departments
| Column    | Type         | Nullable | Default                      | Key  |
|-----------|--------------|----------|------------------------------|------|
| id        | integer      | No       | nextval('departments_id_seq')| PK   |
| name      | varchar      | Yes      | -                            | -    |
| location  | varchar      | Yes      | -                            | -    |

#### 3. employees
| Column        | Type         | Nullable | Default                    | Key  |
|---------------|--------------|----------|------------------------------|------|
| id            | integer      | No       | nextval('employees_id_seq') | PK   |
| first_name    | varchar      | Yes      | -                            | -    |
| last_name     | varchar      | Yes      | -                            | -    |
| department_id | integer      | Yes      | -                            | FK   |
| hire_date     | date         | Yes      | -                            | -    |
| salary        | numeric      | Yes      | -                            | -    |

## API Endpoints

### Authentication

#### 1. Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
- Status: 201 Created
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "integer",
    "username": "string",
    "email": "string"
  }
}
```

#### 2. Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
- Status: 200 OK
```json
{
  "message": "Login successful",
  "token": "string",
  "user": {
    "id": "integer",
    "username": "string",
    "email": "string"
  }
}
```

### Query Operations

#### 1. Execute Query
```http
POST /api/queries/execute
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "query": "string"
}
```

**Response:**
- Status: 200 OK
```json
{
  "result": [
    {
      "column1": "value1",
      "column2": "value2"
    }
  ]
}
```

#### 2. Get Query History
```http
GET /api/queries/history
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
- Status: 200 OK
```json
{
  "history": [
    {
      "id": "integer",
      "query_text": "string",
      "created_at": "datetime",
      "user_id": "integer"
    }
  ]
}
```

#### 3. Delete Query
```http
DELETE /api/queries/{queryId}
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
- Status: 200 OK
```json
{
  "message": "Query deleted successfully"
}
```

### Schema Operations

#### 1. Get Tables
```http
GET /api/schema/tables
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
- Status: 200 OK
```json
{
  "tables": [
    "string"
  ]
}
```

#### 2. Get Table Schema
```http
GET /api/schema/tables/{tableName}
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
- Status: 200 OK
```json
{
  "columns": [
    {
      "name": "string",
      "type": "string",
      "nullable": "boolean",
      "default": "string",
      "key": "string"
    }
  ]
}
```

## Example Queries

### 1. Basic Employee Department Join
```sql
SELECT 
    e.first_name,
    e.last_name,
    d.name as department_name,
    d.location
FROM employees e
JOIN departments d ON e.department_id = d.id
LIMIT 10;
```

### 2. Department Statistics
```sql
SELECT 
    d.name as department,
    COUNT(e.id) as employee_count,
    AVG(e.salary) as average_salary
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.name
ORDER BY employee_count DESC;
```

### 3. Customer Analysis
```sql
SELECT 
    city,
    COUNT(id) as customer_count,
    MIN(signup_date) as first_signup,
    MAX(signup_date) as latest_signup
FROM customers
GROUP BY city
ORDER BY customer_count DESC;
```

## Error Responses

### Common Error Codes

- 400 Bad Request
  - Invalid input data
  - Missing required fields
  - Invalid query syntax

- 401 Unauthorized
  - Missing authentication token
  - Invalid authentication token

- 403 Forbidden
  - Insufficient permissions
  - Invalid operation

- 404 Not Found
  - Resource not found
  - Table not found

- 500 Internal Server Error
  - Database connection error
  - Query execution error

### Error Response Format
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "string"
  }
}
```

## Security

### Authentication
- JWT (JSON Web Token) based authentication
- Token expiration: 24 hours
- Token format: `Bearer <token>`

### Authorization
- Role-based access control
- Query execution permissions
- Schema access permissions

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per hour per user
- Rate limit headers included in response

## Best Practices

1. Always use parameterized queries to prevent SQL injection
2. Include proper error handling
3. Use appropriate HTTP methods
4. Include authentication token in headers
5. Handle rate limiting
6. Use proper content types
7. Implement proper validation
8. Use proper HTTP status codes
9. Include proper documentation
10. Implement proper logging

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```env
VITE_API_URL=http://localhost:5000
JWT_SECRET=your-secret-key
```

3. Start development server:
```bash
npm run dev
```

## Testing

1. Run unit tests:
```bash
npm test
```

2. Run integration tests:
```bash
npm run test:integration
```

## Deployment

1. Build the application:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

## Support

For support, please contact:
- Email: support@example.com
- Documentation: https://docs.example.com
- GitHub Issues: https://github.com/example/repo/issues 