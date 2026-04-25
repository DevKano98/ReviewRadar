"""
Train fake review detection model.

Run this script ONCE before starting the FastAPI server:
    python -m app.ml.train_model

Output:
    - backend/app/ml/fake_review_model.pkl
    - backend/app/ml/tfidf_vectorizer.pkl
    - backend/app/ml/model_metadata.json
"""

import json
import joblib
import numpy as np
import pandas as pd
from scipy.sparse import hstack
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, accuracy_score
from datasets import load_dataset
from app.ml.preprocessor import clean_text, extract_features


def main():
    print("=" * 60)
    print("REVIEWRADAR ML MODEL TRAINING")
    print("=" * 60)
    
    
    print("\n[1/17] Loading dataset from HuggingFace...")
    dataset = load_dataset("theArijitDas/Fake-Reviews-Dataset")
    df = pd.DataFrame(dataset['train'])
    
    print(f"✓ Loaded {len(df):,} reviews")
    
   
    print("\n[2/17] Cleaning data...")
    df = df.dropna(subset=['text', 'label'])
    df['text'] = df['text'].astype(str)
    df['label'] = df['label'].astype(int)
    
    print(f"✓ Cleaned dataset: {len(df):,} reviews")
    
    
    print("\n[3/17] Class distribution:")
    class_dist = df['label'].value_counts()
    print(f"  Real (0): {class_dist.get(0, 0):,}")
    print(f"  Fake (1): {class_dist.get(1, 0):,}")
    
   
    print("\n[4/17] Cleaning review text...")
    df['cleaned_text'] = df['text'].apply(clean_text)
    print("✓ Text preprocessing complete")
    
    
    print("\n[5/17] Extracting engineered features...")
    ratings = df['rating'].fillna(3).astype(int).tolist() if 'rating' in df.columns else [3] * len(df)
    features = extract_features(df['cleaned_text'].tolist(), ratings)
    print(f"✓ Extracted {len(features[0])} features per review")
    
    
    print("\n[6/17] Splitting train/test sets (80/20)...")
    X_text = df['cleaned_text'].values
    y = df['label'].values
    X_features = features
    
    X_text_train, X_text_test, X_feat_train, X_feat_test, y_train, y_test = train_test_split(
        X_text, X_features, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"✓ Train: {len(X_text_train):,} | Test: {len(X_text_test):,}")
    
    
    print("\n[7/17] Creating TF-IDF vectors...")
    vectorizer = TfidfVectorizer(
        max_features=20000,
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=3,
        max_df=0.90,
        stop_words='english'
    )
    
    X_tfidf_train = vectorizer.fit_transform(X_text_train)
    X_tfidf_test = vectorizer.transform(X_text_test)
    
    print(f"✓ TF-IDF shape: {X_tfidf_train.shape}")
    
   
    print("\n[8/17] Combining TF-IDF with engineered features...")
    
   
    feat_train_array = np.array([[v for v in feat.values()] for feat in X_feat_train])
    feat_test_array = np.array([[v for v in feat.values()] for feat in X_feat_test])
    
   
    X_train_combined = hstack([X_tfidf_train, feat_train_array])
    X_test_combined = hstack([X_tfidf_test, feat_test_array])
    
    print(f"✓ Combined shape: {X_train_combined.shape}")
    
   
    print("\n[9/17] Training Logistic Regression...")
    lr_model = LogisticRegression(
        max_iter=1000,
        C=3.0,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    lr_model.fit(X_train_combined, y_train)
    lr_acc = accuracy_score(y_test, lr_model.predict(X_test_combined))
    print(f"✓ Logistic Regression Accuracy: {lr_acc:.4f}")
    
   
    print("\n[10/17] Training XGBoost...")
    try:
        from xgboost import XGBClassifier
        
        xgb_model = XGBClassifier(
            n_estimators=400,
            max_depth=7,
            learning_rate=0.1,
            subsample=0.8,
            scale_pos_weight=2,
            eval_metric='logloss',
            random_state=42,
            n_jobs=-1
        )
        
        
        xgb_model.fit(X_train_combined.toarray(), y_train)
        xgb_acc = accuracy_score(y_test, xgb_model.predict(X_test_combined.toarray()))
        print(f"✓ XGBoost Accuracy: {xgb_acc:.4f}")
        
    except ImportError:
        print("⚠ XGBoost not installed - skipping")
        xgb_model = None
        xgb_acc = 0.0
    
   
    print("\n[11/17] Training Random Forest...")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        class_weight='balanced',
        n_jobs=-1,
        random_state=42
    )
    rf_model.fit(X_train_combined, y_train)
    rf_acc = accuracy_score(y_test, rf_model.predict(X_test_combined))
    print(f"✓ Random Forest Accuracy: {rf_acc:.4f}")
    
    
    print("\n[12/17] Selecting best model...")
    models = {
        'LogisticRegression': (lr_model, lr_acc),
        'XGBoost': (xgb_model, xgb_acc) if xgb_model else (None, 0.0),
        'RandomForest': (rf_model, rf_acc)
    }
    
    best_name = max(models.items(), key=lambda x: x[1][1])[0]
    best_model, best_acc = models[best_name]
    
    print(f"✓ Best model: {best_name} ({best_acc:.4f})")
    
   
    print("\n[13/17] Computing evaluation metrics...")
    
   
    if best_name == 'XGBoost' and best_model:
        y_pred = best_model.predict(X_test_combined.toarray())
        y_proba = best_model.predict_proba(X_test_combined.toarray())[:, 1]
    else:
        y_pred = best_model.predict(X_test_combined)
        y_proba = best_model.predict_proba(X_test_combined)[:, 1]
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Real', 'Fake']))
    
   
    print("\n[14/17] Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(cm)
    
   
    print("\n[15/17] Computing ROC-AUC...")
    roc_auc = roc_auc_score(y_test, y_proba)
    print(f"✓ ROC-AUC Score: {roc_auc:.4f}")
    
    
    print("\n[16/17] Saving models...")
    import os
   
    for file in ['app/ml/fake_review_model.pkl', 'app/ml/tfidf_vectorizer.pkl']:
        if os.path.exists(file):
            os.remove(file)
    joblib.dump(best_model, 'app/ml/fake_review_model.pkl')
    joblib.dump(vectorizer, 'app/ml/tfidf_vectorizer.pkl')
    
    metadata = {
        'model_type': best_name,
        'accuracy': float(best_acc),
        'roc_auc': float(roc_auc),
        'n_features': X_train_combined.shape[1],
        'vocab_size': len(vectorizer.vocabulary_),
        'trained_on_samples': len(X_text_train)
    }
    
    with open('app/ml/model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print("✓ Saved fake_review_model.pkl")
    print("✓ Saved tfidf_vectorizer.pkl")
    print("✓ Saved model_metadata.json")
    
   
    print("\n[17/17] Running sanity tests...")
    
    test_reviews = [
        ("This product is absolutely amazing! Best purchase ever!!!", 5),
        ("Decent quality for the price. Works as expected.", 4),
        ("Complete waste of money. Broke after 2 days.", 1),
        ("Great product highly recommend fast shipping love it!!!", 5)
    ]
    
    print("\nTest Predictions:")
    for text, rating in test_reviews:
        cleaned = clean_text(text)
        tfidf_vec = vectorizer.transform([cleaned])
        feat = extract_features([text], [rating])[0]
        feat_array = np.array([[v for v in feat.values()]])
        combined = hstack([tfidf_vec, feat_array])
        
        if best_name == 'XGBoost' and best_model:
            proba = best_model.predict_proba(combined.toarray())[0][1]
        else:
            proba = best_model.predict_proba(combined)[0][1]
        
        label = "FAKE" if proba >= 0.6 else "REAL"
        print(f"  [{label}] {proba:.3f} - {text[:60]}...")
    
    print("\n" + "=" * 60)
    print("✅ TRAINING COMPLETE!")
    print("=" * 60)
    print(f"Model Type: {best_name}")
    print(f"Accuracy: {best_acc:.4f}")
    print(f"ROC-AUC: {roc_auc:.4f}")
    print("\nYou can now start the FastAPI server with:")
    print("  uvicorn app.main:app --reload --port 8000")
    print("=" * 60)


if __name__ == "__main__":
    main()