"""
backend/app/threat_intelligence/parser.py
Parsers for RSS, Atom XML, JSON feeds, and text advisories.
Strictly offline-capable and standard library compliant.
"""

import json
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional
from datetime import datetime

class ThreatFeedParser:
    """
    Parses disparate raw threat feed formats into normalized raw item dictionaries.
    """

    @staticmethod
    def parse_rss_xml(xml_content: str, source_name: str = "RSS Feed") -> List[Dict[str, Any]]:
        """
        Parses RSS 2.0 or Atom XML content into raw item dictionaries.
        """
        items = []
        try:
            root = ET.fromstring(xml_content)
        except Exception as e:
            return []

        # Check RSS 2.0 (<rss><channel><item>)
        channel = root.find("channel")
        if channel is not None:
            for item in channel.findall("item"):
                title = item.findtext("title", "").strip()
                link = item.findtext("link", "").strip()
                description = item.findtext("description", "").strip()
                pub_date = item.findtext("pubDate", "") or item.findtext("dc:date", "")
                
                items.append({
                    "title": title,
                    "url": link,
                    "description": description,
                    "published_at": pub_date.strip() if pub_date else datetime.utcnow().isoformat() + "Z",
                    "source": source_name,
                    "raw_content": f"{title}\n{description}"
                })
            return items

        # Check Atom (<feed><entry>)
        # Handle possible XML namespaces
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        entries = root.findall("atom:entry", ns) or root.findall("entry")
        for entry in entries:
            title_elem = entry.find("atom:title", ns) if "atom" in ns else None
            title = (title_elem.text if title_elem is not None else entry.findtext("title", "")).strip()
            
            link_elem = entry.find("atom:link", ns) or entry.find("link")
            link = link_elem.attrib.get("href", "") if link_elem is not None else ""
            
            summary_elem = entry.find("atom:summary", ns) or entry.find("summary") or entry.find("atom:content", ns) or entry.find("content")
            desc = summary_elem.text.strip() if summary_elem is not None and summary_elem.text else ""
            
            pub_elem = entry.find("atom:published", ns) or entry.find("published") or entry.find("atom:updated", ns) or entry.find("updated")
            pub_date = pub_elem.text.strip() if pub_elem is not None and pub_elem.text else datetime.utcnow().isoformat() + "Z"

            items.append({
                "title": title,
                "url": link,
                "description": desc,
                "published_at": pub_date,
                "source": source_name,
                "raw_content": f"{title}\n{desc}"
            })

        return items

    @staticmethod
    def parse_json_feed(json_str_or_dict: Any, source_name: str = "JSON Feed") -> List[Dict[str, Any]]:
        """
        Parses structured JSON feed or array of threat events.
        """
        if isinstance(json_str_or_dict, str):
            try:
                data = json.loads(json_str_or_dict)
            except Exception:
                return []
        else:
            data = json_str_or_dict

        items = []
        if isinstance(data, dict):
            # Check if wrapped in "events" or "vulnerabilities" or "items"
            raw_list = data.get("events") or data.get("vulnerabilities") or data.get("items") or [data]
        elif isinstance(data, list):
            raw_list = data
        else:
            return []

        for entry in raw_list:
            if not isinstance(entry, dict):
                continue
            title = entry.get("title") or entry.get("name") or entry.get("cve_id") or "Security Event"
            url = entry.get("source_url") or entry.get("url") or ""
            desc = entry.get("description") or entry.get("summary") or ""
            pub_date = entry.get("published_at") or entry.get("timestamp") or entry.get("date") or datetime.utcnow().isoformat() + "Z"
            cve = entry.get("reference_cve") or entry.get("cve_id") or entry.get("cve")
            product = entry.get("affected_technology") or entry.get("affected_products") or entry.get("product")
            attack_type = entry.get("event_type") or entry.get("attack_type") or entry.get("threat_status")

            event_id = entry.get("event_id") or entry.get("id")
            items.append({
                "title": str(title),
                "url": str(url),
                "description": str(desc),
                "published_at": str(pub_date),
                "source": entry.get("source") or source_name,
                "cve": str(cve) if cve else None,
                "event_id": str(event_id) if event_id else None,
                "affected_product": str(product) if product else None,
                "attack_type": str(attack_type) if attack_type else None,
                "raw_content": f"{title}\n{desc}"
            })
        return items

    @staticmethod
    def parse_text_advisory(text: str, source_name: str = "Manual Text Advisory") -> List[Dict[str, Any]]:
        """
        Parses unstructured text advisory or bulletin into a single raw threat item.
        """
        lines = [line.strip() for line in text.strip().split("\n") if line.strip()]
        title = lines[0] if lines else "Manual Security Advisory"
        desc = "\n".join(lines[1:]) if len(lines) > 1 else title

        return [{
            "title": title[:200],
            "url": "local://manual_input",
            "description": desc,
            "published_at": datetime.utcnow().isoformat() + "Z",
            "source": source_name,
            "raw_content": text
        }]
