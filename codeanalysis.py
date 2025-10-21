import os
import json
import joblib
import re

class CodeAnalysisAgent:
    def __init__(self, model_dir="models"):
        """
        Initializes the agent by loading the trained model and vectorizer.
        """
        self.model, self.vectorizer = self.load_model(model_dir)

    def load_model(self, model_dir):
        """
        Loads the trained model and vectorizer from the specified directory.
        """
        model_path = os.path.join(model_dir, "code_language_model.pkl")
        vectorizer_path = os.path.join(model_dir, "code_vectorizer.pkl")

        if not os.path.exists(model_path) or not os.path.exists(vectorizer_path):
            print("⚠️ ERROR: Model or vectorizer not found. Please run ai-train.py first.")
            return None, None

        print("✅ Loading trained model and vectorizer...")
        model = joblib.load(model_path)
        vectorizer = joblib.load(vectorizer_path)
        print("✅ Model and vectorizer loaded successfully.")
        return model, vectorizer

    def predict(self, code_snippet: str) -> str:
        """
        Predicts the language of a raw code snippet and returns the label.
        """
        if not self.model or not self.vectorizer:
            raise RuntimeError("Model or vectorizer is not loaded.")
        vectorized = self.vectorizer.transform([code_snippet])
        return self.model.predict(vectorized)[0]

    def analyze_code(self, code_snippet):
        """
        Analyzes the given code snippet to predict its language and provide feedback.
        """
        if not self.model or not self.vectorizer:
            return {"error": "Model or vectorizer is not loaded."}

        # --- Predict language ---
        vectorized_code = self.vectorizer.transform([code_snippet])
        predicted_language = self.model.predict(vectorized_code)[0].lower()

        # --- Metrics ---
        line_count = len(code_snippet.splitlines())
        comment_lines = len(re.findall(r"(^\s*#|//|/\*|\*/|\*\s)", code_snippet, re.MULTILINE))
        comment_ratio = round(comment_lines / line_count, 2) if line_count > 0 else 0

        analysis_result = {
            "predicted_language": predicted_language,
            "metrics": {
                "line_count": line_count,
                "comment_lines": comment_lines,
                "comment_ratio": comment_ratio
            },
            "best_practices": [],
            "suggestions": [],
            "framework_recommendations": []
        }

        # --- Run per-language analysis ---
        if predicted_language == "java":
            self._analyze_java(code_snippet, analysis_result)
        elif predicted_language == "python":
            self._analyze_python(code_snippet, analysis_result)
        elif predicted_language in {"javascript", "typescript"}:
            self._analyze_js_ts(code_snippet, analysis_result)
        elif predicted_language == "c#":
            self._analyze_csharp(code_snippet, analysis_result)
        elif predicted_language in {"html", "css"}:
            self._analyze_web(code_snippet, analysis_result)
        else:
            analysis_result["suggestions"].append(
                f"No specific rules for language '{predicted_language}'. Add language-specific rules for deeper insights."
            )

        # --- General suggestions ---
        if line_count > 300:
            analysis_result["suggestions"].append(
                f"This file has {line_count} lines. Consider splitting it into smaller, maintainable modules."
            )

        if comment_ratio < 0.05:
            analysis_result["suggestions"].append(
                "Very few comments detected. Adding explanations improves readability and team collaboration."
            )

        return analysis_result

    # ----------------------------
    # LANGUAGE-SPECIFIC ANALYZERS
    # ----------------------------

    def _analyze_java(self, code, result):
        result["best_practices"].append("Encapsulation through private fields and public methods is good OOP design.")
        if "@RestController" in code:
            result["best_practices"].append("Spring Boot REST Controller detected — aligns with modern Java practices.")
            if "@GetMapping" not in code:
                result["suggestions"].append("Consider using @GetMapping, @PostMapping annotations for cleaner endpoints.")
            if "@Autowired" in code and "private final" not in code:
                result["suggestions"].append("Field injection detected. Use constructor injection instead for immutability.")
            result["framework_recommendations"].append({
                "name": "Spring Boot",
                "reason": "Provides robust support for REST APIs, dependency injection, and modular development."
            })
        if "System.out.println" in code:
            result["suggestions"].append("Replace 'System.out.println' with a logging framework such as SLF4J or Logback.")
        if "catch (Exception e)" in code:
            result["suggestions"].append("Avoid catching generic exceptions. Handle specific exceptions for clarity.")

    def _analyze_python(self, code, result):
        if "def " in code:
            result["best_practices"].append("Functions defined clearly. Ensure PEP8 naming conventions are followed.")
        if "import flask" in code or "from flask" in code:
            result["framework_recommendations"].append({
                "name": "Flask",
                "reason": "Lightweight and flexible framework for Python web APIs."
            })
        if "import django" in code:
            result["framework_recommendations"].append({
                "name": "Django",
                "reason": "Full-stack Python framework suitable for scalable web applications."
            })
        if "try:" in code and "except Exception" in code:
            result["suggestions"].append("Avoid catching base 'Exception'. Catch specific error types instead.")
        if "print(" in code:
            result["suggestions"].append("Use 'logging' module instead of print() for production-grade debugging.")
        if '"""' not in code:
            result["suggestions"].append("Add docstrings to describe function purpose and parameters.")

    def _analyze_js_ts(self, code, result):
        # Always-on guidance for JS/TS files
        result["best_practices"].append("Prefer const/let over var to avoid hoisting and scope bugs.")
        result["best_practices"].append("Enable strict typing (TypeScript: \"strict\": true) for safer code.")
        result["best_practices"].append("Use ESLint/Prettier to enforce consistent style and catch issues early.")

        # Framework hints
        if "import React" in code:
            result["framework_recommendations"].append({
                "name": "React",
                "reason": "Ideal for building interactive front-end interfaces."
            })
        if re.search(r"import\s+{[^}]*Component[^}]*}\s+from\s+['\"]@angular/core['\"]", code):
            result["framework_recommendations"].append({
                "name": "Angular",
                "reason": "Recommended for structured TypeScript front-ends."
            })
        if "express" in code or re.search(r"from\s+['\"]express['\"]", code):
            result["framework_recommendations"].append({
                "name": "Express.js",
                "reason": "De facto standard for backend APIs in Node.js."
            })

        # Code structure hints
        if "export " in code:
            result["best_practices"].append("Proper module export detected — promotes clean architecture.")
        if re.search(r"\bclass\s+\w+", code):
            result["best_practices"].append("Classes detected — consider interfaces for contracts and DI where useful.")
        if re.search(r"\basync\b", code):
            result["best_practices"].append("Async/await detected — ensure proper error handling with try/catch.")
        if "console.log" in code:
            result["suggestions"].append("Replace console.log with structured logging (e.g., Winston or Pino).")

        # Smells and pitfalls
        fn_count = len(re.findall(r"\bfunction\b|\b=>\s*\(", code))
        if fn_count > 10:
            result["suggestions"].append("Many functions in one file — consider splitting into modules.")
        if re.search(r"\bawait\b", code) and not re.search(r"\basync\b\s+(function|\()", code):
            result["suggestions"].append("Detected 'await' outside async scope — wrap in async function.")
        if re.search(r"\bvar\b", code):
            result["suggestions"].append("Avoid 'var'; use 'let' or 'const' to prevent scope/hoisting issues.")
        if re.search(r"\bany\b", code):
            result["suggestions"].append("Avoid 'any' in TypeScript; use precise types or generics.")

        # Additional actionable suggestions for small snippets
        lines = code.splitlines()
        long_lines = [i+1 for i, l in enumerate(lines) if len(l) > 120]
        if long_lines:
            result["suggestions"].append(f"Lines too long (>120 chars) at: {long_lines}. Consider wrapping for readability.")
        if re.search(r"[^;{}\s]\s*$", code, re.MULTILINE) and "typescript" in result.get("predicted_language", "typescript"):
            result["suggestions"].append("Ensure consistent semicolons if your code style requires them.")
        if re.search(r"import\s+[\w{},\s*]+\s+from\s+['\"][^'\"]+['\"];?\s*(?:\n(?!export|const|let|var).*)*$", code, re.MULTILINE):
            result["suggestions"].append("Check for unused imports; remove to keep modules lean.")
        if re.search(r"[A-Za-z_]\w*\s*=\s*['\"][^'\"]{15,}['\"]", code):
            result["suggestions"].append("Avoid hard-coded strings; extract to constants or config.")
        if re.search(r"\b\d{3,}\b", code):
            result["suggestions"].append("Magic numbers detected; replace with named constants for clarity.")
        if re.search(r"\btry\s*{", code) and not re.search(r"\bcatch\s*\(", code):
            result["suggestions"].append("try block without catch/finally — ensure errors are handled.")
        if re.search(r"\bfetch\s*\(", code) and not re.search(r"\.catch\s*\(", code) and "async" not in code:
            result["suggestions"].append("Network call without error handling — add try/catch or .catch().")

        # Baseline advice if suggestions are empty
        if not result["suggestions"]:
            result["suggestions"].append("Add module-level docs (TSDoc) and basic error handling to improve maintainability.")

    def _analyze_csharp(self, code, result):
        if "namespace" in code:
            result["best_practices"].append("Code is well-structured within namespaces.")
        if "[HttpGet]" in code:
            result["framework_recommendations"].append({
                "name": "ASP.NET Core",
                "reason": "Modern framework for RESTful APIs and MVC architecture."
            })
        if "Console.WriteLine" in code:
            result["suggestions"].append("Use ILogger for structured logging instead of Console.WriteLine.")
        if "try" in code and "catch (Exception)" in code:
            result["suggestions"].append("Avoid catching generic Exception. Handle specific exceptions instead.")

    def _analyze_web(self, code, result):
        if "<html" in code:
            result["best_practices"].append("HTML structure detected — ensure semantic tags are used correctly.")
        if "<script" in code:
            result["suggestions"].append("Move inline scripts to external JS files for better maintainability.")
        if "style=" in code:
            result["suggestions"].append("Avoid inline styles; use CSS classes for separation of concerns.")
        if "display:flex" in code or "grid" in code:
            result["best_practices"].append("Modern layout practices (Flexbox/Grid) detected — well done.")
        if "bootstrap" in code:
            result["framework_recommendations"].append({
                "name": "Bootstrap",
                "reason": "Popular front-end framework for responsive UI design."
            })


if __name__ == "__main__":
    agent = CodeAnalysisAgent()

    if agent.model:
        # Path to the file you want to analyze
        file_to_analyze = os.path.join("..", "src", "main", "java", "smartshop", "smartshop", "controller", "test.ts")

        try:
            print(f"Reading file: {file_to_analyze}")
            with open(file_to_analyze, 'r', encoding='utf-8') as f:
                code_to_analyze = f.read()

            analysis = agent.analyze_code(code_to_analyze)
            print("\n--- Analysis Result ---")
            print(json.dumps(analysis, indent=2))

        except FileNotFoundError:
            print(f"ERROR: The file was not found at the specified path: {file_to_analyze}")
        except Exception as e:
            print(f"An error occurred: {e}")