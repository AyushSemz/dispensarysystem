# Quick Reference: Alert Generation & Sentiment Analysis

## 🚀 Quick Start

```powershell
# 1. Install Python dependencies
cd ml-model
pip install torch transformers numpy

# 2. Update database
# Run backend/supabase-schema.sql in Supabase SQL Editor

# 3. Start backend
cd backend
npm start
```

## 📊 Key Endpoints

### Patient Submits Feedback
```bash
POST /api/feedbacks
Body: { "visit_id": "...", "rating": 4, "comments": "..." }
→ Triggers sentiment analysis automatically
```

### Doctor Views Sentiment Stats
```bash
GET /api/feedbacks/doctor/sentiment-stats
→ Returns aggregated sentiment data
```

### Doctor Views Alerts
```bash
GET /api/alerts/dashboard
→ Returns alert summary

GET /api/alerts
→ Returns active alerts
```

### Run Anomaly Detection
```bash
POST /api/alerts/detect
→ Checks all 10 symptoms for anomalies
```

### Manage Alerts
```bash
POST /api/alerts/:id/acknowledge
POST /api/alerts/:id/resolve
```

## 🔍 Anomaly Detection Methods

| Method | Threshold | Severity |
|--------|-----------|----------|
| Z-Score | > 3σ | MEDIUM |
| Z-Score | > 4σ | HIGH |
| Z-Score | > 5σ | CRITICAL |
| EWMA | > 2σ deviation | MEDIUM |
| EWMA | > 3σ deviation | HIGH |
| Consecutive | 3 days | HIGH |

## 🎯 Tracked Symptoms (10)

1. `symptom_cough`
2. `symptom_fever`
3. `symptom_diarrhea`
4. `symptom_vomiting`
5. `symptom_breathlessness`
6. `symptom_headache`
7. `symptom_sore_throat`
8. `symptom_body_pain`
9. `symptom_rash`
10. `symptom_fatigue`

## 📈 Aspect Sentiments (6)

1. `aspect_cleanliness`
2. `aspect_staff_behaviour`
3. `aspect_waiting_time`
4. `aspect_doctor_explanation`
5. `aspect_medicine_availability`
6. `aspect_crowd_management`

## 🗄️ New Database Tables

| Table | Purpose |
|-------|---------|
| `sentiment_analysis` | ML model results |
| `outbreak_alerts` | Generated alerts |
| `symptom_statistics` | Daily symptom counts & baselines |

## 🔐 Required Roles

| Endpoint | Role |
|----------|------|
| `/api/feedbacks` POST | PATIENT |
| `/api/feedbacks/doctor/*` | DOCTOR |
| `/api/alerts/*` | DOCTOR, ADMIN |

## 📁 File Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── sentimentService.js       ← Sentiment analysis
│   │   └── anomalyDetectionService.js ← Alert generation
│   ├── controllers/
│   │   ├── alertController.js        ← Alert endpoints
│   │   └── feedbackController.js     ← Enhanced feedback
│   └── routes/
│       ├── alertRoutes.js            ← New routes
│       └── feedbackRoutes.js         ← Enhanced routes
├── supabase-schema.sql               ← Database schema
└── IMPLEMENTATION_SUMMARY.md         ← Full docs

ml-model/
├── infer.py                          ← BERT model (existing)
├── run_inference.py                  ← Node.js wrapper (new)
├── feedback_bert_symptom_head_v2.pt  ← Model weights
└── models/
    ├── feedback_bert.py              ← Model architecture
    └── __init__.py
```

## 🔄 Workflow

```
Patient Submits Feedback
    ↓
Saved to Database
    ↓
Sentiment Analysis (async)
    ↓
Python ML Model → Results
    ↓
Save to sentiment_analysis Table
    ↓
Trigger Anomaly Detection
    ↓
Check: Z-Score, EWMA, Consecutive
    ↓
Generate Alerts (if threshold exceeded)
    ↓
Doctor Views Dashboard
```

## 💡 Common Tasks

### Test Sentiment Analysis
```javascript
// Create feedback with comments
const response = await fetch('/api/feedbacks', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    visit_id: visitId,
    rating: 4,
    comments: 'I had fever and headache...'
  })
});

// Wait 5 seconds for processing
// Then check sentiment_analysis table
```

### Check for Alerts
```javascript
const alerts = await fetch('/api/alerts', {
  headers: { 'Authorization': `Bearer ${doctorToken}` }
}).then(r => r.json());

console.log('Active alerts:', alerts);
```

### View Sentiment Stats
```javascript
const stats = await fetch('/api/feedbacks/doctor/sentiment-stats', {
  headers: { 'Authorization': `Bearer ${doctorToken}` }
}).then(r => r.json());

console.log('Positive:', stats.positive);
console.log('Negative:', stats.negative);
console.log('Top symptoms:', stats.symptomBreakdown);
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Python errors | Check `pip list` for torch, transformers |
| Model not loading | Verify `.pt` file exists |
| No alerts | Need 30+ days of data for baseline |
| Sentiment not saving | Check async processing logs |
| DB errors | Run schema migration |

## 📚 Documentation Files

- `API_DOCUMENTATION.md` - Complete API reference
- `IMPLEMENTATION_SUMMARY.md` - Feature overview
- `ALERT_SENTIMENT_IMPLEMENTATION.md` - Technical details
- `SETUP_GUIDE.md` - Installation steps

## 🧪 Test Script

```powershell
cd backend
node test-alert-sentiment.js
```

## ⚙️ Configuration

**No new env variables needed!**
- Uses existing Supabase config
- Uses existing JWT auth
- Python runs as subprocess

## 🎯 Next Steps

1. ✅ Run database migration
2. ✅ Install Python dependencies
3. ✅ Test sentiment analysis
4. ✅ Test alert generation
5. 🔲 Build frontend UI
6. 🔲 Add notifications
7. 🔲 Schedule daily detection

## 💻 Code Snippets

### Acknowledge Alert (Node.js)
```javascript
await fetch(`/api/alerts/${alertId}/acknowledge`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ 
    notes: 'Investigating...' 
  })
});
```

### Get Dashboard (React)
```javascript
const [dashboard, setDashboard] = useState(null);

useEffect(() => {
  fetch('/api/alerts/dashboard', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(setDashboard);
}, []);
```

## 🔑 Key Features

✅ Automatic sentiment analysis using trained BERT model
✅ 3 types of anomaly detection (Z-score, EWMA, Consecutive)
✅ Real-time alert generation
✅ Doctor dashboard with statistics
✅ Alert management (acknowledge/resolve)
✅ Symptom trend tracking
✅ Aspect sentiment analysis
✅ Fully integrated with Supabase

---

**Need Help?** Check the full documentation files or review the implementation summary.
