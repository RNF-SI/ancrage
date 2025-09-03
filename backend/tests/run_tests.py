#!/usr/bin/env python3
"""
Script pour exécuter tous les tests unitaires
Usage: python run_tests.py
"""

import subprocess
import sys
import os

def run_tests():
    """Exécute tous les tests unitaires"""
    
    # Ajouter le répertoire backend au PYTHONPATH
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sys.path.insert(0, backend_dir)
    
    # Commandes de test
    test_commands = [

        # Tests complets
        ["python3", "-m", "pytest", "tests/test_routes_complete.py", "-v"],
        
        # Tests utilitaires
        ["python3", "-m", "pytest", "tests/test_utilities.py", "-v"],
        
        # Tests de configuration
        ["python3", "-m", "pytest", "tests/test_config.py", "-v"],
        
        # Tous les tests avec couverture
        ["python3", "-m", "pytest", "tests/", "--cov=models", "--cov=routes", "--cov=schemas", "-v"]
    ]
    
    print("🧪 Exécution des tests unitaires Flask...")
    print("=" * 50)
    
    for i, cmd in enumerate(test_commands, 1):
        print(f"\n�� Test {i}/{len(test_commands)}: {' '.join(cmd[3:])}")
        print("-" * 30)
        
        try:
            result = subprocess.run(cmd, cwd=backend_dir, capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ Tests réussis")
                if result.stdout:
                    print(result.stdout)
            else:
                print("❌ Tests échoués")
                if result.stderr:
                    print("Erreurs:", result.stderr)
                if result.stdout:
                    print("Sortie:", result.stdout)
                    
        except Exception as e:
            print(f"❌ Erreur lors de l'exécution: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Exécution des tests terminée")

if __name__ == "__main__":
    run_tests() 