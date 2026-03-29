# Charity Token Application - Implementation Guide

## Overview

The Charity Token Application is a comprehensive platform designed to empower 1 million beneficiaries worldwide by distributing 500 tokens monthly for 10 years. The application includes role-based access for Beneficiaries, Philanthropists, and Admins.

## Getting Started

### Prerequisites

Before you begin, ensure you have:
- Supabase project set up with PostgreSQL database
- Vercel Blob storage configured for document uploads
- Node.js and npm/pnpm installed

### Environment Setup

Create a `.env.local` file in your project root with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

1. Run the database schema script to create all tables:
   ```bash
   # Copy the SQL from /scripts/01-create-schema.sql
   # Execute in your Supabase SQL editor
   ```

2. This creates the following tables:
   - `users` - Base user table for all roles
   - `beneficiaries` - Beneficiary-specific data
   - `philanthropists` - Philanthropist data and KYC status
   - `kyc_submissions` - KYC form submissions with documents
   - `token_transactions` - Transaction history
   - `beneficiary_balances` - Fast balance lookups
   - `payment_verifications` - Payment verification records
   - `distribution_schedule` - Monthly distribution schedule
   - `distribution_records` - Individual distribution records
   - `admin_logs` - Admin action audit trail

## Features

### 1. User Authentication

**Files:**
- `/lib/supabase-client.ts` - Supabase client and auth functions
- `/contexts/auth-context.tsx` - React context for auth state
- `/app/login/page.tsx` - Login page
- `/app/register/page.tsx` - Generic registration redirect

**How it works:**
- Uses Supabase Auth for user management
- Automatic session persistence
- Role-based access control (RBAC)
- AuthProvider wraps entire app for global auth state

### 2. Beneficiary Registration & Activation

**Files:**
- `/app/beneficiary-register/page.tsx` - Registration form with activation flow

**Activation Methods:**
1. **Telegram Philanthropist** - Connect with regional Philanthropist
2. **Wallet Transfer** - Send 1 USDT to wallet address
3. **Pi Network** - Direct payment via Pi Network (6.0 Pi)

**Process:**
1. User registers with email, password, full name, username
2. After registration, activation step begins
3. User chooses activation method and provides proof
4. Account becomes active after successful activation

### 3. Philanthropist KYC Verification

**Files:**
- `/app/philanthropist-register/page.tsx` - Registration form
- `/app/philanthropist-kyc/page.tsx` - Multi-step KYC form

**KYC Form Collects:**
- Full name
- Date of birth
- Country & Region
- Phone number
- Home address
- Government-issued ID (Passport, National ID, or Driver's License)
- Live face capture using device camera

**Process:**
1. User registers as Philanthropist
2. Redirected to KYC form
3. Enters personal information
4. Uploads government ID document
5. Takes live face photo via camera
6. Reviews all information
7. Submits for admin review
8. Admin approves or rejects with feedback

**Files uploaded to Vercel Blob:**
- `/kyc/id/{userId}/{timestamp}` - Government ID
- `/kyc/face/{userId}/{timestamp}` - Face capture

### 4. Admin Dashboard

**Files:**
- `/app/admin/page.tsx` - Main admin dashboard
- `/app/admin/kyc-review/page.tsx` - KYC submission review
- `/app/admin/distributions/page.tsx` - Monthly distribution management

**Admin Capabilities:**
- View platform statistics
- Review pending KYC submissions
- Approve or reject KYC applications
- Add review notes and rejection reasons
- Manage user accounts
- Delete users for policy violations
- Create monthly distributions
- Execute token distributions
- View admin action logs

### 5. Dashboard Pages

**Beneficiary Dashboard** (`/beneficiary-dashboard/page.tsx`):
- Current token balance
- Total tokens earned
- Total tokens redeemed
- Transaction history
- Monthly distribution info

**Philanthropist Dashboard** (`/philanthropist-dashboard/page.tsx`):
- KYC status
- Assigned beneficiaries list
- Personal information
- Contact methods (Telegram, Wallet)
- Region coverage

**Admin Dashboard** (`/admin/page.tsx`):
- Platform statistics
- User management
- Quick action buttons
- Recent activity logs

### 6. Token Distribution System

**Files:**
- `/app/admin/distributions/page.tsx` - Distribution management
- `/app/api/execute-distribution/route.ts` - Distribution execution API

**Process:**
1. Admin creates distribution schedule for a specific month
2. System calculates active beneficiaries count
3. Token amount (500) × beneficiaries = total tokens
4. Admin can execute distribution or schedule for later
5. System creates transaction records for each beneficiary
6. Updates beneficiary balances and earnings
7. Records distribution completion

### 7. Payment Verification

**Files:**
- `/app/api/verify-payment/route.ts` - Payment verification API

**Payment Methods:**
1. **Telegram** - Manual verification by admin
2. **Wallet Transfer** - Validates transaction hash format
3. **Pi Network** - Integrates with Pi Network API

**Verification Process:**
1. User submits payment proof
2. API validates payment credentials
3. Creates payment verification record
4. Activates user account
5. Returns verification ID

### 8. Settings & Profile Management

**Files:**
- `/app/settings/page.tsx` - User settings page

**Editable Fields:**
- Full name
- Phone number
- Country
- Region

**Read-only Fields:**
- Email
- Role
- Account status

## API Routes

### POST `/api/verify-payment`
Verifies payment and activates beneficiary account.

**Request:**
```json
{
  "beneficiaryId": "uuid",
  "paymentMethod": "wallet|pi_network|telegram",
  "transactionHash": "0x...",
  "walletAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "verificationId": "uuid"
}
```

### POST `/api/execute-distribution`
Executes monthly token distribution.

**Request:**
```json
{
  "distributionId": "uuid",
  "adminId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Distribution executed successfully",
  "distributionId": "uuid"
}
```

## Performance Optimizations

### Database Indexes
- `idx_users_email` - Email lookups
- `idx_users_role` - Role-based filtering
- `idx_beneficiaries_username` - Username searches
- `idx_philanthropists_kyc_status` - KYC filtering
- `idx_token_transactions_beneficiary` - Transaction history
- `idx_distribution_records_distribution` - Distribution tracking
- `idx_admin_logs_timestamp` - Audit trail

### Row Level Security (RLS)
- Users can only view their own data
- Admins can view all data
- Beneficiaries isolated from each other
- Philanthropists isolated from each other

### Caching Strategy
- Beneficiary balances in separate table for fast queries
- Auth context caches user data
- SWR can be added for data fetching

## User Flows

### Beneficiary Flow
```
Register → Activation (Telegram/Wallet) → Dashboard → View Balance & Transactions
```

### Philanthropist Flow
```
Register → KYC Form (Personal Info + Documents + Face) → Admin Review → 
Approval → Dashboard → Manage Beneficiaries
```

### Admin Flow
```
Login → Admin Dashboard → KYC Review → Approve/Reject → 
Create Distribution → Execute Distribution → View Logs
```

## Security Considerations

1. **Authentication:** Supabase Auth handles password hashing and session management
2. **Row Level Security:** RLS policies enforce data isolation
3. **File Storage:** Blob storage with private access for sensitive documents
4. **Audit Logging:** All admin actions logged with timestamp and details
5. **Input Validation:** All forms validated on client and server
6. **Parameterized Queries:** Supabase client prevents SQL injection

## Deployment

### Prerequisites
- Push code to GitHub
- Connect GitHub to Vercel
- Set environment variables in Vercel project settings
- Supabase and Blob integrations configured

### Deploy Steps
1. Push to main branch
2. Vercel automatically builds and deploys
3. Environment variables loaded automatically
4. Database schema initialized in Supabase

## Testing

### Test User Accounts

**Admin Account** (Create via SQL):
```sql
INSERT INTO users (email, password_hash, full_name, role, status) 
VALUES ('admin@charity.com', 'hashed_password', 'Admin User', 'admin', 'active');
```

**Test Beneficiary:**
- Email: `beneficiary@test.com`
- Password: `TestPass123`
- Username: `testbeneficiary`

**Test Philanthropist:**
- Email: `philanthropist@test.com`
- Password: `TestPass123`
- Will need to complete KYC

## Monitoring & Maintenance

### Key Metrics to Track
- Total registered beneficiaries
- Active beneficiaries percentage
- Approved philanthropists count
- KYC approval rate
- Monthly distribution success rate
- Total tokens distributed

### Regular Maintenance
1. Review admin logs monthly
2. Verify token distribution completion
3. Monitor KYC submission queue
4. Update beneficiary list for distribution

## Troubleshooting

### Common Issues

**"User not authenticated"**
- Clear browser cache
- Verify environment variables
- Check Supabase session

**"Payment verification failed"**
- Validate transaction hash format
- Check wallet address validity
- Verify payment method configuration

**"KYC submission failed"**
- Check Vercel Blob configuration
- Verify file size limits
- Ensure camera permissions granted

## Future Enhancements

1. **Email Notifications** - Notify users of KYC status, distributions
2. **SMS Alerts** - Send balance updates via SMS
3. **Mobile App** - Native iOS/Android app
4. **Blockchain Integration** - Token transfers on blockchain
5. **Advanced Analytics** - User engagement tracking
6. **Multi-language Support** - Localization for global users
7. **Two-Factor Authentication** - Enhanced security
8. **API Rate Limiting** - Prevent abuse

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase documentation
3. Contact Vercel support for deployment issues
4. File GitHub issues for bug reports

## License

This application is built for the Charity Token initiative to empower 1 million lives worldwide.
