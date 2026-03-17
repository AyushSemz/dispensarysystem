# API Documentation: Alert Generation & Sentiment Analysis

## Base URL
```
http://localhost:4000/api
```

## Authentication
All endpoints require JWT authentication via Bearer token:
```
Authorization: Bearer <your_token>
```

---

## Feedback Endpoints

### 1. Create Feedback (with Sentiment Analysis)
**POST** `/feedbacks`

Creates feedback and automatically triggers sentiment analysis.

**Headers:**
```
Authorization: Bearer <patient_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "visit_id": "uuid",
  "rating": 4,
  "comments": "I had fever and headache. The doctor was very helpful but the waiting time was extremely long."
}
```

**Response:** `201 Created`
```json
{
  "id": "feedback-uuid",
  "visit_id": "visit-uuid",
  "patient_id": "patient-uuid",
  "rating": 4,
  "comments": "I had fever and headache...",
  "processed": false,
  "created_at": "2025-12-09T10:30:00Z"
}
```

**Notes:**
- Sentiment analysis runs asynchronously after response is sent
- Anomaly detection is automatically triggered after sentiment analysis
- Check `processed` field later to confirm completion

---

### 2. Get All Doctor Feedbacks
**GET** `/feedbacks/doctor/all`

Retrieves all feedbacks for the authenticated doctor with sentiment analysis.

**Headers:**
```
Authorization: Bearer <doctor_token>
```

**Query Parameters:**
- `startDate` (optional): ISO date string (e.g., "2025-01-01")
- `endDate` (optional): ISO date string
- `sentiment` (optional): "positive", "neutral", or "negative"

**Example Request:**
```
GET /api/feedbacks/doctor/all?startDate=2025-01-01&sentiment=negative
```

**Response:** `200 OK`
```json
[
  {
    "id": "feedback-uuid",
    "visit_id": "visit-uuid",
    "patient_id": "patient-uuid",
    "rating": 4,
    "comments": "I had fever and headache...",
    "processed": true,
    "created_at": "2025-12-09T10:30:00Z",
    "patient": {
      "full_name": "John Doe",
      "email": "john@example.com"
    },
    "visit": {
      "visit_time": "2025-12-09T09:00:00Z",
      "diagnosis_text": "Common cold"
    },
    "sentiment": [
      {
        "id": "sentiment-uuid",
        "feedback_id": "feedback-uuid",
        "overall_sentiment": "positive",
        "sentiment_score": 0.90,
        "detected_symptoms": ["symptom_fever", "symptom_headache"],
        "symptom_probabilities": {
          "symptom_fever": 0.92,
          "symptom_headache": 0.85,
          "symptom_cough": 0.12
        },
        "aspects": {
          "aspect_cleanliness": "neutral",
          "aspect_staff_behaviour": "positive",
          "aspect_waiting_time": "negative",
          "aspect_doctor_explanation": "positive"
        },
        "processed_at": "2025-12-09T10:30:15Z"
      }
    ]
  }
]
```

---

### 3. Get Sentiment Statistics for Doctor
**GET** `/feedbacks/doctor/sentiment-stats`

Returns aggregated sentiment statistics for the authenticated doctor.

**Headers:**
```
Authorization: Bearer <doctor_token>
```

**Query Parameters:**
- `startDate` (optional): ISO date string (default: last 30 days)
- `endDate` (optional): ISO date string (default: now)

**Example Request:**
```
GET /api/feedbacks/doctor/sentiment-stats?startDate=2025-11-01&endDate=2025-12-09
```

**Response:** `200 OK`
```json
{
  "total": 45,
  "positive": 28,
  "neutral": 12,
  "negative": 5,
  "avgScore": 0.75,
  "symptomBreakdown": {
    "symptom_fever": 18,
    "symptom_headache": 15,
    "symptom_cough": 12,
    "symptom_diarrhea": 8
  },
  "aspectBreakdown": {
    "aspect_cleanliness": {
      "positive": 10,
      "neutral": 20,
      "negative": 15
    },
    "aspect_staff_behaviour": {
      "positive": 35,
      "neutral": 8,
      "negative": 2
    },
    "aspect_waiting_time": {
      "positive": 5,
      "neutral": 15,
      "negative": 25
    }
  }
}
```

---

### 4. Get Feedback for Visit
**GET** `/feedbacks/:visitId`

Retrieves feedback for a specific visit with sentiment analysis.

**Headers:**
```
Authorization: Bearer <doctor_token>
```

**Response:** `200 OK`
```json
[
  {
    "id": "feedback-uuid",
    "visit_id": "visit-uuid",
    "patient_id": "patient-uuid",
    "rating": 5,
    "comments": "Excellent service",
    "processed": true,
    "created_at": "2025-12-09T10:30:00Z",
    "patient": {
      "full_name": "Jane Smith"
    },
    "sentiment": [
      {
        "overall_sentiment": "positive",
        "detected_symptoms": [],
        "aspects": {...}
      }
    ]
  }
]
```

---

## Alert Endpoints

### 5. Get Alert Dashboard
**GET** `/alerts/dashboard`

Returns a summary dashboard with alert statistics.

**Headers:**
```
Authorization: Bearer <doctor_token>
```

**Response:** `200 OK`
```json
{
  "activeAlertsCount": 12,
  "alertsBySeverity": {
    "CRITICAL": 2,
    "HIGH": 4,
    "MEDIUM": 5,
    "LOW": 1
  },
  "recentAlertsCount": 8,
  "topSymptoms": [
    { "symptom": "symptom_fever", "count": 5 },
    { "symptom": "symptom_cough", "count": 3 },
    { "symptom": "symptom_diarrhea", "count": 2 }
  ]
}
```

---

### 6. Run Anomaly Detection
**POST** `/alerts/detect`

Manually triggers anomaly detection for all symptoms.

**Headers:**
```
Authorization: Bearer <doctor_token>
Content-Type: application/json
```

**Response:** `200 OK`
```json
{
  "message": "Anomaly detection completed",
  "alertsCreated": 3,
  "alerts": [
    {
      "id": "alert-uuid",
      "symptom": "symptom_fever",
      "alert_type": "z-score",
      "severity": "HIGH",
      "status": "ACTIVE",
      "threshold_value": 3,
      "current_value": 4.2,
      "detection_method": "Z-score anomaly detected: 4.20 (threshold: 3)",
      "patient_count": 45,
      "created_at": "2025-12-09T10:30:00Z"
    }
  ]
}
```

---

### 7. Detect Specific Symptom Anomaly
**POST** `/alerts/detect/:symptom`

Triggers anomaly detection for a specific symptom.

**Headers:**
```
Authorization: Bearer <doctor_token>
```

**Example Request:**
```
POST /api/alerts/detect/symptom_fever
```

**Response:** `200 OK`
```json
{
  "message": "Anomaly detection completed for symptom_fever",
  "alertsCreated": 1,
  "alerts": [...]
}
```

---

### 8. Get Active Alerts
**GET** `/alerts`

Retrieves all active alerts.

**Headers:**
```
Authorization: Bearer <doctor_token>
```

**Query Parameters:**
- `symptom` (optional): Filter by symptom (e.g., "symptom_fever")
- `severity` (optional): Filter by severity ("LOW", "MEDIUM", "HIGH", "CRITICAL")

**Example Request:**
```
GET /api/alerts?severity=HIGH&symptom=symptom_fever
```

**Response:** `200 OK`
```json
[
  {
    "id": "alert-uuid",
    "symptom": "symptom_fever",
    "alert_type": "z-score",
    "severity": "HIGH",
    "status": "ACTIVE",
    "threshold_value": 3,
    "current_value": 4.2,
    "detection_method": "Z-score anomaly detected: 4.20 (threshold: 3)",
    "affected_period_start": "2025-12-09T00:00:00Z",
    "affected_period_end": "2025-12-09T23:59:59Z",
    "patient_count": 45,
    "metadata": {
      "z_score": 4.2,
      "baseline_mean": 15.3,
      "baseline_std_dev": 7.1,
      "current_count": 45
    },
    "created_at": "2025-12-09T10:30:00Z",
    "acknowledged_at": null,
    "acknowledged_by": null,
    "resolved_at": null,
    "resolved_by": null,
    "notes": null
  }
]
```

---

### 9. Get Alert History
**GET** `/alerts/history`

Retrieves historical alerts with filtering options.

**Headers:**
```
Authorization: Bearer <doctor_token>
```

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `symptom` (optional): Symptom name
- `status` (optional): "ACTIVE", "ACKNOWLEDGED", or "RESOLVED"

**Example Request:**
```
GET /api/alerts/history?startDate=2025-11-01&status=RESOLVED
```

**Response:** `200 OK`
```json
[
  {
    "id": "alert-uuid",
    "symptom": "symptom_fever",
    "status": "RESOLVED",
    "resolved_at": "2025-11-15T14:30:00Z",
    "resolved_by": "doctor-uuid",
    "notes": "False alarm - seasonal variation",
    ...
  }
]
```

---

### 10. Get Alert by ID
**GET** `/alerts/:alertId`

Retrieves details of a specific alert.

**Headers:**
```
Authorization: Bearer <doctor_token>
```

**Response:** `200 OK`
```json
{
  "id": "alert-uuid",
  "symptom": "symptom_fever",
  "alert_type": "z-score",
  "severity": "HIGH",
  ...
}
```

---

### 11. Acknowledge Alert
**POST** `/alerts/:alertId/acknowledge`

Marks an alert as acknowledged (doctor is investigating).

**Headers:**
```
Authorization: Bearer <doctor_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "notes": "Investigating the spike in fever cases. Checking for common source."
}
```

**Response:** `200 OK`
```json
{
  "message": "Alert acknowledged",
  "alert": {
    "id": "alert-uuid",
    "status": "ACKNOWLEDGED",
    "acknowledged_at": "2025-12-09T11:00:00Z",
    "acknowledged_by": "doctor-uuid",
    "notes": "Investigating the spike...",
    ...
  }
}
```

---

### 12. Resolve Alert
**POST** `/alerts/:alertId/resolve`

Marks an alert as resolved.

**Headers:**
```
Authorization: Bearer <doctor_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "notes": "Confirmed as seasonal flu outbreak. Measures implemented."
}
```

**Response:** `200 OK`
```json
{
  "message": "Alert resolved",
  "alert": {
    "id": "alert-uuid",
    "status": "RESOLVED",
    "resolved_at": "2025-12-09T15:00:00Z",
    "resolved_by": "doctor-uuid",
    "notes": "Confirmed as seasonal flu...",
    ...
  }
}
```

---

### 13. Get Symptom Statistics
**GET** `/alerts/statistics/:symptom`

Retrieves historical statistics for a specific symptom.

**Headers:**
```
Authorization: Bearer <doctor_token>
```

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Example Request:**
```
GET /api/alerts/statistics/symptom_fever?startDate=2025-11-01
```

**Response:** `200 OK`
```json
[
  {
    "id": "stat-uuid",
    "symptom": "symptom_fever",
    "date": "2025-12-09",
    "count": 45,
    "mean_value": 45,
    "std_dev": 7.1,
    "ewma_value": 38.2,
    "baseline_mean": 15.3,
    "baseline_std_dev": 7.1,
    "updated_at": "2025-12-09T10:30:00Z"
  },
  {
    "date": "2025-12-08",
    "count": 32,
    ...
  }
]
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Visit ID (or Appointment ID) and a rating are required."
}
```

### 401 Unauthorized
```json
{
  "message": "No token provided" 
}
```

### 403 Forbidden
```json
{
  "message": "Access denied."
}
```

### 404 Not Found
```json
{
  "message": "Alert not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Failed to run anomaly detection"
}
```

---

## Data Models

### Sentiment Analysis Result
```typescript
{
  id: string;
  feedback_id: string;
  overall_sentiment: "positive" | "neutral" | "negative";
  sentiment_score: number; // 0.0 to 1.0
  detected_symptoms: string[]; // Array of symptom names
  symptom_probabilities: {
    [symptom: string]: number; // Probability 0.0 to 1.0
  };
  aspects: {
    [aspect: string]: "positive" | "neutral" | "negative";
  };
  processed_at: string; // ISO timestamp
}
```

### Alert
```typescript
{
  id: string;
  symptom: string;
  alert_type: "z-score" | "ewma" | "consecutive-day";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  threshold_value: number;
  current_value: number;
  detection_method: string;
  affected_period_start: string; // ISO timestamp
  affected_period_end: string; // ISO timestamp
  patient_count: number;
  metadata: object;
  created_at: string; // ISO timestamp
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  notes?: string;
}
```

### Symptom Statistics
```typescript
{
  id: string;
  symptom: string;
  date: string; // YYYY-MM-DD
  count: number;
  mean_value: number;
  std_dev: number;
  ewma_value: number;
  baseline_mean: number;
  baseline_std_dev: number;
  updated_at: string; // ISO timestamp
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. Recommended for production:
- Feedback creation: 10 requests per minute per user
- Anomaly detection: 5 requests per minute per user
- Alert queries: 60 requests per minute per user

---

## Best Practices

1. **Feedback Creation**: Always include comments for sentiment analysis
2. **Alert Management**: Acknowledge alerts before investigating
3. **Batch Processing**: Use query parameters to filter large datasets
4. **Error Handling**: Always check response status codes
5. **Async Processing**: Don't wait for sentiment analysis to complete
6. **Data Freshness**: Run anomaly detection regularly (e.g., daily cron job)

---

## Support

For issues or questions, refer to:
- `IMPLEMENTATION_SUMMARY.md` - Feature overview
- `ALERT_SENTIMENT_IMPLEMENTATION.md` - Technical documentation
- `SETUP_GUIDE.md` - Setup instructions
