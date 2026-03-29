# Environment Setup Guide

## Prerequisites

Before you begin, ensure you have:
- A Supabase account (https://supabase.com)
- A Vercel account (https://vercel.com)
- GitHub account for deployment
- Node.js 18+ installed
- npm or pnpm package manager

---

## Step 1: Create Supabase Project

### 1.1 Sign Up / Login
- Go to https://supabase.com
- Click "Sign Up" or "Sign In"
- Use GitHub or email authentication

### 1.2 Create New Project
1. Click "New Project"
2. Select organization
3. Enter project name: `charity-token`
4. Set strong database password
5. Select region closest to your users
6. Click "Create new project"

### 1.3 Get Your Credentials
1. Wait for project to initialize (2-3 minutes)
2. Go to Project Settings → API
3. Copy:
   - **Project URL** - `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Key** - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 1.4 Initialize Database Schema
1. Go to SQL Editor
2. Click "New Query"
3. Copy entire content from `/scripts/01-create-schema.sql`
4. Paste into SQL editor
5. Click "Run"
6. Wait for completion
7. Verify all tables created in "Table Editor"

---

## Step 2: Setup Vercel Blob Storage

### 2.1 Create Vercel Project (if not exist)
1. Go to https://vercel.com
2. Click "Add New..."
3. Select "Project"
4. Import from GitHub
5. Select `charity-token` repository
6. Click "Import"

### 2.2 Configure Blob Storage
1. In project settings, go to "Storage"
2. Click "Enable Blob"
3. Confirm enabling
4. Blob storage is now ready

### 2.3 Get Blob Credentials (Optional)
- Credentials are automatically injected
- Used via `@vercel/blob` package
- No manual configuration needed

---

## Step 3: Local Environment Setup

### 3.1 Clone Repository
```bash
git clone https://github.com/your-org/charity-token.git
cd charity-token
```

### 3.2 Install Dependencies
```bash
npm install
# or
pnpm install
```

### 3.3 Create .env.local File
Create `.env.local` in project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3.4 Verify Configuration
```bash
npm run dev
```

Visit `http://localhost:3000` and verify:
- Landing page loads
- Navigation works
- No auth errors in console

---

## Step 4: Vercel Deployment Configuration

### 4.1 Connect GitHub Repository
1. In Vercel project settings
2. Go to "Connected Repository"
3. Verify `charity-token` repo is selected

### 4.2 Set Environment Variables
1. Go to Project Settings → Environment Variables
2. Add both variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Select environments: Production, Preview, Development
4. Click "Save"

### 4.3 Deploy
```bash
git add .
git commit -m "Initial Charity Token deployment"
git push origin main
```

Vercel automatically builds and deploys on push.

---

## Step 5: Create Admin Account

### 5.1 First Time Admin Setup
1. Visit deployed app
2. Go to `/login`
3. Click register link (or go to `/philanthropist-register`)
4. Create account with your email

### 5.2 Promote to Admin (via Supabase)
1. Go to Supabase dashboard
2. Open SQL Editor
3. Run query:
```sql
UPDATE users 
SET role = 'admin', status = 'active' 
WHERE email = 'your-email@example.com';
```

4. Verify by logging out and back in
5. You should see admin dashboard

---

## Step 6: Test All Functionality

### 6.1 Beneficiary Flow
1. Go to `/beneficiary-register`
2. Fill in form with test data
3. Complete activation
4. Verify dashboard shows balance 0
5. Settings should be editable

### 6.2 Philanthropist Flow
1. Go to `/philanthropist-register`
2. Fill in registration form
3. Complete KYC form
4. Upload test image (any .png or .jpg)
5. Capture face (allow camera)
6. Review and submit
7. Go to admin dashboard
8. Review KYC and approve
9. Check philanthropist dashboard

### 6.3 Admin Flow
1. Go to `/admin`
2. View statistics
3. Go to `/admin/kyc-review`
4. Review pending submissions
5. Go to `/admin/distributions`
6. Create distribution for current month
7. Execute distribution
8. Verify beneficiary balance increased

---

## Step 7: Configure Payment Methods

### 7.1 Telegram Setup
1. Create Telegram bot via @BotFather
2. Get bot token
3. Store philanthropist's Telegram username
4. Document for each region

### 7.2 Wallet Address
1. Create USDT wallet on your preferred network
2. Document address for beneficiaries
3. Add to activation page

### 7.3 Pi Network
1. Register app on Pi Network (if not done)
2. Get API credentials
3. Already integrated in payment button

---

## Troubleshooting

### Connection Issues
**Error:** "Cannot connect to Supabase"
- [ ] Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- [ ] Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
- [ ] Test: `npm run dev` and check console

**Error:** "Blob storage not working"
- [ ] Verify Blob is enabled in Vercel
- [ ] Check file is not too large
- [ ] Verify file type allowed

### Database Issues
**Error:** "User table not found"
- [ ] Run SQL schema again
- [ ] Check query execution completed
- [ ] Refresh Supabase dashboard

**Error:** "RLS policy error"
- [ ] Verify RLS policies created
- [ ] Check user role in table
- [ ] Run schema script again

### Authentication Issues
**Error:** "Email already exists"
- [ ] Use different email for test
- [ ] Check users table in Supabase

**Error:** "Cannot sign in"
- [ ] Verify user exists in `users` table
- [ ] Check password is correct
- [ ] Verify account status is 'active'

---

## Security Checklist

- [ ] Environment variables are NEVER committed
- [ ] .env.local is in .gitignore
- [ ] Only anon key exposed on frontend
- [ ] Database has RLS enabled
- [ ] Admin functions check user role
- [ ] File uploads are private
- [ ] HTTPS enabled on production
- [ ] Database backups configured

---

## Environment Variables Reference

### Required (Always needed)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...
```

### Optional (Enhanced features)
```env
# Telegram Bot (for notifications)
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# Email Service (for notifications)
SENDGRID_API_KEY=SG.xxxxx

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

## Production Deployment

### 1. Production Database
- [ ] Use separate Supabase project for production
- [ ] Enable point-in-time recovery
- [ ] Configure automated backups
- [ ] Set up database monitoring

### 2. SSL Certificate
- [ ] Vercel provides automatic SSL
- [ ] Configure custom domain
- [ ] Update DNS records

### 3. Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure analytics
- [ ] Set up uptime monitoring

### 4. Backups
- [ ] Daily database backups
- [ ] Store backups off-site
- [ ] Test recovery procedure

### 5. Performance
- [ ] Enable caching
- [ ] Configure CDN
- [ ] Monitor response times

---

## Quick Commands

```bash
# Development
npm run dev

# Build
npm run build

# Production preview
npm run start

# Type check
npm run typecheck

# Format code
npm run format

# Lint code
npm run lint
```

---

## Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Discord:** https://discord.supabase.io

---

## Next Steps

1. ✓ Complete this environment setup
2. ✓ Test all flows locally
3. ✓ Deploy to production
4. ✓ Create admin account on production
5. ✓ Configure payment methods
6. ✓ Train support team
7. ✓ Launch to users

---

**Setup Complete!** Your Charity Token application is ready to run.
