"""
backend/app/intelligence/email_fetcher.py
Orchestrates scheduled and on-demand synchronization of connected mailboxes.
Deduplicates messages and stores raw message records.
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.db_models import EmailConnectionRecord, EmailMessageRecord
from app.intelligence.email_connector import EmailConnectorFactory
from app.intelligence.deduplicator import EmailDeduplicator

logger = logging.getLogger(__name__)


class EmailFetcher:
    """
    Manages email polling, deduplication, and persistence of raw email messages.
    """

    @classmethod
    def sync_connection(cls, db: Session, connection_id: str) -> Dict[str, Any]:
        """
        Polls a specific email connection for new messages.
        """
        conn_rec = db.query(EmailConnectionRecord).filter(EmailConnectionRecord.connection_id == connection_id).first()
        if not conn_rec:
            return {"status": "ERROR", "message": f"Connection '{connection_id}' not found."}

        connector = EmailConnectorFactory.get_connector(
            provider=conn_rec.provider,
            connection_id=conn_rec.connection_id,
            organization_id=conn_rec.organization_id,
            email_address=conn_rec.email_address,
            folder_label=conn_rec.folder_label
        )

        health = connector.check_connection()
        if health.get("status") == "ERROR":
            conn_rec.status = "ERROR"
            conn_rec.error_message = health.get("message", "Connection failed")
            db.commit()
            return {"status": "ERROR", "message": conn_rec.error_message}

        raw_messages = connector.fetch_new_messages(db)
        new_count = 0
        duplicate_count = 0
        ingested_messages = []

        for msg in raw_messages:
            content_hash = msg.get("content_hash") or EmailDeduplicator.compute_content_hash(
                sender=msg["sender"],
                subject=msg["subject"],
                body_text=msg["body_text"]
            )

            # Check duplication
            if EmailDeduplicator.is_duplicate(db, content_hash):
                duplicate_count += 1
                continue

            msg_rec = EmailMessageRecord(
                message_id=msg["message_id"],
                connection_id=conn_rec.connection_id,
                organization_id=conn_rec.organization_id,
                source_id="detected",
                sender=msg["sender"],
                recipient=msg["recipient"],
                subject=msg["subject"],
                date_str=msg.get("date", ""),
                content_hash=content_hash,
                raw_path=msg.get("raw_path"),
                body_text=msg["body_text"],
                status="RECEIVED"
            )
            db.add(msg_rec)
            db.commit()

            new_count += 1
            ingested_messages.append(msg)

        conn_rec.status = "CONNECTED"
        conn_rec.last_sync = datetime.utcnow()
        conn_rec.processed_count += new_count
        conn_rec.error_message = None
        db.commit()

        return {
            "status": "SYNCED",
            "connection_id": connection_id,
            "provider": conn_rec.provider,
            "new_emails": new_count,
            "duplicate_emails": duplicate_count,
            "total_processed": conn_rec.processed_count,
            "ingested_messages": ingested_messages
        }

    @classmethod
    def sync_all_active_connections(cls, db: Session, organization_id: Optional[str] = None) -> Dict[str, Any]:
        """Polls all active connections across organizations."""
        q = db.query(EmailConnectionRecord).filter(EmailConnectionRecord.status != "DISCONNECTED")
        if organization_id:
            q = q.filter(EmailConnectionRecord.organization_id == organization_id)
        connections = q.all()

        total_new = 0
        results = []
        for c in connections:
            res = cls.sync_connection(db, c.connection_id)
            total_new += res.get("new_emails", 0)
            results.append(res)

        return {
            "connections_polled": len(connections),
            "total_new_emails": total_new,
            "details": results
        }
