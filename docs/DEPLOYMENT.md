# 🚀 CareOps Deployment Guide

## Overview
This guide will help you deploy your CareOps platform to production.

## Prerequisites
- Supabase account (free tier works)
- Vercel account (for frontend) or any hosting service
- Railway/Render account (for backend) or any Python hosting
- Domain name (optional)

## Step 1: Database Deployment (Supabase)

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for project to be created

### 1.2 Run Database Schema
1. Go to SQL Editor in Supabase dashboard
2. Copy contents of `database/schema.sql`
3. Paste and run the SQL
4. Verify tables are created in Table Editor

### 1.3 Get Connection Details
1. Go to Project Settings → API
2. Copy:
   - Project URL (SUPABASE_URL)
   - anon/public key (SUPABASE_KEY)

## Step 2: Backend Deployment

### Option A: Railway (Recommended)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository
   - Select the `backend` folder

3. **Configure Environment Variables**
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   GROQ_API_KEY=your_groq_key
   SECRET_KEY=generate_random_secret_key_here
   ```

4. **Configure Start Command**
   - In Railway settings, set start command:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

5. **Deploy**
   - Railway will auto-deploy
   - Note your backend URL (e.g., `https://your-app.railway.app`)

### Option B: Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)

2. **New Web Service**
   - Connect GitHub repository
   - Select `backend` directory
   - Choose Python environment

3. **Configure**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Add environment variables

## Step 3: Frontend Deployment (Vercel)

### 3.1 Prepare Frontend
1. Update `frontend/.env.local`:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   ```

### 3.2 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - Framework: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. Add Environment Variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   ```

6. Deploy!

### 3.3 Custom Domain (Optional)
1. In Vercel project settings
2. Go to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Step 4: Post-Deployment Configuration

### 4.1 Update CORS in Backend
Update `backend/config.py`:
```python
CORS_ORIGINS: list = [
    "http://localhost:3000",
    "https://your-frontend.vercel.app",
    "https://your-custom-domain.com"
]
```

Redeploy backend after this change.

### 4.2 Test the Application
1. Visit your frontend URL
2. Create an account
3. Complete onboarding
4. Test all features

## Step 5: Email & SMS Integration

### Email (SendGrid)
1. Create SendGrid account
2. Get API key
3. In your app, during onboarding Step 2:
   ```json
   {
     "type": "email",
     "provider": "sendgrid",
     "config": {
       "api_key": "your_sendgrid_api_key",
       "from_email": "noreply@yourdomain.com"
     }
   }
   ```

### SMS (Twilio)
1. Create Twilio account
2. Get Account SID and Auth Token
3. Get a phone number
4. In your app, during onboarding Step 2:
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

## Step 6: Monitoring & Maintenance

### Backend Monitoring
- Railway/Render provides logs
- Set up error tracking (Sentry)
- Monitor API response times

### Database Monitoring
- Supabase dashboard shows usage
- Set up backup schedules
- Monitor query performance

### Frontend Monitoring
- Vercel Analytics (built-in)
- Google Analytics (optional)
- Error tracking

## Security Checklist

- [ ] Change SECRET_KEY to random value
- [ ] Enable HTTPS only
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Use environment variables for all secrets
- [ ] Enable Supabase Row Level Security (RLS)
- [ ] Set up database backups
- [ ] Configure firewall rules

## Performance Optimization

### Backend
- Enable caching for dashboard data
- Use database indexes (already in schema)
- Implement connection pooling
- Add CDN for static assets

### Frontend
- Enable Next.js Image Optimization
- Implement lazy loading
- Use React.memo for expensive components
- Enable Vercel Edge Functions

## Troubleshooting

### Backend Issues
**Problem**: 500 errors
- Check Railway/Render logs
- Verify environment variables
- Check database connection

**Problem**: CORS errors
- Update CORS_ORIGINS in config.py
- Redeploy backend

### Frontend Issues
**Problem**: API calls failing
- Verify NEXT_PUBLIC_API_URL
- Check browser console
- Test API directly

**Problem**: Build failures
- Check Node version (18+)
- Clear `.next` folder
- Verify all dependencies installed

### Database Issues
**Problem**: Connection timeout
- Check Supabase project status
- Verify connection string
- Check firewall rules

## Scaling Considerations

### When to Scale
- > 1000 daily active users
- > 10,000 bookings/month
- > 100 concurrent users

### How to Scale
1. **Database**: Upgrade Supabase plan
2. **Backend**: Add more Railway instances
3. **Frontend**: Vercel auto-scales
4. **Caching**: Add Redis layer

## Cost Estimation

### Free Tier (Good for MVP)
- Supabase: Free (500MB database)
- Railway: $5/month (500 hours)
- Vercel: Free (hobby plan)
- **Total**: ~$5/month

### Production (1000+ users)
- Supabase: $25/month (Pro plan)
- Railway: $20/month
- Vercel: $20/month (Pro plan)
- SendGrid: $15/month
- Twilio: Pay-as-you-go
- **Total**: ~$80-100/month

## Backup & Recovery

### Database Backups
- Supabase Pro includes daily backups
- Export data regularly
- Test restore procedures

### Code Backups
- GitHub repository (primary)
- Download releases
- Document deployment process

## Support & Resources

- [Supabase Docs](https://supabase.com/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Next.js Docs](https://nextjs.org/docs)
- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)

## Final Checklist

- [ ] Database schema deployed
- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Environment variables configured
- [ ] CORS configured correctly
- [ ] Email integration tested
- [ ] SMS integration tested
- [ ] User registration works
- [ ] Onboarding flow works
- [ ] Dashboard loads data
- [ ] Public booking page works
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Monitoring set up
- [ ] Backups configured

## Demo Video Checklist

For hackathon submission, record a demo showing:
1. Landing page
2. User registration
3. Onboarding flow (all 8 steps)
4. Dashboard overview
5. Creating a booking (public page)
6. Inbox functionality
7. Voice onboarding (if implemented)
8. Mobile responsiveness

## Congratulations! 🎉

Your CareOps platform is now live and ready to help service businesses streamline their operations!
