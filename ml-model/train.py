import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import pickle
import os
import numpy as np

# Create model folder if not exists
os.makedirs("model", exist_ok=True)

# Load dataset
df = pd.read_csv("dataset/profiles.csv")

# Enhanced features for comprehensive fake profile detection
feature_columns = [
    # Profile Completeness
    "profile_completeness_score",
    
    # Name & Email Analysis
    "name_suspicion_score",
    "email_suspicion_score",
    
    # Photo Analysis
    "has_photo",
    "photo_anomaly_score",
    
    # Bio Analysis
    "bio_length",
    "bio_generic_phrases_count",
    "bio_red_flags_count",
    "bio_suspicion_score",
    
    # Account Age
    "days_since_creation",
    "account_age_suspicion_score",
    
    # Messaging Behavior
    "total_messages",
    "sent_messages",
    "response_rate",
    "message_to_request_ratio",
    "message_content_suspicion_score",
    
    # Friend Request Patterns
    "total_friend_requests",
    "accepted_friends",
    "request_acceptance_rate",
    
    # Behavior Patterns
    "activity_consistency_score",
    "interaction_diversity",
    "messaging_behavior_suspicion_score",
    
    # Spammer Indicators
    "spammer_indicators_score",
    
    # Mindset Analysis
    "mindset_suspicion_score",
    
    # Photo Consistency
    "photo_consistency_score"
]

# Select available features
available_features = [col for col in feature_columns if col in df.columns]
print(f"Using {len(available_features)} features for model training")
print(f"Features: {available_features}")

# Fill missing values with 0 (for any missing analysis data)
X = df[available_features].fillna(0)
y = df["fake"] if "fake" in df.columns else df.get("is_fake", df.get("label"))

print(f"Dataset shape: {X.shape}")
print(f"Fake profiles: {sum(y)}, Real profiles: {len(y) - sum(y)}")

# Feature scaling
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Training set size: {len(X_train)}, Test set size: {len(X_test)}")

# Train multiple models
print("\n📊 Training Random Forest Classifier...")
rf_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)
rf_model.fit(X_train, y_train)
rf_pred = rf_model.predict(X_test)
rf_accuracy = accuracy_score(y_test, rf_pred)
print(f"Random Forest Accuracy: {rf_accuracy:.4f}")

print("\n📊 Training Gradient Boosting Classifier...")
gb_model = GradientBoostingClassifier(
    n_estimators=150,
    learning_rate=0.1,
    max_depth=7,
    random_state=42
)
gb_model.fit(X_train, y_train)
gb_pred = gb_model.predict(X_test)
gb_accuracy = accuracy_score(y_test, gb_pred)
print(f"Gradient Boosting Accuracy: {gb_accuracy:.4f}")

# Choose best model
best_model = rf_model if rf_accuracy >= gb_accuracy else gb_model
best_accuracy = max(rf_accuracy, gb_accuracy)

print(f"\n🏆 Best Model: {'Random Forest' if rf_accuracy >= gb_accuracy else 'Gradient Boosting'}")
print(f"Best Accuracy: {best_accuracy:.4f}")

# Classification report
print("\n📈 Classification Report:")
best_pred = best_model.predict(X_test)
print(classification_report(y_test, best_pred, target_names=['Real', 'Fake']))

# Feature importance
print("\n🎯 Top 10 Most Important Features:")
if hasattr(best_model, 'feature_importances_'):
    feature_importance = pd.DataFrame({
        'feature': available_features,
        'importance': best_model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    for idx, row in feature_importance.head(10).iterrows():
        print(f"  {row['feature']}: {row['importance']:.4f}")

# Save model and scaler
with open("model/model.pkl", "wb") as f:
    pickle.dump(best_model, f)

with open("model/scaler.pkl", "wb") as f:
    pickle.dump(scaler, f)

with open("model/feature_columns.pkl", "wb") as f:
    pickle.dump(available_features, f)

print("\n✅ Model, Scaler, and Feature columns saved successfully!")
print("📁 Files saved:")
print("   - model/model.pkl")
print("   - model/scaler.pkl")
print("   - model/feature_columns.pkl")