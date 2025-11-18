"""
InSystem Compute Engine
Main inference engine interface
"""

import ctypes
import os
from typing import Optional
from pathlib import Path

from .types import Device
from .model import Model, ModelConfig

__version__ = "1.0.0"


class EngineConfig:
    """Configuration for inference engine"""
    
    def __init__(
        self,
        device: Device = Device.AUTO,
        threads: int = 8,
        memory_limit: int = 4 * 1024 * 1024 * 1024,  # 4GB
        enable_cache: bool = True,
        cache_size: int = 2048,
    ):
        self.device = device
        self.threads = threads
        self.memory_limit = memory_limit
        self.enable_cache = enable_cache
        self.cache_size = cache_size


class Engine:
    """Main inference engine for on-device LLM deployment"""
    
    def __init__(self, config: Optional[EngineConfig] = None):
        """
        Initialize inference engine
        
        Args:
            config: Engine configuration (uses defaults if None)
        """
        if config is None:
            config = EngineConfig()
        
        self.config = config
        self._lib = self._load_library()
        self._handle = self._create_engine()
    
    def _load_library(self) -> ctypes.CDLL:
        """Load native library"""
        lib_names = {
            "linux": "libinsystem_compute_core.so",
            "darwin": "libinsystem_compute_core.dylib",
            "win32": "insystem_compute_core.dll",
        }
        
        import sys
        lib_name = lib_names.get(sys.platform, "libinsystem_compute_core.so")
        
        # Search for library
        search_paths = [
            Path(__file__).parent / "lib",
            Path.cwd() / "target" / "release",
            Path.cwd() / "core" / "target" / "release",
            Path(__file__).parent.parent.parent.parent / "core" / "target" / "release",
            Path("/usr/local/lib"),
            Path("/usr/lib"),
        ]
        
        for path in search_paths:
            lib_path = path / lib_name
            if lib_path.exists():
                return ctypes.CDLL(str(lib_path))
        
        raise RuntimeError(f"Could not find {lib_name}")
    
    def _create_engine(self):
        """Create engine handle"""
        # Setup FFI function signatures
        self._lib.insystem_engine_new_with_config.argtypes = [
            ctypes.c_char_p,  # device
            ctypes.c_int,     # threads
            ctypes.c_size_t,  # memory_limit
        ]
        self._lib.insystem_engine_new_with_config.restype = ctypes.c_void_p
        
        device_str = self.config.device.value.encode('utf-8')
        handle = self._lib.insystem_engine_new_with_config(
            device_str,
            self.config.threads,
            self.config.memory_limit,
        )
        
        if not handle:
            raise RuntimeError("Failed to create engine")
        
        return handle
    
    def load_model(
        self,
        path: str,
        config: Optional[ModelConfig] = None,
    ) -> Model:
        """
        Load a model from file
        
        Args:
            path: Path to model file
            config: Model configuration
            
        Returns:
            Loaded model instance
        """
        if config is None:
            config = ModelConfig()
        
        return Model(self, path, config)
    
    def analyze_image(
        self,
        model_path: str,
        image_path: str,
        prompt: str = "What's in this image?",
        max_tokens: int = 150,
    ) -> str:
        """
        Analyze image using vision model (LLaVA)
        
        Args:
            model_path: Path to vision model file (e.g., llava-v1.6-7b.Q4_K_M.gguf)
            image_path: Path to image file
            prompt: Question or instruction about the image
            max_tokens: Maximum tokens to generate
            
        Returns:
            Vision model's response
        """
        try:
            from llama_cpp import Llama
            from llama_cpp.llama_chat_format import Llava15ChatHandler
            import base64
        except ImportError:
            raise RuntimeError("Vision support requires: pip install llama-cpp-python")
        
        # Load image as base64 data URI
        with open(image_path, 'rb') as f:
            image_data = f.read()
        b64_image = base64.b64encode(image_data).decode('utf-8')
        data_uri = f"data:image/jpeg;base64,{b64_image}"
        
        # Load vision model with chat handler
        chat_handler = Llava15ChatHandler(
            clip_model_path=str(Path(model_path).parent / "mmproj-model-f16.gguf"),
            verbose=False
        )
        
        llm = Llama(
            model_path=model_path,
            chat_handler=chat_handler,
            n_ctx=2048,
            n_threads=self.config.threads,
            verbose=False,
        )
        
        # Analyze image
        result = llm.create_chat_completion(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": data_uri}}
                    ]
                }
            ],
            max_tokens=max_tokens
        )
        
        return result['choices'][0]['message']['content']
    
    @staticmethod
    def version() -> str:
        """Get the engine version.
        
        Returns:
            Version string
        """
        return "1.0.0"
    
    def __del__(self):
        """Cleanup engine resources"""
        if hasattr(self, '_handle') and self._handle:
            self._lib.insystem_engine_free(self._handle)
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.__del__()


# Example usage
if __name__ == "__main__":
    # Create engine
    config = EngineConfig(device=Device.AUTO, threads=8)
    engine = Engine(config)
    
    print(f"InSystem Compute v{engine.version()}")
    
    # Load model
    model_config = ModelConfig(
        format="gguf",
        quantization=4,
        max_seq_len=2048,
    )
    
    model = engine.load_model("models/llama-3b-q4.gguf", model_config)
    
    # Generate text
    response = model.generate("Hello, world!", max_tokens=100)
    print(response)
