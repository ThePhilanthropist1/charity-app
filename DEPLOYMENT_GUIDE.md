# Deployment & Setup Guide

## Complete Setup Instructions

### Prerequisites

- Vercel account (https://vercel.com)
- Supabase account (https://supabase.com)
- GitHub account
- Node.js 18+ (for local testing)

---

## Phase 1: Database Setup (Supabase)

### 1. Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in project details:
   - Name: `charity-token-prod`
   - Database password: Generate strong password
   - Region: Select closest region
4. Wait for project to initialize (2-3 minutes)

### 2. Get Connection Details

1. Once project is ready, go to **Project Settings**
2. Click **API** tab
3. Copy these values:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Run Database Schema

1. In Supabase, click **SQL Editor**
2. Click **New Query**
3. Open `/scripts/schema.sql` from this project
4. Copy entire contents into SQL editor
5. Click **Run**
6. Wait for completion (should show 11 tables created)

### 4. Verify Database

1. Click **Table Editor**
2. You should see these 11 tables:
   - users
   - kyc_submissions
   - beneficiary_activations
   - token_distributions
   - wallet_addresses
   - pi_transactions
   - wallet_transfers
   - philanthropist_regions
   - beneficiary_assignments
   - admin_audit_logs
   - distribution_stats

✅ **Database is ready!**

---

## Phase 2: File Storage Setup (Vercel Blob)

### 1. Enable Blob in Vercel

1. Go to your Vercel project
2. Click **Settings** → **Storage**
3. Click **Create Database** → Select **Blob**
4. Click **Create**
5. Once created, click **Copy Token**
6. Save this value → `BLOB_READ_WRITE_TOKEN`

### 2. Test Blob

- Files will automatically be stored privately in `/kyc/` folder
- Only authenticated users can upload/download

✅ **File storage is ready!**

---

## Phase 3: Environment Setup (Vercel)

### 1. Add Environment Variables

1. In Vercel, go to project **Settings** → **Environment Variables**
2. Add these 4 variables:

```
NEXT_PUBLIC_SUPABASE_URL = [from Supabase Project Settings]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [from Supabase Project Settings]
BLOB_READ_WRITE_TOKEN = [from Vercel Blob]
JWT_SECRET = [Generate: openssl rand -base64 32]
```

3. Click **Save**

### 2. Redeploy

1. Go to **Deployments**
2. Click the latest deployment's menu (...)
3. Click **Redeploy**
4. Wait for deployment to complete

✅ **Environment is configured!**

---

## Phase 4: Create Admin Account

### 1. Register First User

1. Go to your app (yourapp.vercel.app)
2. Click **Get Started**
3. Select **Beneficiary**
4. Register with:
   - Email: `admin@charity.com`
   - Password: Strong password
5. Complete registration

### 2. Promote to Admin

1. Go to Supabase SQL Editor
2. Run this query:

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@charity.com';
```

3. Click **Run**

### 3. Login as Admin

1. Go to `/login`
2. Use `admin@charity.com` and your password
3. You should be redirected to `/admin/dashboard`

✅ **Admin account is ready!**

---

## Phase 5: Test All Features

### 1. Test Beneficiary Flow

1. **Register Beneficiary**
   - Go to `/register`
   - Select "Beneficiary"
   - Fill form, register
   - Redirected to activation

2. **Activate Account**
   - Choose activation method:
     - Try "Pi Network" (mock)
     - Try "Wallet Transfer" (mock)
     - Try "Philanthropist" (mock)
   - Click activate
   - Should see success message

3. **View Dashboard**
   - Should see `/beneficiary/dashboard`
   - Balance should show 0
   - Distribution history empty (until admin creates)

### 2. Test Philanthropist Flow

1. **Register Philanthropist**
   - Go to `/register?role=philanthropist`
   - Fill form, register
   - Redirected to `/philanthropist/kyc`

2. **Complete KYC**
   - Select government ID type
   - Upload test image (any PNG/JPG)
   - Click "Start Camera"
   - Take face photo (or approve default)
   - Review and submit
   - Should see "submitted successfully"

3. **Check Status**
   - Go to `/philanthropist/dashboard`
   - KYC status should show "Pending"

### 3. Test Admin Flow

1. **Review KYC**
   - Go to `/admin/dashboard`
   - Click "KYC" tab
   - Click "Review" on pending submission
   - View documents and face capture
   - Click "Approve" or "Reject"
   - Confirmation message should appear

2. **Manage Users**
   - Click "Users" tab
   - See Philanthropists and Beneficiaries
   - Test delete (will show confirmation)

3. **View Audit Logs**
   - Click "Audit" tab
   - See all admin actions logged

### 4. Test Token Distribution

1. **As Admin, Process Distribution**
   - Go to Distributions API (or create admin endpoint)
   - POST to `/api/distributions`
   - Body: `{ "action": "process_monthly", "month_year": "2024-03" }`
   - Should create 500 tokens for each activated beneficiary

2. **Verify Distributions**
   - Login as beneficiary
   - Go to dashboard
   - Should see distributions in history

✅ **All features tested!**

---

## Phase 6: Launch Checklist

Before going live, verify:

### Security
- [ ] JWT_SECRET is set to random 32+ character string
- [ ] Environment variables are NOT in code
- [ ] File storage is private (not public)
- [ ] Admin role cannot be self-assigned
- [ ] Password hashing is working

### Performance
- [ ] Database queries complete in <100ms
- [ ] Page loads in <3 seconds
- [ ] Image uploads work smoothly
- [ ] Camera access works on mobile

### Features
- [ ] User registration works
- [ ] Login/logout works
- [ ] All 3 activation methods work
- [ ] KYC face capture works
- [ ] Admin review interface works
- [ ] Token distribution works
- [ ] Audit logs recorded

### Data Integrity
- [ ] All tables have data
- [ ] Indexes are working
- [ ] No orphaned records
- [ ] Foreign keys intact

### Monitoring
- [ ] Vercel analytics enabled
- [ ] Supabase monitoring enabled
- [ ] Error logging configured
- [ ] Performance metrics visible

---

## Phase 7: Monitor & Optimize

### 1. Daily Monitoring

Check Vercel Dashboard:
- **Analytics** → See user traffic
- **Deployments** → Verify latest working
- **Functions** → Check API response times
- **Errors** → Monitor error rate

Check Supabase Dashboard:
- **Database** → Monitor query performance
- **Auth** → Check login attempts
- **Storage** → Monitor file uploads
- **Logs** → Review error logs

### 2. Weekly Tasks

- Review audit logs for unusual activity
- Check token distribution processing
- Verify KYC approvals are happening
- Monitor new user registrations

### 3. Monthly Tasks

- Review and optimize slow queries
- Archive old audit logs
- Check for policy violations
- Plan capacity adjustments

---

## Troubleshooting

### "Cannot connect to database"

**Problem:** `getaddrinfo ENOTFOUND` error

**Solution:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
3. Ensure Supabase project is active
4. Redeploy after fixing variables

### "File upload fails"

**Problem:** 413 or 500 error on file upload

**Solution:**
1. Verify `BLOB_READ_WRITE_TOKEN` is set
2. Check file size (max 10MB)
3. Verify file type (PNG, JPG, WebP only)
4. Check browser console for error details

### "KYC form won't load"

**Problem:** Camera not working, form blank

**Solution:**
1. Check browser permissions for camera
2. Try different browser (Chrome/Firefox)
3. Ensure HTTPS connection
4. Clear browser cache
5. Check browser console for errors

### "Admin login doesn't work"

**Problem:** Regular login works, but admin dashboard is blank

**Solution:**
1. Verify user role is 'admin' in database
2. Check JWT token is valid
3. Verify JWT_SECRET is set correctly
4. Review browser console for errors

### "Distribution not processing"

**Problem:** No tokens showing up

**Solution:**
1. Verify beneficiary activation status is 'verified'
2. Check /api/distributions endpoint returns results
3. Verify admin called process_monthly endpoint
4. Check Supabase logs for errors

---

## Performance Optimization Tips

### Database
- Monitor slow queries in Supabase logs
- Add indexes for new filter columns
- Archive old audit logs quarterly
- Use LIMIT in list queries

### Frontend
- Cache data with SWR (already configured)
- Lazy load images
- Code splitting for large components
- Preload critical paths

### API
- Batch operations where possible
- Use database transactions
- Cache API responses
- Compress responses

---

## Backup & Recovery

### Daily Backups

Supabase automatically backs up every day. To manually backup:

1. Go to Supabase **Settings** → **Backups**
2. Click **Request backup**
3. Download appears in 5-10 minutes

### Restore from Backup

1. Contact Supabase support
2. Provide backup timestamp
3. They restore to new branch
4. Merge when verified

### Data Export

To export all data:

1. Go to **SQL Editor**
2. Create export queries
3. Download as CSV

---

## Scale Planning

### Current Setup Supports
- Up to 1M users
- Unlimited storage (Vercel Blob)
- Unlimited database queries

### Upgrade Path
- If database slow: Enable read replicas
- If API slow: Enable Vercel Pro
- If storage needed: Vercel Blob handles it

---

## Rollback Procedure

If something goes wrong:

1. **Recent Changes**
   - Go to Vercel Deployments
   - Click previous working deployment
   - Click "Rollback to this"
   - Wait for redeploy

2. **Database Issue**
   - Go to Supabase Backups
   - Request previous backup
   - They'll restore to branch
   - Merge when ready

3. **Data Corruption**
   - Contact Supabase support
   - Provide incident details
   - They can restore from backup

---

## Go Live Checklist

- [ ] Database configured and tested
- [ ] Blob storage working
- [ ] Environment variables set
- [ ] Admin account created
- [ ] All features tested
- [ ] Performance acceptable
- [ ] Monitoring enabled
- [ ] Backup strategy confirmed
- [ ] Team trained
- [ ] Support process ready

✅ **You're ready to launch!**

---

## Support Contacts

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/docs/support
- **Status Pages**: 
  - Vercel: https://www.vercelstatus.com
  - Supabase: https://status.supabase.com

---

## After Launch

### First Week
- Monitor for bugs
- Fix any issues
- Gather user feedback
- Optimize based on usage

### First Month
- Promote to users
- Gather analytics
- Plan Phase 2 features
- Scale infrastructure if needed

### First Year
- Reach 1M beneficiaries
- Process 10 years of distributions
- Become self-sustaining
- Help communities worldwide

---

**Congratulations! You're now ready to empower 1 million lives worldwide with Charity tokens! 🌍💚**
