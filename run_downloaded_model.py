#!/usr/bin/env python3
"""
Quick script to run downloaded GGUF models from InSystem Hub
Usage: python3 run_downloaded_model.py <path-to-gguf-file>
"""

import sys
from llama_cpp import Llama

def run_model(model_path):
    print(f"Loading model from: {model_path}")
    print("This may take a few seconds...\n")
    
    # Load the model
    llm = Llama(
        model_path=model_path,
        n_ctx=2048,
        n_threads=8,
        verbose=False
    )
    
    print("✅ Model loaded successfully!")
    print("\nEnter your prompts (type 'exit' to quit):\n")
    
    while True:
        # Get user input
        prompt = input("You: ").strip()
        
        if prompt.lower() in ['exit', 'quit', 'q']:
            print("\nGoodbye!")
            break
        
        if not prompt:
            continue
        
        # Generate response
        print("AI: ", end="", flush=True)
        response = llm(
            prompt,
            max_tokens=150,
            temperature=0.7,
            stop=["You:", "\n\n"],
            echo=False
        )
        
        text = response['choices'][0]['text'].strip()
        print(text)
        print()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 run_downloaded_model.py <path-to-gguf-file>")
        print("\nExample:")
        print("  python3 run_downloaded_model.py ~/Downloads/tinyllama.gguf")
        sys.exit(1)
    
    model_path = sys.argv[1]
    
    try:
        run_model(model_path)
    except FileNotFoundError:
        print(f"❌ Error: File not found: {model_path}")
        print("\nMake sure you've downloaded the .gguf file first!")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
