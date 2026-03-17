"""
Feedback BERT Model Architecture
Multi-task model for symptom detection, overall sentiment, and aspect sentiment
"""
import torch
import torch.nn as nn
from transformers import BertModel


class DispensaryFeedbackModel(nn.Module):
    """
    Multi-task BERT model for dispensary feedback analysis.
    
    Outputs:
    1. Symptom detection (multi-label binary classification)
    2. Overall sentiment (3-class classification)
    3. Aspect sentiments (6 aspects × 3-class classification)
    """
    
    def __init__(
        self,
        bert_name="bert-base-uncased",
        num_symptoms=10,
        num_overall_classes=3,
        num_aspects=6,
        num_aspect_classes=3,
        dropout=0.3,
    ):
        super().__init__()
        
        self.bert = BertModel.from_pretrained(bert_name)
        hidden_size = self.bert.config.hidden_size  # 768 for bert-base
        
        # Symptom detection head (multi-label binary) - Simple single layer
        self.symptom_head = nn.Linear(hidden_size, num_symptoms)
        
        # Overall sentiment head (3-class: negative, neutral, positive) - Simple single layer
        self.overall_head = nn.Linear(hidden_size, num_overall_classes)
        
        # Aspect sentiment head (6 aspects × 3-class) - Simple single layer
        self.aspect_head = nn.Linear(hidden_size, num_aspects * num_aspect_classes)
        
        self.num_aspects = num_aspects
        self.num_aspect_classes = num_aspect_classes
    
    def forward(self, input_ids, attention_mask):
        """
        Forward pass
        
        Args:
            input_ids: [batch_size, seq_len]
            attention_mask: [batch_size, seq_len]
        
        Returns:
            symptom_logits: [batch_size, num_symptoms]
            overall_logits: [batch_size, num_overall_classes]
            aspect_logits: [batch_size, num_aspects, num_aspect_classes]
        """
        # Get BERT outputs
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        
        # Use [CLS] token representation
        cls_output = outputs.last_hidden_state[:, 0, :]  # [batch_size, hidden_size]
        
        # Symptom detection
        symptom_logits = self.symptom_head(cls_output)  # [batch_size, num_symptoms]
        
        # Overall sentiment
        overall_logits = self.overall_head(cls_output)  # [batch_size, num_overall_classes]
        
        # Aspect sentiments
        aspect_flat = self.aspect_head(cls_output)  # [batch_size, num_aspects * num_aspect_classes]
        aspect_logits = aspect_flat.view(
            -1, self.num_aspects, self.num_aspect_classes
        )  # [batch_size, num_aspects, num_aspect_classes]
        
        return symptom_logits, overall_logits, aspect_logits
