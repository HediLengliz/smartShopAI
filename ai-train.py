"""
Classificateur de Langage de Code - Module d'Entraînement
=========================================================

Ce module entraîne un modèle de Machine Learning robuste pour prédire
le langage de programmation d'un extrait de code en utilisant TF-IDF
et différents algorithmes de classification.

Bibliothèques utilisées:
------------------------
- pandas: Manipulation et analyse de données
- scikit-learn: Algorithmes ML, vectorisation TF-IDF, métriques
- joblib: Sérialisation des modèles ML
- numpy: Calculs numériques
- seaborn & matplotlib: Visualisation des résultats
- json & os: Gestion des fichiers

Flux de travail:
---------------
1. Chargement du dataset (fichier JSON)
2. Prétraitement des données
3. Vectorisation TF-IDF (n-grammes de caractères)
4. Entraînement avec Grid Search pour optimiser les hyperparamètres
5. Évaluation et visualisation des performances
6. Sauvegarde du meilleur modèle et du vectoriseur

Auteur: AI Training Pipeline
Date: 2024
"""

import os
import json
import pandas as pd
import joblib
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt

# =============================
# 1. Chargement du dataset
# =============================
def load_dataset(path):
    """
    Charge le dataset de classification de langages depuis un fichier JSON.
    
    Phase de Chargement:
    -------------------
    Cette fonction réalise les opérations suivantes:
    1. Localise le fichier JSON contenant les exemples de code
    2. Charge les données avec l'encodage UTF-8
    3. Vérifie l'intégrité du dataset (nombre de lignes, colonnes)
    4. Affiche un résumé des données chargées
    
    Structure attendue du JSON:
    --------------------------
    [
        {
            "code_snippet": "def hello():\n    print('Hello')",
            "language": "python"
        },
        {
            "code_snippet": "function hello() { console.log('Hello'); }",
            "language": "javascript"
        },
        ...
    ]
    
    Paramètres:
    ----------
    path : str
        Chemin complet vers le fichier JSON du dataset
    
    Retourne:
    --------
    pd.DataFrame
        DataFrame Pandas contenant les colonnes 'code_snippet' et 'language'
        Retourne None en cas d'erreur de chargement
    
    Gestion des erreurs:
    -------------------
    - Fichier introuvable
    - Format JSON invalide
    - Problèmes d'encodage
    
    Exemple:
    -------
    >>> df = load_dataset("dataset/code_analysis_dataset.json")
    📂 Loading dataset from: dataset/code_analysis_dataset.json
    ✅ Loaded 10000 rows with columns: ['code_snippet', 'language']
    """
    print(f"📂 Loading dataset from: {path}")
    try:
        df = pd.read_json(path, encoding="utf-8")
        print(f"✅ Loaded {len(df)} rows with columns: {list(df.columns)}")
        return df
    except Exception as e:
        print(f"❌ Error loading dataset: {e}")
        return None


# =============================
# 2. Entraînement et sauvegarde du modèle
# =============================
def train_and_save_model(df):
    """
    Entraîne et sauvegarde un modèle de classification de langages de programmation.
    
    Phase d'Entraînement Complète:
    ==============================
    
    ÉTAPE 1: Prétraitement des Données
    ----------------------------------
    - Suppression des valeurs manquantes (NaN)
    - Conversion des extraits de code en chaînes de caractères
    - Séparation des features (X) et des labels (y)
    
    ÉTAPE 2: Vectorisation TF-IDF
    -----------------------------
    Bibliothèque: sklearn.feature_extraction.text.TfidfVectorizer
    
    Paramètres de vectorisation:
    - analyzer='char_wb': N-grammes de caractères (avec limites de mots)
      → Capture les patterns syntaxiques spécifiques à chaque langage
      → Exemple: "def ", "function ", "{", "}", etc.
    
    - ngram_range=(1, 3): Utilise 1-grammes, 2-grammes et 3-grammes
      → Capture à la fois les caractères individuels et les séquences
      → Exemple: 'd', 'de', 'def' pour Python
    
    - max_features=20000: Limite à 20000 features les plus importantes
      → Réduit la dimensionnalité tout en gardant les features pertinentes
      → Optimise la mémoire et la vitesse d'entraînement
    
    - sublinear_tf=True: Applique une échelle logarithmique aux fréquences
      → Réduit l'impact des termes très fréquents
      → Formule: 1 + log(tf) au lieu de tf
    
    - min_df=2: Ignore les n-grammes apparaissant dans moins de 2 documents
      → Élimine les features trop rares (bruit)
    
    ÉTAPE 3: Division Train/Test
    ----------------------------
    Bibliothèque: sklearn.model_selection.train_test_split
    
    - test_size=0.2: 80% pour l'entraînement, 20% pour le test
    - stratify=y: Maintient la distribution des classes dans train et test
    - random_state=42: Reproductibilité des résultats
    
    ÉTAPE 4: Sélection et Optimisation du Modèle
    --------------------------------------------
    Trois algorithmes sont comparés avec Grid Search:
    
    a) Régression Logistique (LogisticRegression)
       Bibliothèque: sklearn.linear_model
       - Algorithme linéaire rapide et efficace
       - class_weight='balanced': Gère les classes déséquilibrées
       - Hyperparamètre C (régularisation): [0.1, 1, 5]
       - Performant pour la classification multi-classe
    
    b) Support Vector Machine Linéaire (LinearSVC)
       Bibliothèque: sklearn.svm
       - Trouve l'hyperplan optimal de séparation
       - Très efficace pour des données haute dimension (TF-IDF)
       - class_weight='balanced': Ajuste pour les classes déséquilibrées
       - Hyperparamètre C: [0.1, 1, 5]
    
    c) Random Forest
       Bibliothèque: sklearn.ensemble
       - Ensemble de 200 arbres de décision
       - n_jobs=-1: Utilise tous les cœurs CPU disponibles
       - Robuste au surapprentissage
       - Pas d'optimisation par Grid Search (trop lent)
    
    Grid Search (sklearn.model_selection.GridSearchCV):
    - cv=5: Validation croisée à 5 plis
    - n_jobs=-1: Parallélisation maximale
    - Teste toutes les combinaisons d'hyperparamètres
    - Sélectionne automatiquement la meilleure configuration
    
    ÉTAPE 5: Évaluation des Performances
    ------------------------------------
    Métriques utilisées (sklearn.metrics):
    
    - accuracy_score: Pourcentage de prédictions correctes
    - classification_report: Précision, rappel, F1-score par classe
    - confusion_matrix: Matrice de confusion visualisée avec Seaborn
    
    Visualisation:
    - Bibliothèques: matplotlib.pyplot, seaborn
    - Heatmap de la matrice de confusion
    - Sauvegarde en image PNG
    
    ÉTAPE 6: Sauvegarde
    -------------------
    Bibliothèque: joblib
    
    Fichiers sauvegardés:
    - Modèle ML optimisé (.pkl)
    - Vectoriseur TF-IDF (.pkl)
    - Localisation: dossier 'models_v2/'
    
    Paramètres:
    ----------
    df : pd.DataFrame
        DataFrame contenant les colonnes 'code_snippet' et 'language'
    
    Sorties:
    -------
    - Modèle entraîné sauvegardé dans models_v2/best_model_*.pkl
    - Vectoriseur sauvegardé dans models_v2/tfidf_vectorizer.pkl
    - Matrice de confusion sauvegardée dans confusion_matrix.png
    - Rapport de classification affiché dans la console
    
    Performance attendue:
    --------------------
    - Précision typique: 85-95% selon la qualité du dataset
    - Temps d'entraînement: 2-10 minutes selon la taille du dataset
    
    Exemple:
    -------
    >>> df = load_dataset("dataset/code_analysis_dataset.json")
    >>> train_and_save_model(df)
    🧹 Preprocessing data...
    🔠 Building TF-IDF vectorizer...
    🧠 Selecting best model with Grid Search...
    ...
    ✅ Best model: LogisticRegression (CV/Test Accuracy: 0.9234)
    💾 Model saved: models_v2/best_model_LogisticRegression.pkl
    """
    if df is None or df.empty:
        print("❌ Dataset is empty or invalid.")
        return

    print("🧹 Preprocessing data...")
    df.dropna(subset=["code_snippet", "language"], inplace=True)
    df["code_snippet"] = df["code_snippet"].astype(str)

    X = df["code_snippet"]
    y = df["language"]

    # --- Vectorizer ---
    print("🔠 Building TF-IDF vectorizer (char-level + word-level)...")
    vectorizer = TfidfVectorizer(
        sublinear_tf=True,
        max_features=20000,
        ngram_range=(1, 3),
        analyzer="char_wb",  # character n-grams perform very well for language identification
        min_df=2
    )

    X_vect = vectorizer.fit_transform(X)

    # --- Split ---
    X_train, X_test, y_train, y_test = train_test_split(
        X_vect, y, test_size=0.2, stratify=y, random_state=42
    )

    # --- Choose Model ---
    print("🧠 Selecting best model with Grid Search...")

    models = {
        "LogisticRegression": LogisticRegression(max_iter=2000, class_weight="balanced"),
        "LinearSVC": LinearSVC(class_weight="balanced"),
        "RandomForest": RandomForestClassifier(n_estimators=200, n_jobs=-1, random_state=42)
    }

    # Parameter grid for the top 2 models
    param_grid = {
        "LogisticRegression": {"C": [0.1, 1, 5]},
        "LinearSVC": {"C": [0.1, 1, 5]}
    }

    best_model = None
    best_acc = 0
    best_name = None

    for name, model in models.items():
        if name in param_grid:
            grid = GridSearchCV(model, param_grid[name], cv=5, n_jobs=-1)
            grid.fit(X_train, y_train)
            acc = grid.best_score_
            print(f"🔹 {name} CV accuracy: {acc:.4f} (best params: {grid.best_params_})")
            if acc > best_acc:
                best_acc = acc
                best_model = grid.best_estimator_
                best_name = name
        else:
            model.fit(X_train, y_train)
            acc = model.score(X_test, y_test)
            print(f"🔹 {name} test accuracy: {acc:.4f}")
            if acc > best_acc:
                best_acc = acc
                best_model = model
                best_name = name

    print(f"\n✅ Best model: {best_name} (CV/Test Accuracy: {best_acc:.4f})")

    # --- Evaluate ---
    print("\n📊 Evaluating model on test set...")
    y_pred = best_model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n🎯 Test Accuracy: {acc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # --- Confusion Matrix ---
    cm = confusion_matrix(y_test, y_pred, labels=sorted(y.unique()))
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=False, cmap="Blues",
                xticklabels=sorted(y.unique()),
                yticklabels=sorted(y.unique()))
    plt.title("Language Prediction Confusion Matrix")
    plt.xlabel("Predicted")
    plt.ylabel("True")
    plt.tight_layout()
    plt.savefig("confusion_matrix.png")
    print("🖼️ Confusion matrix saved as 'confusion_matrix.png'")

    # --- Save model & vectorizer ---
    model_dir = "models_v2"
    os.makedirs(model_dir, exist_ok=True)

    model_path = os.path.join(model_dir, f"best_model_{best_name}.pkl")
    vec_path = os.path.join(model_dir, "tfidf_vectorizer.pkl")

    joblib.dump(best_model, model_path)
    joblib.dump(vectorizer, vec_path)

    print(f"\n💾 Model saved: {model_path}")
    print(f"💾 Vectorizer saved: {vec_path}")
    print("✅ Training complete.")


# =============================
# 3. Main entry
# =============================
if __name__ == "__main__":
    dataset_path = os.path.join("dataset", "code_analysis_dataset.json")
    dataset = load_dataset(dataset_path)
    train_and_save_model(dataset)
