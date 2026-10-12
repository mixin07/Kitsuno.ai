from __future__ import annotations

import json
import logging
import time
import urllib.request
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwk, jwt

from app.config import settings

logger = logging.getLogger(__name__)

# In-memory JWKS cache
_jwks_cache: dict[str, Any] = {"keys": {}, "expires_at": 0}
JWKS_CACHE_TTL = 3600  # 1 hour


def _fetch_jwks() -> dict[str, Any]:
    global _jwks_cache
    now = time.time()
    if _jwks_cache["keys"] and now < _jwks_cache["expires_at"]:
        return _jwks_cache["keys"]

    jwks_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
    try:
        req = urllib.request.Request(
            jwks_url,
            headers={"User-Agent": "Kitsuno-FastAPI/1.0"},
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            keys_dict = {}
            for k in data.get("keys", []):
                kid = k.get("kid")
                if kid:
                    keys_dict[kid] = jwk.construct(k)
            _jwks_cache = {"keys": keys_dict, "expires_at": now + JWKS_CACHE_TTL}
            return keys_dict
    except Exception as exc:
        logger.warning(f"Could not fetch Supabase JWKS from {jwks_url}: {exc}")
        return _jwks_cache.get("keys", {})


def verify_supabase_token(token: str) -> dict[str, Any] | None:
    """
    Verifies a Supabase JWT token.
    Validates signature, issuer, expiration, and claims.
    Supports ES256 via Supabase JWKS and HS256 via secret.
    Returns verified claims dictionary, or None if invalid.
    """
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError:
        return None

    alg = unverified_header.get("alg", "ES256")
    expected_issuer = f"{settings.supabase_url.rstrip('/')}/auth/v1"

    # ES256 verification via JWKS (Default for modern Supabase projects)
    if alg == "ES256":
        kid = unverified_header.get("kid")
        keys = _fetch_jwks()
        key = keys.get(kid) if kid else None

        # If key not found in cache, force refresh once
        if not key:
            _jwks_cache["expires_at"] = 0
            keys = _fetch_jwks()
            key = keys.get(kid) if kid else None

        if not key:
            logger.warning(f"No matching public key for kid '{kid}'")
            return None

        try:
            payload = jwt.decode(
                token,
                key=key,
                algorithms=["ES256"],
                issuer=expected_issuer,
                audience="authenticated",
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_iss": True,
                    "verify_aud": True,
                    "verify_sub": True,
                },
            )
            return payload
        except JWTError as exc:
            logger.debug(f"ES256 token verification failed: {exc}")
            return None

    # HS256 verification (Fallback for Supabase projects configured with HS256 / test tokens)
    elif alg == "HS256":
        secret = settings.supabase_jwt_secret or settings.jwt_secret_key
        try:
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_aud": False,
                    "verify_iss": False,
                },
            )
            return payload
        except JWTError as exc:
            logger.debug(f"HS256 token verification failed: {exc}")
            return None

    return None


def decode_access_token(token: str) -> str | None:
    """
    Legacy helper: returns user identity string if token is valid.
    First tries Supabase verification, then falls back to legacy HS256 for backward compatibility.
    """
    payload = verify_supabase_token(token)
    if payload:
        return str(payload.get("sub"))

    # Backward compatibility with existing local test tokens
    try:
        legacy_payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        sub = legacy_payload.get("sub")
        return str(sub) if sub is not None else None
    except JWTError:
        return None


def create_access_token(
    subject: str,
    expires_delta: timedelta | None = None,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """
    Helper for generating HS256 tokens (useful for testing or fallback).
    """
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload = {
        "sub": str(subject),
        "exp": expire,
        "aud": "authenticated",
        "iss": f"{settings.supabase_url.rstrip('/')}/auth/v1",
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.jwt_secret_key, algorithm="HS256")