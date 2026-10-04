import logging
from typing import List, Union
from sentence_transformers import SentenceTransformer
try:
    from ..config import EMBEDDING_MODEL_NAME, EMBEDDING_DIM
except ImportError:
    from ai_service.config import EMBEDDING_MODEL_NAME, EMBEDDING_DIM

logger = logging.getLogger("ai_service.embeddings")

_model: SentenceTransformer = None
_model_load_error: str = None

def get_embedding_model() -> SentenceTransformer:
    """
    Load Sentence-BERT model once into memory at application startup.
    """
    global _model, _model_load_error
    if _model is None:
        try:
            logger.info(f"Loading Sentence-BERT model: {EMBEDDING_MODEL_NAME}...")
            _model = SentenceTransformer(EMBEDDING_MODEL_NAME)
            # Warm-up run
            warmup_res = _model.encode(["BridgeUp AI mentor recommendation service"], normalize_embeddings=True)
            if hasattr(warmup_res, 'shape') and warmup_res.shape[-1] == EMBEDDING_DIM:
                logger.info(f"Sentence-BERT model loaded & warm-up verified successfully. Dimension: {EMBEDDING_DIM}")
            else:
                logger.info(f"Sentence-BERT model loaded successfully. Dimension: {EMBEDDING_DIM}")
            _model_load_error = None
        except Exception as e:
            logger.error(f"Failed to load Sentence-BERT model: {e}", exc_info=True)
            _model_load_error = str(e)
            _model = None
            raise
    return _model

def is_model_ready() -> bool:
    """Check whether the embedding model is loaded in memory and operational."""
    global _model
    return _model is not None

def get_model_error() -> Union[str, None]:
    """Get the error message if model loading failed."""
    return _model_load_error

def encode_text(text: Union[str, List[str]], normalize: bool = True) -> Union[List[float], List[List[float]]]:
    """
    Encode text or list of texts into 384-dimensional normalized vector(s).
    """
    model = get_embedding_model()
    embeddings = model.encode(
        text,
        normalize_embeddings=normalize,
        show_progress_bar=False
    )
    if isinstance(text, str):
        return embeddings.tolist()
    return [e.tolist() for e in embeddings]
