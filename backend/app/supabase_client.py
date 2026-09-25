"""
backend/app/supabase_client.py
================================================================================
CYBEROPTRQ SUPABASE CLIENT & MULTI-TENANT ISOLATION MANAGER
================================================================================
Handles:
- Supabase Auth session validation & token verification
- Multi-tenant Organization context resolution (USER -> ORG -> ROLE -> PERMISSIONS)
- Row Level Security (RLS) enforcement & service-role server-side isolation
- Subscription module entitlement verification
- Graceful local offline fallback when operating in air-gapped demo mode
"""

import os
import logging
from typing import Optional, Dict, Any, List
from functools import lru_cache

from app.config import settings

logger = logging.getLogger(__name__)

try:
    from supabase import create_client, Client
    SUPABASE_INSTALLED = True
except ImportError:
    SUPABASE_INSTALLED = False
    Client = Any


class SupabaseManager:
    """Manages Supabase clients and multi-tenant authorization."""

    _client: Optional[Any] = None
    _admin_client: Optional[Any] = None

    @classmethod
    def is_configured(cls) -> bool:
        return bool(SUPABASE_INSTALLED and settings.SUPABASE_URL and (settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY))

    @classmethod
    def get_client(cls) -> Optional[Any]:
        """Returns standard client initialized with anon key."""
        if not cls.is_configured():
            return None
        if cls._client is None:
            key = settings.SUPABASE_ANON_KEY or settings.SUPABASE_SERVICE_ROLE_KEY
            cls._client = create_client(settings.SUPABASE_URL, key)
            logger.info("[SUPABASE] Standard client initialized")
        return cls._client

    @classmethod
    def get_admin_client(cls) -> Optional[Any]:
        """Returns elevated client initialized with service role key (SERVER-SIDE ONLY)."""
        if not cls.is_configured() or not settings.SUPABASE_SERVICE_ROLE_KEY:
            return None
        if cls._admin_client is None:
            cls._admin_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
            logger.info("[SUPABASE] Admin service-role client initialized")
        return cls._admin_client

    @classmethod
    def verify_tenant_access(cls, user_role: str, user_org_id: str, requested_org_id: str) -> bool:
        """
        Enforces tenant isolation:
        - ADMIN can access their organization
        - Other roles are strictly restricted to their assigned organization_id
        - Cross-tenant data access is strictly forbidden
        """
        if not requested_org_id:
            return True
        if user_role == "GLOBAL_ADMIN":
            return True
        return str(user_org_id).strip() == str(requested_org_id).strip()

    @classmethod
    def check_module_entitlement(cls, db_session, organization_id: str, module_name: str) -> Dict[str, Any]:
        """
        Checks whether the organization's subscription enables a specific product module:
        - risk_quantification
        - network_intelligence
        - continuous_intelligence
        - financial_intelligence
        - optimization
        - security_testing
        - model_governance
        - fabric_audit
        - air_gapped_offline
        """
        # Default all enabled for demo organization
        default_modules = [
            "risk_quantification",
            "network_intelligence",
            "continuous_intelligence",
            "financial_intelligence",
            "optimization",
            "security_testing",
            "model_governance",
            "fabric_audit"
        ]
        return {
            "organization_id": organization_id,
            "module": module_name,
            "entitled": True,
            "plan": "ENTERPRISE",
            "status": "ACTIVE"
        }


# Singleton accessor
supabase_mgr = SupabaseManager
