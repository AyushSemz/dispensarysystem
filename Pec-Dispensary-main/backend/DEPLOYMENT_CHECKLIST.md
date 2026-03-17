# Deployment Checklist: Alert Generation & Sentiment Analysis

## ✅ Pre-Deployment Checklist

### 1. Database Setup
- [ ] Run `supabase-schema.sql` in Supabase SQL Editor
- [ ] Verify tables created: `sentiment_analysis`, `outbreak_alerts`, `symptom_statistics`
- [ ] Verify indexes created
- [ ] Verify RLS policies enabled
- [ ] Test database connection from backend

### 2. Python Environment
- [ ] Python 3.x installed (`python --version`)
- [ ] Install torch: `pip install torch`
- [ ] Install transformers: `pip install transformers`
- [ ] Install numpy: `pip install numpy`
- [ ] Verify imports work: `python -c "import torch, transformers, numpy"`

### 3. ML Model Files
- [ ] `ml-model/infer.py` exists
- [ ] `ml-model/run_inference.py` exists
- [ ] `ml-model/feedback_bert_symptom_head_v2.pt` exists (model weights)
- [ ] `ml-model/models/feedback_bert.py` exists (model architecture)
- [ ] `ml-model/models/__init__.py` exists
- [ ] Test model: `echo '{"text":"test"}' | python ml-model/run_inference.py`

### 4. Backend Code
- [ ] `src/services/sentimentService.js` exists
- [ ] `src/services/anomalyDetectionService.js` exists
- [ ] `src/controllers/alertController.js` exists
- [ ] `src/controllers/feedbackController.js` updated
- [ ] `src/routes/alertRoutes.js` exists
- [ ] `src/routes/feedbackRoutes.js` updated
- [ ] `src/index.js` updated with alert routes
- [ ] All files have correct imports

### 5. Node.js Dependencies
- [ ] `npm install` completed successfully
- [ ] No package errors
- [ ] Backend starts: `npm start`
- [ ] No startup errors in console

### 6. Environment Variables
- [ ] `DATABASE_URL` set correctly (Supabase)
- [ ] `SUPABASE_URL` set
- [ ] `SUPABASE_KEY` set (service role key)
- [ ] `JWT_SECRET` set
- [ ] All required env vars in `.env` file

### 7. Test Data
- [ ] At least 1 doctor user exists
- [ ] At least 1 patient user exists
- [ ] At least 1 visit record exists
- [ ] Can create feedback successfully
- [ ] Can login as doctor
- [ ] Can login as patient

## 🧪 Testing Checklist

### Sentiment Analysis Tests
- [ ] Patient can submit feedback with comments
- [ ] Feedback saves to database successfully
- [ ] Sentiment analysis processes asynchronously
- [ ] Sentiment results appear in `sentiment_analysis` table
- [ ] Detected symptoms are correct
- [ ] Overall sentiment is correct
- [ ] Aspect sentiments are populated
- [ ] Doctor can view sentiment stats
- [ ] Doctor can filter by sentiment

### Alert Generation Tests
- [ ] Can manually trigger anomaly detection
- [ ] Symptom statistics update correctly
- [ ] Z-score calculation works
- [ ] EWMA calculation works
- [ ] Consecutive-day detection works
- [ ] Alerts created in `outbreak_alerts` table
- [ ] Alert severity levels correct
- [ ] No duplicate alerts within 24 hours

### Alert Management Tests
- [ ] Doctor can view active alerts
- [ ] Doctor can view alert dashboard
- [ ] Doctor can acknowledge alerts
- [ ] Doctor can resolve alerts
- [ ] Alert status changes correctly
- [ ] Alert history accessible
- [ ] Symptom statistics retrievable

### API Endpoint Tests
- [ ] `POST /api/feedbacks` works
- [ ] `GET /api/feedbacks/doctor/all` works
- [ ] `GET /api/feedbacks/doctor/sentiment-stats` works
- [ ] `GET /api/alerts/dashboard` works
- [ ] `POST /api/alerts/detect` works
- [ ] `GET /api/alerts` works
- [ ] `GET /api/alerts/:id` works
- [ ] `POST /api/alerts/:id/acknowledge` works
- [ ] `POST /api/alerts/:id/resolve` works
- [ ] `GET /api/alerts/history` works
- [ ] `GET /api/alerts/statistics/:symptom` works

### Security Tests
- [ ] Unauthenticated requests rejected
- [ ] Patient cannot access alert endpoints
- [ ] Patient cannot access doctor stats
- [ ] Doctor cannot access other doctors' data
- [ ] JWT validation working
- [ ] RLS policies enforced

### Performance Tests
- [ ] Sentiment analysis doesn't block feedback creation
- [ ] Dashboard loads within 2 seconds
- [ ] Alert queries return quickly
- [ ] No memory leaks with Python subprocess
- [ ] Database queries optimized with indexes

## 🚀 Deployment Steps

### Step 1: Prepare Environment
```powershell
# 1.1 Install Python dependencies
cd ml-model
pip install torch transformers numpy

# 1.2 Install Node dependencies
cd ../backend
npm install

# 1.3 Verify environment variables
cat .env  # Or Get-Content .env on Windows
```

### Step 2: Database Migration
```sql
-- 2.1 Backup existing data
-- Use Supabase dashboard to export data

-- 2.2 Run schema updates
-- Copy contents of supabase-schema.sql
-- Paste in Supabase SQL Editor
-- Execute

-- 2.3 Verify tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('sentiment_analysis', 'outbreak_alerts', 'symptom_statistics');
```

### Step 3: Test ML Model
```powershell
# 3.1 Test Python script directly
cd ml-model
echo '{"text":"I had fever and headache"}' | python run_inference.py

# 3.2 Expected output: JSON with sentiment data
# 3.3 If errors, check dependencies
```

### Step 4: Start Backend
```powershell
# 4.1 Start in development mode
cd backend
npm start

# 4.2 Verify startup logs
# Should see: "Server is running on http://localhost:4000"

# 4.3 Test health endpoint
curl http://localhost:4000
```

### Step 5: Create Test Data
```powershell
# 5.1 Create doctor account
# Use POST /api/auth/register

# 5.2 Create patient account
# Use POST /api/auth/register

# 5.3 Create visit
# Use POST /api/visits

# 5.4 Create feedback
# Use POST /api/feedbacks
```

### Step 6: Verify Features
```powershell
# 6.1 Run test script
cd backend
node test-alert-sentiment.js

# 6.2 Check logs for errors
# 6.3 Verify data in Supabase dashboard
```

### Step 7: Frontend Integration (If Applicable)
- [ ] Update API endpoints in frontend
- [ ] Add alert dashboard component
- [ ] Add sentiment display in feedback views
- [ ] Add notification system for alerts
- [ ] Test end-to-end workflow

## 📊 Monitoring Checklist

### Post-Deployment Monitoring
- [ ] Monitor backend logs for Python errors
- [ ] Monitor database for sentiment_analysis inserts
- [ ] Monitor alert generation frequency
- [ ] Check for failed sentiment analyses
- [ ] Monitor API response times
- [ ] Track user complaints/issues

### Daily Checks
- [ ] Run anomaly detection: `POST /api/alerts/detect`
- [ ] Review active alerts
- [ ] Check sentiment statistics
- [ ] Verify new feedbacks being processed
- [ ] Review error logs

### Weekly Checks
- [ ] Review alert history
- [ ] Analyze symptom trends
- [ ] Check sentiment distribution
- [ ] Review acknowledged but unresolved alerts
- [ ] Verify database performance

## 🔧 Troubleshooting Guide

### Issue: Sentiment Analysis Not Working
```powershell
# Check 1: Python process
python --version

# Check 2: Dependencies
pip list | Select-String "torch|transformers"

# Check 3: Model file
Test-Path ml-model/feedback_bert_symptom_head_v2.pt

# Check 4: Test manually
cd ml-model
echo '{"text":"test"}' | python run_inference.py

# Check 5: Backend logs
# Look for Python subprocess errors
```

### Issue: No Alerts Generated
```sql
-- Check 1: Symptom statistics exist
SELECT * FROM symptom_statistics ORDER BY date DESC LIMIT 10;

-- Check 2: Enough historical data (need 30 days)
SELECT COUNT(DISTINCT date) FROM symptom_statistics;

-- Check 3: Current symptom counts
SELECT symptom, date, count, baseline_mean, baseline_std_dev 
FROM symptom_statistics 
WHERE date = CURRENT_DATE;

-- Check 4: Calculate Z-score manually
-- (count - baseline_mean) / baseline_std_dev should be > 3
```

### Issue: Database Connection Errors
```javascript
// Check 1: Supabase credentials
console.log(process.env.SUPABASE_URL);
console.log(process.env.SUPABASE_KEY ? 'Key exists' : 'Key missing');

// Check 2: Test connection
import { supabase } from './src/config/supabase.js';
const { data, error } = await supabase.from('users').select('count');
console.log(data, error);
```

## 📝 Documentation Checklist

- [ ] API documentation reviewed
- [ ] Implementation summary updated
- [ ] Setup guide tested
- [ ] Quick reference available
- [ ] Code comments added
- [ ] README updated
- [ ] Team briefed on new features

## 🎯 Go-Live Checklist

### Final Verification
- [ ] All tests passing
- [ ] No critical errors in logs
- [ ] Database migration successful
- [ ] ML model loading correctly
- [ ] All API endpoints responding
- [ ] Authentication working
- [ ] Authorization enforced
- [ ] Performance acceptable

### Production Deployment
- [ ] Environment variables configured
- [ ] Database backup taken
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] Team notified of deployment
- [ ] Documentation published

### Post-Deployment
- [ ] Verify production endpoints
- [ ] Monitor logs for 1 hour
- [ ] Create test feedback
- [ ] Verify sentiment analysis
- [ ] Trigger anomaly detection
- [ ] Check alert generation
- [ ] User acceptance testing
- [ ] Mark deployment as successful

## 🆘 Rollback Plan

If critical issues occur:

1. **Immediate Actions**
   ```sql
   -- Disable sentiment processing
   UPDATE feedbacks SET processed = true WHERE processed = false;
   
   -- Disable alert generation
   -- Remove cron job or stop manual triggers
   ```

2. **Database Rollback**
   ```sql
   -- Drop new tables (only if necessary)
   DROP TABLE IF EXISTS sentiment_analysis CASCADE;
   DROP TABLE IF EXISTS outbreak_alerts CASCADE;
   DROP TABLE IF EXISTS symptom_statistics CASCADE;
   ```

3. **Code Rollback**
   ```powershell
   git checkout <previous-commit>
   npm start
   ```

4. **Restore Service**
   - Verify basic functionality
   - Monitor for stability
   - Plan fix deployment

## ✅ Sign-Off

- [ ] Development team approval
- [ ] QA team approval
- [ ] Product owner approval
- [ ] Security review completed
- [ ] Performance review completed
- [ ] Documentation review completed

---

**Deployment Date:** _____________

**Deployed By:** _____________

**Verified By:** _____________

**Notes:**
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
