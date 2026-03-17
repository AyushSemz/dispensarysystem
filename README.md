# 🏥 PEC Dispensary Management System  
### NLP-Based Feedback Analysis & Outbreak Detection

---

## 📌 Overview
This project is an intelligent dispensary management system that integrates **Natural Language Processing (NLP)** and **Neural Networks** to streamline healthcare services and extract insights from patient feedback.

It enables automated **symptom extraction, sentiment analysis, and outbreak detection**, helping institutions make **data-driven healthcare decisions**.

---

## 🚀 Features
- 🗓️ Appointment Management System  
- 💬 Patient Feedback Analysis using NLP  
- 🧠 Multi-task Learning with BERT  
- 📊 Aspect-Based Sentiment Analysis (ABSA)  
- 🦠 Symptom Extraction (Multi-label classification)  
- ⚠️ Outbreak Detection (Z-score, EWMA, CUSUM)  
- 📈 Real-time Dashboard & Analytics  

---

## 🧠 Tech Stack

| Layer        | Technology |
|-------------|-----------|
| Frontend     | Next.js / React |
| Backend      | Node.js |
| Model API    | FastAPI |
| ML Framework | PyTorch + HuggingFace Transformers |
| Database     | Supabase / Prisma |

---

## ⚙️ How It Works
1. User submits feedback via web interface  
2. Backend sends data to NLP model  
3. BERT-based model performs:
   - Symptom detection  
   - Sentiment classification  
   - Aspect-based sentiment analysis  
4. Results are stored and visualized on dashboard  
5. Outbreak detection engine analyzes trends and triggers alerts  

---

## 🧪 Model Details
- **Architecture:** BERT + Multi-Task Learning  
- **Tasks:**
  - Sentiment Classification *(Positive / Neutral / Negative)*  
  - Symptom Extraction *(Multi-label)*  
  - Aspect-Based Sentiment Analysis  

- **Accuracy:** ~74% on test dataset  

---

## 📊 Outbreak Detection
Uses statistical anomaly detection techniques:
- Z-Score Thresholding  
- EWMA (Exponentially Weighted Moving Average)  
- CUSUM  

➡️ Detects abnormal symptom spikes and generates alerts.

---

## 📁 Project Structure
frontend/ # React / Next.js UI
backend/ # Node.js API
model/ # NLP Model (FastAPI + BERT)
database/ # Schema & storage configs
docs/ # Reports & documentation

---
---

## 🔧 Setup Instructions

### 1️⃣ Clone Repository
git clone https://github.com/AyushSemz/dispensarysystem.git
cd dispensarysystem
2️⃣ Install Dependencies
# frontend
cd frontend
npm install

# backend
cd ../backend
npm install

# model
cd ../model
pip install -r requirements.txt
3️⃣ Run Services
# start frontend
npm run dev

# start backend
node server.js

# start model API
uvicorn main:app --reload
📈 Future Improvements

🔁 Real-time model retraining with new feedback

🧬 Disease prediction using symptom correlation

🌐 Multilingual NLP support

⌚ Integration with wearable health data
