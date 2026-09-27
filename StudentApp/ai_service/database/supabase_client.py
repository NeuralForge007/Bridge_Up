import logging
from supabase import create_client, Client
from ..config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

logger = logging.getLogger("ai_service.supabase")

_client: Client = None

def get_supabase_client() -> Client:
    """
    Get or create singleton Supabase client using Service Role Key.
    """
    global _client
    if _client is None:
        try:
            logger.info(f"Connecting to Supabase at: {SUPABASE_URL}")
            _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
            logger.info("Supabase client initialized.")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise
    return _client
