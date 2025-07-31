# LMS Backend API

A comprehensive Leave Management System backend built with Node.js, Express, and MongoDB.

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   ├── jwt.js               # JWT configuration & utilities
│   │   └── cloudinary.js        # File upload configuration
│   ├── controllers/             # Business logic (to be implemented)
│   ├── middleware/
│   │   ├── auth.js              # Authentication & authorization
│   │   ├── errorHandler.js      # Global error handling
│   │   └── rateLimiter.js       # Rate limiting
│   ├── models/
│   │   ├── User.js              # User schema & methods
│   │   ├── Leave.js             # Leave request schema
│   │   ├── Department.js        # Department schema
│   │   ├── LeaveType.js         # Leave type configuration
│   │   └── Holiday.js           # Holiday calendar schema
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── users.js             # User management routes
│   │   ├── leaves.js            # Leave management routes
│   │   ├── dashboard.js         # Dashboard data routes
│   │   └── calendar.js          # Calendar routes
│   ├── services/                # Business logic services (to be implemented)
│   ├── utils/
│   │   ├── constants.js         # Application constants
│   │   ├── helpers.js           # Utility functions
│   │   ├── logger.js            # Winston logger setup
│   │   └── dateUtils.js         # Date calculation utilities
│   └── validations/             # Input validation (to be implemented)
├── uploads/                     # File uploads directory
├── logs/                        # Application logs
├── tests/                       # Test files
├── env.example                  # Environment variables template
├── server.js                    # Main server file
└── package.json                 # Dependencies & scripts
```

## 🚀 Quick Start

### 1. Environment Setup

Copy the environment template and configure your variables:

```bash
cp env.example .env
```

Update `.env` with your configuration:

```env
# Essential Configuration
MONGO_URI=mongodb://localhost:27017/lms-db
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Additional Dependencies

Install these additional packages for full functionality:

```bash
npm install winston express-rate-limit express-validator multer multer-storage-cloudinary nodemailer
```

### 4. Start Development Server

```bash
npm run dev
```

## 📋 Current Features

### ✅ Implemented
- **Complete folder structure** with organized separation of concerns
- **Database Models** with comprehensive schemas and methods:
  - User model with role-based access and leave balances
  - Leave model with approval workflow
  - Department model with faculty management
  - LeaveType model with configurable settings
  - Holiday model with recurring patterns
- **Middleware** for authentication, authorization, and error handling
- **Utility functions** for date calculations, password hashing, and pagination
- **Route placeholders** for all major API endpoints
- **Configuration** for database, JWT, and file uploads

### 🔄 To Be Implemented
- **Controllers** - Business logic implementation
- **Validation schemas** - Input validation rules
- **Service layers** - Email, notifications, reports
- **Test cases** - Unit and integration tests

## 🎯 API Endpoints

### Authentication (`/api/auth`)
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /refresh-token` - Refresh JWT token
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset

### Users (`/api/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `GET /leave-balances` - Get leave balances
- `GET /team` - Get team members (HOD)
- `PUT /change-password` - Change password

### Leaves (`/api/leaves`)
- `GET /` - Get user's leave requests
- `POST /` - Apply for leave
- `GET /:id` - Get leave details
- `PUT /:id` - Update leave request
- `DELETE /:id` - Cancel leave request
- `GET /pending/approvals` - Get pending approvals (HOD/Admin)
- `PUT /:id/approve` - Approve leave (HOD/Admin)
- `PUT /:id/reject` - Reject leave (HOD/Admin)

### Dashboard (`/api/dashboard`)
- `GET /stats` - Dashboard statistics
- `GET /recent-activity` - Recent activities
- `GET /team-leaves` - Team leave status
- `GET /upcoming-holidays` - Upcoming holidays

### Calendar (`/api/calendar`)
- `GET /holidays` - Holiday calendar
- `GET /leaves` - Leave calendar
- `GET /academic-calendar` - Academic calendar

## 🔐 Security Features

- **JWT Authentication** with access and refresh tokens
- **Role-based Authorization** (Faculty, HOD, Admin, Principal)
- **Rate Limiting** to prevent abuse
- **Input Validation** and sanitization
- **Security Headers** via Helmet.js
- **Password Hashing** with bcrypt

## 🗄️ Database Schema

### User Schema
- Personal information and profile
- Role-based access control
- Leave balance tracking
- Department associations

### Leave Schema
- Multi-level approval workflow
- Half-day support
- Working day calculations
- Metadata tracking

### Department Schema
- Faculty management
- Leave approval settings
- Statistics tracking

## 📊 Key Features

### Leave Management
- **6 Leave Types**: Casual, Medical, Vacation, Compensatory Off, Urgent, Special
- **Half-day Support** with proper calculations
- **Working Day Calculations** excluding weekends and holidays
- **Multi-level Approval** workflow
- **Leave Balance Tracking** with carry-forward rules

### Date Utilities
- Smart working day calculations
- Holiday exclusions
- Half-day adjustments
- Date range validations

### Authorization System
- Department-based access control
- HOD privileges for team management
- Admin/Principal system-wide access
- Resource-specific permissions

## 🧪 Health Check

The server includes a health check endpoint:

```
GET /health
```

Returns server status, uptime, and environment information.

## 📝 Next Steps

1. **Implement Controllers** - Add business logic for each route
2. **Add Validations** - Create input validation schemas
3. **Build Services** - Implement email notifications and reports
4. **Write Tests** - Add comprehensive test coverage
5. **Create Seeders** - Add sample data for development

## 🤝 Development Workflow

1. **Routes** → Define API endpoints (✅ Done)
2. **Models** → Database schemas (✅ Done)
3. **Controllers** → Business logic (🔄 Next)
4. **Middleware** → Authentication/validation (✅ Done)
5. **Services** → External integrations (🔄 Pending)
6. **Tests** → Quality assurance (🔄 Pending)

---

**Ready for JWT Secret, MongoDB URI, and leave logic implementation!** 🚀 