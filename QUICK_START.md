# Charity Token - Quick Start Checklist

## Pre-Launch Setup

### 1. Supabase Configuration
- [ ] Create Supabase project
- [ ] Note the Project URL and Anon Key
- [ ] Create `.env.local` with environment variables
- [ ] Execute the SQL schema from `/scripts/01-create-schema.sql`
- [ ] Verify all tables created successfully
- [ ] Test RLS policies are enabled

### 2. Vercel Blob Setup
- [ ] Enable Vercel Blob storage in project
- [ ] Verify private access is configured
- [ ] Test file upload functionality
- [ ] Confirm file retrieval works

### 3. Environment Variables
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Verify variables in Vercel project settings
- [ ] Test local development with `.env.local`

### 4. Create Initial Admin Account
```sql
-- First, sign up via the app, then update role:
UPDATE users SET role = 'admin', status = 'active' 
WHERE email = 'your-admin@email.com';
```

### 5. Testing

#### Beneficiary Registration Test
- [ ] Navigate to `/beneficiary-register`
- [ ] Register with test credentials
- [ ] Complete activation step
- [ ] Verify account shows as active
- [ ] Check `/beneficiary-dashboard` loads correctly

#### Philanthropist Registration Test
- [ ] Navigate to `/philanthropist-register`
- [ ] Register with test credentials
- [ ] Complete KYC form
- [ ] Upload test government ID
- [ ] Capture face photo
- [ ] Review and submit
- [ ] Check `/philanthropist-dashboard` shows "under review"

#### Admin Review Test
- [ ] Login as admin
- [ ] Navigate to `/admin/kyc-review`
- [ ] View pending KYC submission
- [ ] Review documents
- [ ] Approve or reject KYC
- [ ] Verify philanthropist status updates

#### Token Distribution Test
- [ ] Create distribution schedule for current month
- [ ] Execute distribution
- [ ] Verify beneficiary received tokens
- [ ] Check transaction history
- [ ] Verify balances updated

### 6. Payment Verification Setup

#### Telegram Activation
- [ ] Create Telegram bot for your region
- [ ] Add Telegram usernames to philanthropist accounts
- [ ] Test activation proof entry
- [ ] Verify payment verification record created

#### Wallet Transfer
- [ ] Configure USDT wallet address
- [ ] Document wallet address for beneficiaries
- [ ] Test transaction hash validation
- [ ] Verify activation on successful submission

#### Pi Network
- [ ] Register Pi Network application (if not done)
- [ ] Verify Pi Network payment integration
- [ ] Test 6.0 Pi purchase flow
- [ ] Confirm payment verification

### 7. Security Checklist
- [ ] All environment variables use NEXT_PUBLIC_ prefix for client-side
- [ ] Server-side functions use private environment variables
- [ ] RLS policies enabled on all tables
- [ ] Admin functions check user role
- [ ] File uploads restricted to authenticated users
- [ ] Password requirements enforced (8+ characters)
- [ ] Email verification configured (optional)

### 8. Performance Verification
- [ ] Database indexes created
- [ ] Query performance acceptable
- [ ] Page load times < 3 seconds
- [ ] Image optimization working
- [ ] Authentication response time < 1 second

### 9. User Interface
- [ ] Landing page displays correctly
- [ ] All navigation links working
- [ ] Mobile responsive on all pages
- [ ] Forms validate properly
- [ ] Error messages clear and helpful
- [ ] Loading states show spinners
- [ ] Success messages display

### 10. Monitoring Setup
- [ ] Database backups configured
- [ ] Error logging enabled
- [ ] Transaction limits set
- [ ] Admin notifications configured
- [ ] Monthly distribution reminders set

## Launch Checklist

### Before Going Live
- [ ] All tests passed
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Support team trained
- [ ] Backup and recovery plan in place
- [ ] Monitoring alerts configured

### Launch Day
- [ ] Set admin account as active
- [ ] Create first monthly distribution
- [ ] Announce launch to stakeholders
- [ ] Monitor for errors/issues
- [ ] Be available for support

### Post-Launch
- [ ] Monitor user registrations
- [ ] Track KYC submission rate
- [ ] Verify token distributions
- [ ] Gather user feedback
- [ ] Plan feature enhancements

## Quick Links

- **Main App:** https://your-domain.com
- **Admin Dashboard:** https://your-domain.com/admin
- **Supabase Dashboard:** https://app.supabase.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Repo:** https://github.com/your-org/charity-token

## Support Contacts

- **Technical Support:** [Your email]
- **Admin Support:** [Admin email]
- **Supabase Issues:** https://github.com/supabase/supabase/issues
- **Vercel Issues:** https://vercel.com/support

## Important Notes

1. **Beneficiary Limit:** Current system designed for 1M beneficiaries
2. **Token Distribution:** 500 tokens per beneficiary per month for 10 years
3. **KYC Requirement:** Required for Philanthropists, optional for Beneficiaries
4. **Admin Only:** Distribution creation and execution
5. **Audit Trail:** All admin actions logged automatically

## Rollback Plan

If critical issues occur:
1. Revert to previous GitHub commit
2. Redeploy via Vercel
3. Restore database from backup if needed
4. Notify affected users
5. Implement fix
6. Test thoroughly
7. Deploy fix

---

**Last Updated:** [Current Date]
**Status:** Ready for Implementation
**Version:** 1.0
