# Quick Setup Guide for Alert Generation & Sentiment Analysis

## Prerequisites

1. **Node.js** - Already installed
2. **Python 3.x** - Required for ML model
3. **Supabase** - Database setup

## Step-by-Step Setup

### 1. Install Python Dependencies

```powershell
cd "d:\Side Hustle\Minot - Copy (3)\ml-model"
python -m pip install torch transformers numpy
```

### 2. Verify ML Model Files

Ensure these files exist in `ml-model/` folder:
- `infer.py` ✓ (already exists)
- `feedback_bert_symptom_head_v2.pt` ✓ (model weights)
- `run_inference.py` ✓ (newly created wrapper)
- `models/feedback_bert.py` (model definition - should already exist)

### 3. Update Database Schema

**Option A: Via Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the entire contents of `backend/supabase-schema.sql`
4. Execute the SQL

**Option B: If starting fresh**
The schema file includes all tables. Just run it once.

### 4. Install Node.js Dependencies (if needed)

```powershell
cd "d:\Side Hustle\Minot - Copy (3)\backend"
npm install
```

### 5. Test the Setup

#### Test Python Model Directly
```powershell
cd "d:\Side Hustle\Minot - Copy (3)\ml-model"
echo '{"text":"I had fever and headache"}' | python run_inference.py
```

Expected output: JSON with sentiment analysis results

#### Start Backend Server
```powershell
cd "d:\Side Hustle\Minot - Copy (3)\backend"
npm start
```

### 6. Create Test Data

You'll need:
1. A doctor user account
2. A patient user account
3. At least one visit record
4. Some feedback records

Use the existing test scripts or API endpoints to create these.

### 7. Test the Features

#### Test Sentiment Analysis
```powershell
# Using PowerShell
$token = "YOUR_PATIENT_TOKEN"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$body = @{
    visit_id = "YOUR_VISIT_ID"
    rating = 4
    comments = "I had fever and headache. The doctor was very helpful but the waiting time was long."
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:4000/api/feedbacks" -Method POST -Headers $headers -Body $body
```

Wait a few seconds for async processing, then check the sentiment_analysis table.

#### Test Alert Generation
```powershell
$doctorToken = "YOUR_DOCTOR_TOKEN"
$headers = @{
    "Authorization" = "Bearer $doctorToken"
    "Content-Type" = "application/json"
}

Invoke-WebRequest -Uri "http://localhost:4000/api/alerts/detect" -Method POST -Headers $headers
```

#### View Alert Dashboard
```powershell
Invoke-WebRequest -Uri "http://localhost:4000/api/alerts/dashboard" -Method GET -Headers $headers
```

## Troubleshooting

### Python Not Found
```powershell
# Check Python installation
python --version

# If not found, download from python.org
```

### Module Import Errors
```powershell
# Ensure you're in the correct directory
cd "d:\Side Hustle\Minot - Copy (3)\ml-model"

# Verify dependencies
pip list | Select-String "torch|transformers"
```

### Model File Not Loading
```powershell
# Check if model file exists
Test-Path "d:\Side Hustle\Minot - Copy (3)\ml-model\feedback_bert_symptom_head_v2.pt"

# Check file size (should be several MB)
(Get-Item "d:\Side Hustle\Minot - Copy (3)\ml-model\feedback_bert_symptom_head_v2.pt").Length
```

### Database Connection Issues
- Verify SUPABASE_URL and SUPABASE_KEY in `.env` file
- Check network connection to Supabase
- Verify RLS policies allow service_role access

### No Alerts Generated
- Need at least 30 days of data for baseline calculation
- Symptom counts must significantly exceed baseline
- Try manually creating test data with high symptom counts

## API Endpoints Summary

### Feedback with Sentiment
- `POST /api/feedbacks` - Create feedback (triggers sentiment analysis)
- `GET /api/feedbacks/doctor/all` - Get all feedbacks with sentiment
- `GET /api/feedbacks/doctor/sentiment-stats` - Get sentiment statistics

### Alerts
- `GET /api/alerts/dashboard` - Dashboard overview
- `POST /api/alerts/detect` - Run anomaly detection
- `GET /api/alerts` - List active alerts
- `GET /api/alerts/:alertId` - Get alert details
- `POST /api/alerts/:alertId/acknowledge` - Acknowledge alert
- `POST /api/alerts/:alertId/resolve` - Resolve alert
- `GET /api/alerts/statistics/:symptom` - Get symptom statistics

## Next Steps

1. **Frontend Integration**
   - Create dashboard components for alerts
   - Show sentiment analysis in feedback views
   - Add alert notifications

2. **Scheduled Jobs**
   - Set up cron job to run anomaly detection daily
   - Schedule statistics updates

3. **Monitoring**
   - Set up logging for ML model errors
   - Monitor alert generation frequency
   - Track sentiment analysis performance

4. **Optimization**
   - Cache ML model in memory (avoid loading on each request)
   - Batch process feedbacks
   - Optimize database queries

## Support

For issues or questions:
1. Check the logs in backend console
2. Review `ALERT_SENTIMENT_IMPLEMENTATION.md` for detailed documentation
3. Test individual components separately to isolate issues
