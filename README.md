# Pet Care Pro - Backend API Server

A comprehensive REST API server for the Pet Care Pro mobile application, built with Node.js, Express, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

```bash
npm install
```

### Environment Setup

```bash
cp .env.example .env
```

Update `.env` with your configuration:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/pet-care-db
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

### Development

```bash
npm run dev
```

The server will run on `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── models/           # Mongoose schemas
│   ├── User.ts      # User model (owner, staff, driver)
│   ├── Pet.ts       # Pet model
│   └── Order.ts     # Order/Service model
├── controllers/     # Business logic
│   ├── authController.ts
│   ├── petsController.ts
│   └── ordersController.ts
├── routes/          # API routes
│   ├── authRoutes.ts
│   ├── petRoutes.ts
│   └── orderRoutes.ts
├── middleware/      # Express middleware
│   ├── auth.ts      # Authentication & authorization
│   └── errorHandler.ts
├── services/        # Business logic (future)
├── utils/           # Utilities
│   ├── jwt.ts       # JWT token handling
│   └── errors.ts    # Custom error classes
├── config/          # Configuration
│   └── database.ts  # Database connection
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register**: Create new user account
2. **Login**: Get access and refresh tokens
3. **Refresh**: Get new access token using refresh token
4. **Protected Routes**: Include `Authorization: Bearer <token>` header

### User Roles
- **owner**: Pet owners creating orders
- **staff**: Grooming staff executing services
- **driver**: Pickup/delivery personnel

## 📚 API Endpoints

### Authentication
```
POST   /api/auth/register           - Register new user
POST   /api/auth/login              - Login user
POST   /api/auth/refresh-token      - Refresh access token
GET    /api/auth/profile            - Get user profile (protected)
PUT    /api/auth/profile            - Update profile (protected)
POST   /api/auth/logout             - Logout (protected)
```

### Pets (Owner Routes)
```
GET    /api/pets                    - List pets (protected)
POST   /api/pets                    - Create pet (owner only)
GET    /api/pets/:id                - Get pet details (protected)
PUT    /api/pets/:id                - Update pet (owner only)
DELETE /api/pets/:id                - Delete pet (owner only)
```

### Orders
```
GET    /api/orders                  - List orders (protected)
POST   /api/orders                  - Create order (owner only)
GET    /api/orders/:id              - Get order details (protected)
PUT    /api/orders/:id              - Update order (protected)
PATCH  /api/orders/:id/status       - Update order status (protected)
POST   /api/orders/:id/assign-driver - Assign driver (staff only)
POST   /api/orders/:id/clarifications - Request clarification (protected)
POST   /api/orders/:id/clarifications/:clarificationId/respond - Answer clarification (protected)
```

## 🔄 Data Models

### User
```typescript
{
  name: string,
  email: string,      // unique
  password: string,   // hashed with bcrypt
  phone: string,
  role: 'owner' | 'staff' | 'driver',
  profileImage?: string,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Pet
```typescript
{
  ownerId: ObjectId,
  name: string,
  breed: string,
  age: number,
  size: 'small' | 'medium' | 'large',
  specialNotes?: string,
  profileImage?: string,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Order
```typescript
{
  petId: ObjectId,
  ownerId: ObjectId,
  services: ('grooming' | 'haircut' | 'nails' | 'bath' | 'other')[],
  requirements: {
    grooming?: string,
    haircut?: string,
    nails?: string,
    bath?: string,
    otherRequirements?: string,
    temperamentNotes?: string,
    dietaryNeeds?: string,
    medicalConditions?: string
  },
  status: 'pending' | 'confirmed' | 'picked_up' | 'in_service' | 'completed' | 'delivered' | 'cancelled',
  pickupDateTime: Date,
  estimatedCompletionTime: Date,
  actualCompletionTime?: Date,
  driverId?: ObjectId,
  staffId?: ObjectId,
  notes?: string,
  images?: string[],
  clarificationRequests?: Array<{
    id: string,
    question: string,
    answer?: string,
    askedAt: Date,
    answeredAt?: Date
  }>,
  createdAt: Date,
  updatedAt: Date
}
```

## 🛡️ Error Handling

The API uses consistent error responses:

```typescript
{
  success: false,
  error: string,        // Error message
  code: string,         // Error code (VALIDATION_ERROR, AUTH_ERROR, etc.)
  details?: any        // Additional error details
}
```

### Error Codes
- `VALIDATION_ERROR`: Input validation failed (400)
- `AUTH_ERROR`: Authentication failed (401)
- `FORBIDDEN`: Authorization failed (403)
- `NOT_FOUND`: Resource not found (404)
- `CONFLICT`: Resource already exists (409)
- `SERVER_ERROR`: Internal server error (500)

## 💾 Database

### MongoDB Setup

**Local Development**:
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Cloud (MongoDB Atlas)**:
1. Create account at [mongodb.com/cloud](https://www.mongodb.com/cloud)
2. Create a cluster
3. Get connection string
4. Update `.env` with connection string

### Database Indexes
- User: `{ email: 1 }`
- Pet: `{ ownerId: 1 }`
- Order: `{ ownerId: 1, driverId: 1, staffId: 1, status: 1, pickupDateTime: 1 }`

## 🧪 Code Quality

### Linting
```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

### Formatting
```bash
npm run format      # Format code
npm run format:check # Check formatting
```

## 📝 Features Implemented

### Phase 1: Core Setup ✅
- ✅ Express server with TypeScript
- ✅ MongoDB connection
- ✅ JWT authentication
- ✅ User model with bcrypt password hashing
- ✅ Role-based access control
- ✅ Error handling middleware

### Phase 2: User Management ✅
- ✅ Register endpoint
- ✅ Login endpoint
- ✅ Token refresh
- ✅ Get/Update profile
- ✅ Logout

### Phase 3: Pet Management ✅
- ✅ Create pet
- ✅ List pets
- ✅ Get pet details
- ✅ Update pet
- ✅ Delete pet (soft delete)

### Phase 4: Order Management ✅
- ✅ Create order
- ✅ List orders (role-based)
- ✅ Get order details
- ✅ Update order
- ✅ Update order status
- ✅ Assign driver
- ✅ Request clarification
- ✅ Respond to clarification

## 🔜 Future Enhancements

- [ ] Real-time updates (WebSocket/Socket.io)
- [ ] File upload for images
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Push notifications
- [ ] Payment processing
- [ ] Analytics dashboard
- [ ] Admin panel
- [ ] Rate limiting
- [ ] API versioning

## 📊 Testing

```bash
npm test
```

## 🚀 Deployment

### Heroku
```bash
heroku login
heroku create pet-care-api
git push heroku main
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
```

### Docker
```bash
docker build -t pet-care-api .
docker run -p 3000:3000 -e MONGODB_URI=... pet-care-api
```

## 🔗 Frontend Integration

The mobile app connects to this API at the base URL configured in the environment:
- Development: `http://localhost:3000/api`
- Production: Update in environment config

## 📞 Support

For API documentation, see the endpoint descriptions in this README and the controller files for detailed logic.

## 📄 License

MIT

---

**Ready to integrate?** The backend is ready for the mobile app to connect. Start the server with `npm run dev` and update the mobile app's API URL to point to your backend!
