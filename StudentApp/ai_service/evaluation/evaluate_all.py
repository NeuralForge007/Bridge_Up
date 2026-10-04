import sys
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR.parent) not in sys.path:
    sys.path.insert(0, str(BASE_DIR.parent))

from ai_service.evaluation.evaluate import run_evaluation as evaluate_mentors
from ai_service.evaluation.evaluate_teammates import evaluate_teammates

def main():
    print("==========================================================================")
    print("🚀 BRIDGEUP FULL AI EVALUATION SUITE: ALUMNI MENTOR & TEAMMATE MATCHERS")
    print("==========================================================================")
    
    print("\n--- PART 1: ALUMNI MENTOR MATCHER BENCHMARK ---")
    evaluate_mentors()
    
    print("\n--- PART 2: HACKATHON TEAMMATE RECOMMENDER BENCHMARK ---")
    evaluate_teammates()
    
    print("\n✅ All AI Evaluation suites executed successfully with empirical metrics.")

if __name__ == "__main__":
    main()
