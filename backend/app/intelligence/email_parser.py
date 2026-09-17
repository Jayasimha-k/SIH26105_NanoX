"""
backend/app/intelligence/email_parser.py
RFC 822 compliant email parser.
Processes both live mail streams (IMAP, Gmail, Outlook Graph) and offline .eml demo files identically.
"""

import email
from email import policy
import re
from typing import Dict, Any, List, Optional
import html


class EmailParser:
    """
    Standard RFC 822 Email Parser.
    Extracts headers, body text, links, and metadata without separate fake logic paths.
    """

    @classmethod
    def parse_eml_file(cls, filepath: str) -> Dict[str, Any]:
        """Parses a local .eml file."""
        with open(filepath, "rb") as f:
            raw_bytes = f.read()
        return cls.parse_raw_email(raw_bytes, source_filepath=filepath)

    @classmethod
    def parse_raw_email(cls, raw_bytes: bytes, source_filepath: Optional[str] = None) -> Dict[str, Any]:
        """Parses raw email bytes into structured metadata and content."""
        # Parse with compat32 for literal header preservation and default for MIME body
        msg_compat = email.message_from_bytes(raw_bytes, policy=policy.compat32)
        msg = email.message_from_bytes(raw_bytes, policy=policy.default)

        # Extract headers accurately
        sender = str(msg_compat.get("From", "Unknown Sender")).strip()
        recipient = str(msg_compat.get("To", "Unknown Recipient")).strip()
        subject = str(msg_compat.get("Subject", "(No Subject)")).strip()
        date_str = str(msg_compat.get("Date", "")).strip()
        message_id = str(msg_compat.get("Message-ID", "")).strip()

        if not message_id:
            import uuid
            message_id = f"gen-{uuid.uuid4().hex[:12]}@cyberoptrq.local"

        body_text = ""
        body_html = ""
        attachments = []

        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get_content_disposition())

                if "attachment" in content_disposition:
                    filename = part.get_filename()
                    if filename:
                        attachments.append({
                            "filename": filename,
                            "content_type": content_type,
                            "size": len(part.get_payload(decode=True) or b"")
                        })
                    continue

                if content_type == "text/plain":
                    try:
                        payload = part.get_content()
                        if isinstance(payload, str):
                            body_text += payload + "\n"
                    except Exception:
                        pass
                elif content_type == "text/html":
                    try:
                        payload = part.get_content()
                        if isinstance(payload, str):
                            body_html += payload + "\n"
                    except Exception:
                        pass
        else:
            payload = msg.get_content()
            if isinstance(payload, str):
                if msg.get_content_type() == "text/html":
                    body_html = payload
                else:
                    body_text = payload

        # Fallback: if only HTML is available, strip tags to populate text
        if not body_text.strip() and body_html.strip():
            clean = re.sub(r'<[^>]+>', ' ', body_html)
            body_text = html.unescape(clean)

        # Extract hyperlinks
        link_regex = r'https?://[^\s<>"]+|www\.[^\s<>"]+'
        links = list(set(re.findall(link_regex, body_text + " " + body_html)))

        return {
            "message_id": message_id,
            "sender": sender,
            "recipient": recipient,
            "subject": subject,
            "date": date_str,
            "body_text": body_text.strip(),
            "body_html": body_html.strip(),
            "links": links,
            "attachments": attachments,
            "raw_path": source_filepath,
            "char_count": len(body_text.strip())
        }
