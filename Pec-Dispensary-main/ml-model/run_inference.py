#!/usr/bin/env python3
"""
Standalone wrapper for sentiment analysis inference.
Reads JSON from stdin and outputs JSON to stdout.
"""
import sys
import json
import os

# Add the ml-model directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

try:
    from infer import predict_feedback
except ImportError as e:
    print(json.dumps({"error": f"Failed to import model: {str(e)}"}), file=sys.stderr)
    sys.exit(1)

def main():
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        
        # Extract text
        text = data.get('text', '')
        
        if not text:
            result = {
                "error": "No text provided"
            }
            print(json.dumps(result))
            sys.exit(1)
        
        # Run prediction
        result = predict_feedback(text)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "error": str(e),
            "type": type(e).__name__
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
