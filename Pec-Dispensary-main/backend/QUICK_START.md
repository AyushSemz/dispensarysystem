# 🎯 QUICK START - SUPABASE SETUP

## ⚡ Fast Track (5 minutes):

### 1️⃣ Create Supabase Project
```
https://supabase.com → New Project
```

### 2️⃣ Run SQL Schema
```
Dashboard → SQL Editor → Paste supabase-schema.sql → Run
```

### 3️⃣ Get Credentials
```
Settings → API → Copy:
- Project URL
- service_role key
```

### 4️⃣ Setup .env
```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
```

### 5️⃣ Install & Run
```bash
npm install
npm run dev
```

---

## 📝 Your .env should look like:
```env
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...
JWT_SECRET=your-secret-key-here
PORT=4000
```

---

## ✅ Test It Works:
```bash
# Register a user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User",
    "role": "PATIENT"
  }'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## 🔍 Where to Find Everything:

| What | Where |
|------|-------|
| SQL Schema | `backend/supabase-schema.sql` |
| Supabase Config | `backend/src/config/supabase.js` |
| Query Examples | `backend/src/config/supabase-examples.js` |
| Full Guide | `backend/MIGRATION_GUIDE.md` |
| Env Template | `backend/.env.example` |

---

## 🆘 Common Issues:

**"Missing environment variables"**
→ Check `.env` file exists and has correct values

**"Connection failed"**
→ Verify SUPABASE_URL and SERVICE_ROLE_KEY

**"Table doesn't exist"**
→ Run the SQL schema in Supabase SQL Editor

**"Invalid credentials"**
→ Make sure you're using SERVICE_ROLE key, not anon key

---

## 📊 View Your Data:
```
Supabase Dashboard → Table Editor
```

---

## 🚀 You're Done!
All Prisma code has been replaced with Supabase.
Your API endpoints remain the same.
