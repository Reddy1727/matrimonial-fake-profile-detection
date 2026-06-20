import pickle
import sys
import json
import numpy as np

def predict_profile(features_dict):
    """
    Predict if profile is fake or real based on comprehensive features
    
    Args:
        features_dict: Dictionary of features extracted from advanced analysis
    
    Returns:
        JSON with prediction result and confidence score
    """
    try:
        # Load trained model
        with open("model/model.pkl", "rb") as f:
            model = pickle.load(f)
        
        # Load scaler
        with open("model/scaler.pkl", "rb") as f:
            scaler = pickle.load(f)
        
        # Load feature columns
        with open("model/feature_columns.pkl", "rb") as f:
            feature_columns = pickle.load(f)
        
        # Prepare feature array
        features_array = []
        for feature in feature_columns:
            features_array.append(features_dict.get(feature, 0))
        
        features_array = np.array(features_array).reshape(1, -1)
        
        # Scale features
        features_scaled = scaler.transform(features_array)
        
        # Get prediction
        prediction = model.predict(features_scaled)[0]
        
        # Get probability scores
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(features_scaled)[0]
            real_probability = probabilities[0] * 100
            fake_probability = probabilities[1] * 100
        else:
            real_probability = 0 if prediction == 1 else 100
            fake_probability = 100 if prediction == 1 else 0
        
        result = {
            "prediction": "Fake" if prediction == 1 else "Real",
            "fakeScore": fake_probability,
            "realScore": real_probability,
            "confidence": max(real_probability, fake_probability),
            "features_used": len(feature_columns)
        }
        
        return result
        
    except Exception as e:
        return {
            "error": str(e),
            "prediction": "UNKNOWN",
            "fakeScore": 0,
            "confidence": 0
        }

if __name__ == "__main__":
    # Parse input from command line (JSON format)
    if len(sys.argv) > 1:
        try:
            features_json = sys.argv[1]
            features_dict = json.loads(features_json)
            result = predict_profile(features_dict)
            print(json.dumps(result))
        except Exception as e:
            print(json.dumps({
                "error": f"Invalid input: {str(e)}",
                "prediction": "UNKNOWN"
            }))
    else:
        print(json.dumps({
            "error": "No features provided",
            "prediction": "UNKNOWN"
        }))