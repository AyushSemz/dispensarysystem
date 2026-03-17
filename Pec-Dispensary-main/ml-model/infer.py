# # infer.py

# import torch
# import torch.nn.functional as F
# import numpy as np
# from transformers import BertTokenizer
# from typing import Dict, Any

# from models.feedback_bert import DispensaryFeedbackModel

# # -----------------------------
# # CONFIG
# # -----------------------------
# DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
# BERT_NAME = "bert-base-uncased"
# MODEL_CKPT = "feedback_bert_symptom_head_v2.pt"   # <- change if your file name is different

# symptom_cols = [
#     "symptom_cough",
#     "symptom_fever",
#     "symptom_diarrhea",
#     "symptom_vomiting",
#     "symptom_breathlessness",
#     "symptom_headache",
#     "symptom_sore_throat",
#     "symptom_body_pain",
#     "symptom_rash",
#     "symptom_fatigue",
# ]

# aspect_cols = [
#     "aspect_cleanliness",
#     "aspect_staff_behaviour",
#     "aspect_waiting_time",
#     "aspect_doctor_explanation",
#     "aspect_medicine_availability",
#     "aspect_crowd_management",
# ]

# num_symptoms = len(symptom_cols)
# num_overall_classes = 3   # negative / neutral / positive
# num_aspects = len(aspect_cols)
# num_aspect_classes = 3    # negative / neutral / positive

# overall_id2label = {
#     0: "negative",
#     1: "neutral",
#     2: "positive",
# }

# aspect_id2label = {
#     0: "negative",
#     1: "neutral",
#     2: "positive",
# }

# # -----------------------------
# # DYNAMIC SYMPTOM DECODING
# # -----------------------------

# def decode_symptoms_dynamic(symptom_probs, rel_factor=0.7, floor=0.15):
#     """
#     symptom_probs: list or np.array of length len(symptom_cols)
#                    values in [0, 1] after sigmoid
#     rel_factor: how close to the max a prob must be to be considered present
#     floor: absolute minimum confidence below which we predict no symptom

#     Returns: list of symptom column names predicted as present
#     """
#     probs = np.array(symptom_probs, dtype=float)
#     # max_p = probs.max()

#     # # If everything is very low -> no symptoms
#     # if max_p < floor:
#     #     return []

#     # # Dynamic threshold based on the top probability
#     # dynamic_thr = max(max_p * rel_factor, floor)

#     # chosen = []
#     # for i, p in enumerate(probs):
#     #     if p >= dynamic_thr:
#     #         chosen.append(symptom_cols[i])

#     x = max(symptom_probs)
#     chosen = []
#     for i, p in enumerate(probs):
#         if p >= x - 0.15:
#             chosen.append(symptom_cols[i])

#     return chosen


# # -----------------------------
# # LOAD TOKENIZER & MODEL
# # -----------------------------

# tokenizer = BertTokenizer.from_pretrained(BERT_NAME)

# model = DispensaryFeedbackModel(
#     bert_name=BERT_NAME,
#     num_symptoms=num_symptoms,
#     num_overall_classes=num_overall_classes,
#     num_aspects=num_aspects,
#     num_aspect_classes=num_aspect_classes,
# ).to(DEVICE)

# state_dict = torch.load(MODEL_CKPT, map_location=DEVICE)
# model.load_state_dict(state_dict)
# model.eval()

# print(f"Loaded model from {MODEL_CKPT} on device={DEVICE}")


# # -----------------------------
# # INFERENCE FUNCTION
# # -----------------------------

# def predict_feedback(text: str):
#     """
#     Run the full pipeline on a single feedback string.

#     Returns a dict:
#     {
#         "symptoms": [...],
#         "overall": "positive/neutral/negative",
#         "aspects": { aspect_name: sentiment, ... },
#         "symptom_probs": { symptom_name: float, ... }
#     }
#     """
#     # 1. Tokenize
#     enc = tokenizer(
#         text,
#         max_length=128,
#         padding="max_length",
#         truncation=True,
#         return_tensors="pt",
#     )

#     input_ids = enc["input_ids"].to(DEVICE)
#     attention_mask = enc["attention_mask"].to(DEVICE)

#     # 2. Forward pass
#     with torch.no_grad():
#         symptom_logits, overall_logits, aspect_logits = model(input_ids, attention_mask)

#         # symptom_logits: [1, num_symptoms]
#         # overall_logits: [1, 3]
#         # aspect_logits:  [1, num_aspects, 3]

#         symptom_probs_t = torch.sigmoid(symptom_logits)[0]  # [num_symptoms]
#         overall_probs_t = F.softmax(overall_logits, dim=-1)[0]  # [3]
#         aspect_probs_t = F.softmax(aspect_logits, dim=-1)[0]    # [num_aspects, 3]

#     # To CPU / numpy
#     symptom_probs = symptom_probs_t.cpu().numpy()
#     overall_probs = overall_probs_t.cpu().numpy()
#     aspect_probs = aspect_probs_t.cpu().numpy()

#     # 3. Decode overall sentiment
#     overall_idx = int(overall_probs.argmax())
#     overall_label = overall_id2label[overall_idx]

#     # 4. Decode aspects
#     aspect_results = {}
#     for i, aspect_name in enumerate(aspect_cols):
#         aspect_idx = int(aspect_probs[i].argmax())
#         aspect_results[aspect_name] = aspect_id2label[aspect_idx]

#     # 5. Decode symptoms with dynamic thresholds
#     predicted_symptoms = decode_symptoms_dynamic(
#         symptom_probs,
#         rel_factor=0.7,   # you can tune these
#         floor=0.12,
#     )

#     # 6. Symptom probabilities as a dict
#     symptom_prob_dict = {
#         symptom_cols[i]: float(symptom_probs[i])
#         for i in range(len(symptom_cols))
#     }

#     result = {
#         "symptoms": predicted_symptoms,
#         "overall": overall_label,
#         "aspects": aspect_results,
#         "symptom_probs": symptom_prob_dict,
#     }
#     return result


# if __name__ == "__main__":
#     tests = [
#         "I was down with headache and fever. the washrooms were very dirty, the doctor explained everything clearly.",
#         "I had cough and sore throat. The nurse was polite, but the waiting time was extremely long.",
#         "I had diarrhea and stomach cramps. The nurse helped me immediately, but the washroom was unhygienic.",
#         "The nurse was very rude and did not respond to my requests.",
#         "The washrooms were very dirty today.",
#         "The doctor explained my condition very clearly and patiently.",
#         "I was having diarrhea and vomiting. The doctor diagnosed it efficiently but the staff was rude.",
#         "the staff was quick to examine my sore throat. the doctor prescribed adequate medicine. however the cleanliness needs improvement."
#     ]

#     for t in tests:
#         print("INPUT:")
#         print(t)
#         out = predict_feedback(t)
#         print("OUTPUT:")
#         print(out)
#         print("-" * 80)

# def _call_existing_inference(text: str, device: str = "cpu") -> Dict[str, Any]:
#     """
#     Try several common function names that might exist in this module.
#     If you have a function like `predict(text)` or `run(text, model)` it will try them.
#     If none are present, raise a helpful error.
#     """
#     # look for commonly used inference function names in this module
#     candidates = [ "predict_feedback"
#     ]
#     for name in candidates:
#         if name in globals() and callable(globals()[name]):
#             fn = globals()[name]
#             try:
#                 # try calling with (text)
#                 return fn(text)
#             except TypeError:
#                 try:
#                     # try calling with (model, tokenizer, text) if you load them globally
#                     return fn(globals().get("MODEL", None), globals().get("TOKENIZER", None), text)
#                 except TypeError:
#                     pass
#     # fallback: if this file loaded `predict_from_text` or similar variables, try a couple more
#     # If you have a global function you know the name of, add it to the candidates list above.

#     raise RuntimeError(
#         "infer.py: could not find a usable inference function. "
#         "Please expose `run_inference_on_text(model, tokenizer, text, device='cpu')` "
#         "or `run_inference(model, tokenizer, text, device='cpu')` or a function named `infer`/`predict`.\n"
#         "If your main inference function is named differently, either rename it or add a wrapper as shown."
#     )

# def run_inference_on_text(model, tokenizer, text, device="cpu"):
#     """
#     Standard wrapper used by the evaluator.

#     - `model` and `tokenizer` are passed through from eval; if your module already uses
#       global MODEL/TOKENIZER it will ignore these.
#     - Returns dict:
#         {
#           "symptoms": [...],                  # list of symptom labels present
#           "symptom_probs": {"symptom_x":0.12, ...},  # probabilities for all symptom labels
#           "aspects": {"aspect_cleanliness":"positive", ...},
#           "overall": "positive"               # or neutral/negative
#         }
#     """
#     # If your module already has MODEL/TOKENIZER loaded as globals, prefer those
#     try:
#         # If your existing inference returns the right dict, just forward it
#         # Try calling the existing function(s)
#         out = _call_existing_inference(text, device=device)
#         # Ensure keys exist and types are sane:
#         out = dict(out) if isinstance(out, dict) else {}
#     except Exception as e:
#         # If nothing matched, raise a helpful error including the original exception
#         raise RuntimeError("Wrapper failed to call existing inference: " + str(e))

#     # Normalize output: ensure symptom_probs contains all labels
#     if "symptom_probs" not in out:
#         probs = {lab: float(0.0) for lab in [
#             "symptom_cough","symptom_fever","symptom_diarrhea","symptom_vomiting",
#             "symptom_breathlessness","symptom_headache","symptom_sore_throat",
#             "symptom_body_pain","symptom_rash","symptom_fatigue"
#         ]}
#         # if 'symptoms' exists, set those to 0.9 as a fallback (not ideal)
#         if "symptoms" in out and isinstance(out["symptoms"], (list,tuple)):
#             for s in out["symptoms"]:
#                 if s in probs:
#                     probs[s] = 0.9
#         out["symptom_probs"] = probs

#     if "symptoms" not in out:
#         # derive symptom list from probs with threshold 0.5 (eval script may use dynamic thresholds)
#         out["symptoms"] = [k for k,v in out["symptom_probs"].items() if float(v) >= 0.5]

#     if "aspects" not in out:
#         out["aspects"] = {}

#     if "overall" not in out:
#         out["overall"] = "neutral"

#     return out
# # --------- END OF ADDITION ----------

# infer.py

import torch
import torch.nn.functional as F
import numpy as np
from transformers import BertTokenizer
from typing import Dict, Any, List

# Import your model definition
from models.feedback_bert import DispensaryFeedbackModel

# -----------------------------
# CONFIG
# -----------------------------
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
BERT_NAME = "bert-base-uncased"
MODEL_CKPT = "feedback_bert_symptom_head_v2.pt"

symptom_cols = [
    "symptom_cough",
    "symptom_fever",
    "symptom_diarrhea",
    "symptom_vomiting",
    "symptom_breathlessness",
    "symptom_headache",
    "symptom_sore_throat",
    "symptom_body_pain",
    "symptom_rash",
    "symptom_fatigue",
]

aspect_cols = [
    "aspect_cleanliness",
    "aspect_staff_behaviour",
    "aspect_waiting_time",
    "aspect_doctor_explanation",
    "aspect_medicine_availability",
    "aspect_crowd_management",
]

num_symptoms = len(symptom_cols)
num_overall_classes = 3   # negative / neutral / positive
num_aspects = len(aspect_cols)
num_aspect_classes = 3    # negative / neutral / positive

overall_id2label = {
    0: "negative",
    1: "neutral",
    2: "positive",
}

aspect_id2label = {
    0: "negative",
    1: "neutral",
    2: "positive",
}

# -----------------------------
# RULE BASE DEFINITION
# -----------------------------
# Dictionary mapping canonical symptom labels to keywords/phrases
SYMPTOM_KEYWORDS = {
    "symptom_cough": ["cough", "coughing", "dry throat"],
    "symptom_fever": ["fever", "high temperature", "chills", "shivering", "hot body", "temperature"],
    "symptom_diarrhea": ["diarrhea", "loose motion", "stomach upset", "runny stomach", "dysentery"],
    "symptom_vomiting": ["vomit", "vomiting", "puking", "throwing up", "nausea", "queasy"],
    "symptom_breathlessness": ["breathless", "breathing difficulty", "short of breath", "asthma", "wheezing", "gasping"],
    "symptom_headache": ["headache", "head pain", "migraine", "throbbing head"],
    "symptom_sore_throat": ["sore throat", "throat pain", "difficulty swallowing", "itchy throat"],
    "symptom_body_pain": ["body pain", "body ache", "back pain", "joint pain", "muscle pain", "aching"],
    "symptom_rash": ["rash", "itching", "red spots", "allergy", "hives", "skin irritation"],
    "symptom_fatigue": ["fatigue", "tired", "weakness", "exhaustion", "dizzy", "dizziness", "low energy"],
}

# -----------------------------
# HELPER FUNCTIONS
# -----------------------------

def decode_symptoms_dynamic(symptom_probs, rel_factor=0.7, floor=0.15):
    """
    Decodes symptoms based on model probabilities.
    """
    probs = np.array(symptom_probs, dtype=float)
    x = max(symptom_probs)
    
    chosen = []
    # If the maximum probability is extremely low, the model might be unsure,
    # but we still apply the relative threshold logic provided in your snippet.
    for i, p in enumerate(probs):
        # Your specific logic: relative to max minus a margin
        if p >= x - 0.15:
            chosen.append(symptom_cols[i])

    return chosen

def apply_rule_base(text: str, predicted_symptoms: List[str], symptom_probs_dict: Dict[str, float]):
    """
    Scans the text for keywords. If a keyword is found:
    1. Adds the symptom to predicted_symptoms (if not already there).
    2. Updates the symptom_probs_dict to 1.0 (certainty).
    """
    text_lower = text.lower()
    
    for symptom, keywords in SYMPTOM_KEYWORDS.items():
        # Check if any keyword for this symptom exists in the text
        if any(keyword in text_lower for keyword in keywords):
            # Update Prediction List
            if symptom not in predicted_symptoms:
                predicted_symptoms.append(symptom)
            
            # Update Probability Dictionary (Force to 1.0 because we found a direct match)
            symptom_probs_dict[symptom] = 1.0
            
    return predicted_symptoms, symptom_probs_dict


# -----------------------------
# LOAD TOKENIZER & MODEL
# -----------------------------

tokenizer = BertTokenizer.from_pretrained(BERT_NAME)

model = DispensaryFeedbackModel(
    bert_name=BERT_NAME,
    num_symptoms=num_symptoms,
    num_overall_classes=num_overall_classes,
    num_aspects=num_aspects,
    num_aspect_classes=num_aspect_classes,
).to(DEVICE)

try:
    state_dict = torch.load(MODEL_CKPT, map_location=DEVICE)
    model.load_state_dict(state_dict)
    model.eval()
    print(f"Loaded model from {MODEL_CKPT} on device={DEVICE}")
except FileNotFoundError:
    print(f"WARNING: Model checkpoint {MODEL_CKPT} not found. Running with random weights.")

# -----------------------------
# INFERENCE FUNCTION
# -----------------------------

def predict_feedback(text: str):
    """
    Run the full pipeline on a single feedback string.
    Combines Deep Learning predictions with Rule-Based keyword matching.
    """
    # 1. Tokenize
    enc = tokenizer(
        text,
        max_length=128,
        padding="max_length",
        truncation=True,
        return_tensors="pt",
    )

    input_ids = enc["input_ids"].to(DEVICE)
    attention_mask = enc["attention_mask"].to(DEVICE)

    # 2. Forward pass (Deep Learning)
    with torch.no_grad():
        symptom_logits, overall_logits, aspect_logits = model(input_ids, attention_mask)

        symptom_probs_t = torch.sigmoid(symptom_logits)[0]  # [num_symptoms]
        overall_probs_t = F.softmax(overall_logits, dim=-1)[0]  # [3]
        aspect_probs_t = F.softmax(aspect_logits, dim=-1)[0]    # [num_aspects, 3]

    # To CPU / numpy
    symptom_probs = symptom_probs_t.cpu().numpy()
    overall_probs = overall_probs_t.cpu().numpy()
    aspect_probs = aspect_probs_t.cpu().numpy()

    # 3. Decode overall sentiment
    overall_idx = int(overall_probs.argmax())
    overall_label = overall_id2label[overall_idx]

    # 4. Decode aspects
    aspect_results = {}
    for i, aspect_name in enumerate(aspect_cols):
        aspect_idx = int(aspect_probs[i].argmax())
        aspect_results[aspect_name] = aspect_id2label[aspect_idx]

    # 5. Decode symptoms (Model Prediction)
    predicted_symptoms = decode_symptoms_dynamic(
        symptom_probs,
        rel_factor=0.7,
        floor=0.12,
    )

    # 6. Create Probability Dict
    symptom_prob_dict = {
        symptom_cols[i]: float(symptom_probs[i])
        for i in range(len(symptom_cols))
    }

    # ---------------------------------------------------------
    # 7. APPLY RULE BASE (Hybrid Logic)
    # ---------------------------------------------------------
    predicted_symptoms, symptom_prob_dict = apply_rule_base(
        text, 
        predicted_symptoms, 
        symptom_prob_dict
    )

    result = {
        "symptoms": predicted_symptoms,
        "overall": overall_label,
        "aspects": aspect_results,
        "symptom_probs": symptom_prob_dict,
    }
    return result


if __name__ == "__main__":
    tests = [
        "I was down with headache and fever. the washrooms were very dirty, the doctor explained everything clearly.",
        "I had cough and sore throat. The nurse was polite, but the waiting time was extremely long.",
        "I had diarrhea and stomach cramps. The nurse helped me immediately, but the washroom was unhygienic.",
        "The nurse was very rude and did not respond to my requests.",
        "The washrooms were very dirty today.",
        "The doctor explained my condition very clearly and patiently.",
        "I was having diarrhea and vomiting. The doctor diagnosed it efficiently but the staff was rude.",
        "the staff was quick to examine my sore throat. the doctor prescribed adequate medicine. however the cleanliness needs improvement.",
        "I was puking all night and had a high temp." # Test case for rule base (puking/high temp)
    ]

    for t in tests:
        print("INPUT:")
        print(t)
        out = predict_feedback(t)
        print("OUTPUT:")
        print(out)
        print("-" * 80)

# -----------------------------
# WRAPPERS FOR EVALUATION
# -----------------------------

def _call_existing_inference(text: str, device: str = "cpu") -> Dict[str, Any]:
    """
    Try several common function names that might exist in this module.
    """
    candidates = ["predict_feedback"]
    for name in candidates:
        if name in globals() and callable(globals()[name]):
            fn = globals()[name]
            try:
                return fn(text)
            except TypeError:
                try:
                    return fn(globals().get("MODEL", None), globals().get("TOKENIZER", None), text)
                except TypeError:
                    pass
    raise RuntimeError(
        "infer.py: could not find a usable inference function."
    )

def run_inference_on_text(model, tokenizer, text, device="cpu"):
    """
    Standard wrapper used by the evaluator.
    """
    try:
        out = _call_existing_inference(text, device=device)
        out = dict(out) if isinstance(out, dict) else {}
    except Exception as e:
        raise RuntimeError("Wrapper failed to call existing inference: " + str(e))

    if "symptom_probs" not in out:
        probs = {lab: float(0.0) for lab in symptom_cols}
        if "symptoms" in out and isinstance(out["symptoms"], (list,tuple)):
            for s in out["symptoms"]:
                if s in probs:
                    probs[s] = 0.9
        out["symptom_probs"] = probs

    if "symptoms" not in out:
        out["symptoms"] = [k for k,v in out["symptom_probs"].items() if float(v) >= 0.5]

    if "aspects" not in out:
        out["aspects"] = {}

    if "overall" not in out:
        out["overall"] = "neutral"

    return out