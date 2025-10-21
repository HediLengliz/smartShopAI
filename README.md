📚 Documentation Complète - Entraînement du Classificateur de Langages
📋 Table des Matières
Vue d'ensemble
Bibliothèques utilisées
Phase de chargement du dataset
Phase d'entraînement
Architecture du modèle
Métriques et évaluation
Utilisation
🎯 Vue d'ensemble
Ce système entraîne un modèle de Machine Learning capable d'identifier automatiquement le langage de programmation d'un extrait de code. Il utilise une approche basée sur TF-IDF (Term Frequency-Inverse Document Frequency) avec des n-grammes de caractères pour capturer les patterns syntaxiques uniques à chaque langage.

Fonctionnalités principales
✅ Classification multi-langages (Python, JavaScript, Java, C++, etc.)
✅ Optimisation automatique des hyperparamètres (Grid Search)
✅ Validation croisée pour robustesse
✅ Visualisation des performances (matrice de confusion)
✅ Sauvegarde automatique du meilleur modèle
📦 Bibliothèques utilisées
1. Pandas (pandas)
Rôle: Manipulation et analyse de données

import pandas as pd
Utilisations:

Chargement du dataset JSON en DataFrame
Nettoyage des données (suppression des valeurs manquantes)
Manipulation des colonnes et lignes
Fonctions clés:

pd.read_json(): Charge un fichier JSON
df.dropna(): Supprime les lignes avec valeurs manquantes
df.astype(): Conversion de types
2. Scikit-learn (sklearn)
Rôle: Bibliothèque principale de Machine Learning

A. Vectorisation de texte
from sklearn.feature_extraction.text import TfidfVectorizer
TF-IDF: Transforme le texte en vecteurs numériques
Caractéristiques: N-grammes de caractères (1-3)
Dimensions: 20,000 features maximum
B. Algorithmes de classification
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.ensemble import RandomForestClassifier
Algorithme	Avantages	Utilisation
LogisticRegression	Rapide, efficace pour multi-classe	Classification baseline
LinearSVC	Excellent pour haute dimension	Données TF-IDF
RandomForest	Robuste, non-linéaire	Ensemble learning
C. Optimisation et validation
from sklearn.model_selection import train_test_split, GridSearchCV
train_test_split: Division train/test (80/20)
GridSearchCV: Recherche des meilleurs hyperparamètres
D. Métriques d'évaluation
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
accuracy_score: Précision globale
classification_report: Précision/Rappel/F1 par classe
confusion_matrix: Matrice de confusion
3. Joblib (joblib)
Rôle: Sérialisation efficace des modèles ML

import joblib
Utilisations:

Sauvegarde du modèle entraîné
Sauvegarde du vectoriseur TF-IDF
Chargement rapide pour l'inférence
Avantages vs pickle:

Plus rapide pour les grands objets numpy
Meilleure compression
4. NumPy (numpy)
Rôle: Calculs numériques et manipulation de matrices

import numpy as np
Utilisations:

Support pour les opérations TF-IDF
Manipulation des matrices sparse
Calculs vectorisés
5. Matplotlib & Seaborn (matplotlib.pyplot, seaborn)
Rôle: Visualisation des résultats

import matplotlib.pyplot as plt
import seaborn as sns
Utilisations:

Création de la matrice de confusion (heatmap)
Visualisation des performances
Export en image PNG
📂 Phase de chargement du dataset
Structure du dataset attendue
Le dataset doit être au format JSON avec la structure suivante:

[
    {
        "code_snippet": "def hello_world():\n    print('Hello, World!')",
        "language": "python"
    },
    {
        "code_snippet": "function helloWorld() {\n    console.log('Hello, World!');\n}",
        "language": "javascript"
    },
    {
        "code_snippet": "public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}",
        "language": "java"
    }
]
Étapes de chargement
┌─────────────────────────────────────────┐
│  1. Localisation du fichier JSON       │
│     dataset/code_analysis_dataset.json  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  2. Lecture avec pandas.read_json()     │
│     - Encodage: UTF-8                   │
│     - Format: Records                   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  3. Vérification de l'intégrité         │
│     - Nombre de lignes                  │
│     - Colonnes présentes                │
│     - Types de données                  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  4. Retour du DataFrame                 │
│     Colonnes: code_snippet, language    │
└─────────────────────────────────────────┘
Gestion des erreurs
❌ Fichier introuvable: Message d'erreur avec chemin
❌ JSON invalide: Capture de l'exception de parsing
❌ Encodage incorrect: UTF-8 forcé pour support multi-langues
❌ Dataset vide: Vérification avant traitement
Exemple de sortie
📂 Loading dataset from: dataset/code_analysis_dataset.json
✅ Loaded 15000 rows with columns: ['code_snippet', 'language']
🧠 Phase d'entraînement
Vue d'ensemble du pipeline
Dataset → Prétraitement → Vectorisation → Entraînement → Évaluation → Sauvegarde
  (JSON)      (Cleaning)     (TF-IDF)      (Grid Search)  (Metrics)    (Joblib)
Étape 1: Prétraitement des données
Objectif: Nettoyer et préparer les données pour l'entraînement

# Suppression des valeurs manquantes
df.dropna(subset=["code_snippet", "language"], inplace=True)

# Conversion en string (sécurité)
df["code_snippet"] = df["code_snippet"].astype(str)

# Séparation features/labels
X = df["code_snippet"]  # Code source
y = df["language"]       # Langage cible
Points clés:

✅ Élimination des NaN
✅ Uniformisation des types
✅ Séparation X/y pour sklearn
Étape 2: Vectorisation TF-IDF
Concept: Transformer le texte en vecteurs numériques

Pourquoi TF-IDF ?
TF (Term Frequency): Fréquence d'un terme dans un document IDF (Inverse Document Frequency): Importance d'un terme dans le corpus

Formule: TF-IDF = TF × log(N / DF)

N = nombre total de documents
DF = nombre de documents contenant le terme
Configuration optimale
TfidfVectorizer(
    analyzer='char_wb',      # N-grammes de caractères
    ngram_range=(1, 3),      # 1-3 caractères
    max_features=20000,      # Top 20k features
    sublinear_tf=True,       # Échelle logarithmique
    min_df=2                 # Minimum 2 occurrences
)
Pourquoi les n-grammes de caractères ?
Les langages de programmation ont des signatures syntaxiques uniques:

Langage	N-grammes caractéristiques
Python	def, :, (indentation)
JavaScript	function, =>, {}
Java	public, class, {, }
C++	::, #include, std::
Étape 3: Division Train/Test
X_train, X_test, y_train, y_test = train_test_split(
    X_vect, y, 
    test_size=0.2,      # 20% pour test
    stratify=y,         # Distribution égale des classes
    random_state=42     # Reproductibilité
)
Résultat:

🟦 80% des données → Entraînement
🟨 20% des données → Test
Étape 4: Sélection du modèle avec Grid Search
Algorithmes testés
1️⃣ Régression Logistique
LogisticRegression(
    max_iter=2000,           # Itérations max
    class_weight='balanced'  # Équilibrage des classes
)
Hyperparamètres testés: C ∈ {0.1, 1, 5}

C faible (0.1): Plus de régularisation, moins de surapprentissage
C élevé (5): Moins de régularisation, modèle plus flexible
2️⃣ Linear SVC
LinearSVC(
    class_weight='balanced'
)
Hyperparamètres testés: C ∈ {0.1, 1, 5}

Avantages:

⚡ Très rapide sur données haute dimension
🎯 Trouve l'hyperplan optimal
💪 Robuste avec TF-IDF
3️⃣ Random Forest
RandomForestClassifier(
    n_estimators=200,    # 200 arbres
    n_jobs=-1,           # Tous les CPU
    random_state=42
)
Pas de Grid Search (trop coûteux en calcul)

Processus de sélection
Pour chaque modèle:
  ├─ Si Grid Search applicable:
  │   ├─ Validation croisée 5-fold
  │   ├─ Test de toutes les combinaisons
  │   └─ Sélection du meilleur score CV
  │
  └─ Sinon:
      └─ Entraînement direct + test
  
→ Sélection du modèle avec le meilleur score
Étape 5: Évaluation
Métriques calculées
1. Accuracy (Précision globale)
Accuracy = Nombre de prédictions correctes / Total de prédictions
2. Classification Report
Pour chaque langage:

Precision: Parmi les prédictions de ce langage, combien sont correctes ?
Recall: Parmi tous les exemples de ce langage, combien sont trouvés ?
F1-Score: Moyenne harmonique de precision et recall
3. Confusion Matrix
Matrice N×N (N = nombre de langages)

Lignes: Vrais labels
Colonnes: Prédictions
Diagonale: Prédictions correctes
Visualisation:

sns.heatmap(cm, annot=False, cmap="Blues")
plt.savefig("confusion_matrix.png")
Étape 6: Sauvegarde
# Création du dossier
os.makedirs("models_v2", exist_ok=True)

# Sauvegarde du modèle
joblib.dump(best_model, "models_v2/best_model_*.pkl")

# Sauvegarde du vectoriseur
joblib.dump(vectorizer, "models_v2/tfidf_vectorizer.pkl")
Fichiers générés:

📦 best_model_LogisticRegression.pkl (ou autre)
📦 tfidf_vectorizer.pkl
🖼️ confusion_matrix.png
🏗️ Architecture du modèle
Pipeline complet
┌─────────────────────────────────────────────────────────────┐
│                     INPUT: Code Source                      │
│  "def hello():\n    print('Hello World')"                   │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              TF-IDF Vectorizer (char n-grams)               │
│  Features: ['d', 'de', 'def', 'ef ', 'f h', ...]           │
│  Dimensions: 20,000 features max                            │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Sparse Matrix (80% × 20k)                 │
│  Format: scipy.sparse.csr_matrix                            │
│  Taille: ~100 MB pour 10k exemples                          │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              Classifieur (LogisticRegression)               │
│  Couches: Input → Weights → Softmax → Output               │
│  Paramètres: ~20k × nb_classes                              │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                OUTPUT: Probabilités par classe              │
│  {"python": 0.95, "javascript": 0.03, "java": 0.02}        │
└─────────────────────────────────────────────────────────────┘
📊 Métriques et évaluation
Performance attendue
Métrique	Valeur typique	Interprétation
Accuracy	85-95%	Précision globale
Precision	85-98% par classe	Fiabilité des prédictions
Recall	80-95% par classe	Couverture des exemples
F1-Score	85-95%	Équilibre precision/recall
Exemple de Classification Report
              precision    recall  f1-score   support

      python       0.96      0.94      0.95       500
  javascript       0.93      0.95      0.94       480
        java       0.91      0.89      0.90       450
         cpp       0.88      0.91      0.89       420
          go       0.94      0.92      0.93       400

    accuracy                           0.92      2250
   macro avg       0.92      0.92      0.92      2250
weighted avg       0.93      0.92      0.92      2250
🚀 Utilisation
Lancement de l'entraînement
# Depuis le terminal
cd c:\Users\hedi2\Desktop\ai-agents
python ai-train.py
Prérequis
# Installation des dépendances
pip install pandas scikit-learn joblib numpy matplotlib seaborn
Structure des fichiers
ai-agents/
├── ai-train.py                          # Script principal
├── dataset/
│   └── code_analysis_dataset.json       # Dataset d'entraînement
├── models_v2/                           # Modèles générés
│   ├── best_model_*.pkl
│   └── tfidf_vectorizer.pkl
└── confusion_matrix.png                 # Visualisation
Sortie attendue
📂 Loading dataset from: dataset/code_analysis_dataset.json
✅ Loaded 15000 rows with columns: ['code_snippet', 'language']
🧹 Preprocessing data...
🔠 Building TF-IDF vectorizer (char-level + word-level)...
🧠 Selecting best model with Grid Search...
🔹 LogisticRegression CV accuracy: 0.9234 (best params: {'C': 1})
🔹 LinearSVC CV accuracy: 0.9189 (best params: {'C': 5})
🔹 RandomForest test accuracy: 0.8956

✅ Best model: LogisticRegression (CV/Test Accuracy: 0.9234)

📊 Evaluating model on test set...

🎯 Test Accuracy: 0.9267

Classification Report:
...

🖼️ Confusion matrix saved as 'confusion_matrix.png'

💾 Model saved: models_v2/best_model_LogisticRegression.pkl
💾 Vectorizer saved: models_v2/tfidf_vectorizer.pkl
✅ Training complete.
📝 Notes techniques
Optimisations possibles
Augmenter max_features pour plus de précision (mémoire++)
Tester d'autres algorithmes (XGBoost, Neural Networks)
Utiliser des embeddings de code (CodeBERT)
Limitations
Sensible à la qualité du dataset
Performance réduite sur langages rares
Nécessite réentraînement pour nouveaux langages
Dernière mise à jour: 2024 Version: 2.0
