# CareOps Quick Start Guide

## 🚀 Setup Instructions

### 1. Database Setup (Supabase)

1. Go to [Supabase](https://supabase.com) and create a new project
2. Once created, go to the SQL Editor
3. Run the schema from `database/schema.sql`
4. Your database is now ready!

### 2. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# The .env file is already configured with your credentials

# Run the server
uvicorn main:app --reload
```

The backend will be available at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📱 User Flows

### For Business Owners

1. **Register**: Create an account at `/register`
2. **Onboarding**: Complete the 8-step setup wizard
   - Create workspace
   - Connect email/SMS
   - Set up services
   - Configure availability
   - Add inventory
   - Invite staff
   - Activate workspace
3. **Dashboard**: Monitor your business in real-time
4. **Manage**: Handle bookings, inbox, and alerts

### For Staff

1. **Login**: Use credentials provided by owner
2. **Inbox**: Respond to customer messages
3. **Bookings**: Manage appointments
4. **Forms**: Track completion status

### For Customers (No Login)

1. **Book**: Visit public booking page
2. **Forms**: Complete required forms via email/SMS links
3. **Updates**: Receive automated confirmations and reminders

## 🎯 Key Features

### Voice Onboarding
- Click the microphone icon during onboarding
- Speak your business details
- AI extracts and fills the form automatically

### Unified Inbox
- All communication (email, SMS) in one place
- Full conversation history
- Quick replies

### Smart Automation
- Booking confirmations
- Form reminders
- Inventory alerts
- No-show tracking

### Real-time Dashboard
- Today's bookings
- Pending forms
- Unread messages
- Low stock alerts

## 🔧 Configuration

### Email Integration (Step 2 of Onboarding)
```json
{
  "type": "email",
  "provider": "sendgrid",
  "config": {
    "api_key": "your_sendgrid_api_key",
    "from_email": "noreply@yourbusiness.com"
  }
}
```

### SMS Integration (Step 2 of Onboarding)
```json
{
  "type": "sms",
  "provider": "twilio",
  "config": {
    "account_sid": "your_twilio_sid",
    "auth_token": "your_twilio_token",
    "from_number": "+1234567890"
  }
}
```

## 📊 Database Tables

- **workspaces**: Business accounts
- **users**: Owners and staff
- **contacts**: Customers
- **conversations**: Communication threads
- **messages**: Individual messages
- **bookings**: Appointments
- **service_types**: Services offered
- **form_templates**: Form definitions
- **form_submissions**: Completed forms
- **inventory_items**: Stock tracking
- **alerts**: System notifications
- **integrations**: Email/SMS/Calendar connections

## 🎨 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python
- **Database**: Supabase (PostgreSQL)
- **AI**: Groq (voice onboarding)
- **State**: Zustand
- **HTTP**: Axios

## 🐛 Troubleshooting

### Backend won't start
- Check Python version (3.11+)
- Verify .env file exists
- Check Supabase credentials

### Frontend won't start
- Check Node version (18+)
- Run `npm install` again
- Clear `.next` folder

### Database connection fails
- Verify Supabase URL and key
- Check if project is active
- Ensure schema is loaded

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Onboarding
- `POST /api/onboarding/workspace` - Create workspace
- `POST /api/onboarding/integrations` - Add integration
- `POST /api/onboarding/service-types` - Add service
- `POST /api/onboarding/activate` - Activate workspace
- `POST /api/onboarding/voice/transcribe` - Voice input

### Dashboard
- `GET /api/dashboard/overview` - Full dashboard data
- `GET /api/dashboard/alerts` - Get alerts

### Bookings
- `GET /api/bookings/` - List bookings
- `POST /api/bookings/public` - Create booking (public)
- `PATCH /api/bookings/{id}/status` - Update status

### Inbox
- `GET /api/inbox/conversations` - List conversations
- `GET /api/inbox/conversations/{id}/messages` - Get messages
- `POST /api/inbox/conversations/{id}/messages` - Send message

## 🎯 Next Steps

1. ✅ Set up database
2. ✅ Start backend
3. ✅ Start frontend
4. 📝 Complete remaining frontend pages
5. 🔌 Add email/SMS integrations
6. 🤖 Build automation engine
7. 🚀 Deploy to production

## 📞 Support

For hackathon support, refer to the Loom video and documentation.

## 🏆 Hackathon Submission Checklist

- [ ] Database schema loaded
- [ ] Backend running
- [ ] Frontend running
- [ ] Onboarding flow working
- [ ] Dashboard displaying data
- [ ] Public booking page functional
- [ ] Demo video recorded
- [ ] Deployment link ready
