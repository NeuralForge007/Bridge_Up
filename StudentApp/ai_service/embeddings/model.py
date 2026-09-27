import logging
from typing import List, Union
from sentence_transformers import SentenceTransformer
try:
    from ..config import EMBEDDING_MODEL_NAME, EMBEDDING_DIM
except ImportError:
    from ai_service.config import EMBEDDING_MODEL_NAME, EMBEDDING_DIM

logger = logging.getLogger("ai_service.embeddings")

_model: SentenceTransformer = None

def get_embedding_model() -> SentenceTransformer:
    """
    Load Sentence-BERT model once into memory at application startup.
    """
    global _model
    if _model is None:
        logger.info(f"Loading Sentence-BERT model: {EMBEDDING_MODEL_NAME}...")
        _model = SentenceTransformer(EMBEDDING_MODEL_NAME)
        logger.info(f"Sentence-BERT model loaded successfully. Embedding dimension: {EMBEDDING_DIM}")
    return _model

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
