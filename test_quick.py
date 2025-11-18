#!/usr/bin/env python3
from llama_cpp import Llama
print('Loading TinyLlama...')
llm = Llama('models/tinyllama.gguf', n_ctx=512, verbose=False)
print('\n✅ Model loaded!\n')
print('Prompt: Tell me a fact about space')
result = llm('Tell me a fact about space', max_tokens=50, echo=False)
print('Response:', result['choices'][0]['text'].strip())
print('\n✅ Model is working on your computer!')
