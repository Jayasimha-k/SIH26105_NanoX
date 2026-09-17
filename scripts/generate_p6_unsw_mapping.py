"""
scripts/generate_p6_unsw_mapping.py
Feature Harmonization between CIC-IDS2017 (P6 Schema) and UNSW-NB15.
Generates:
  - reports/p6_unsw_feature_mapping.csv
"""

import os
import json
import pandas as pd

def generate_mapping():
    print("======================================================================")
    print("TASK 2: FEATURE HARMONIZATION PIPELINE (CIC-IDS2017 vs UNSW-NB15)")
    print("======================================================================")

    reports_dir = "reports"
    os.makedirs(reports_dir, exist_ok=True)

    # Load 56 P6 behavioral feature schema
    schema_path = os.path.join("models", "p6", "feature_schema.json")
    with open(schema_path, "r") as f:
        p6_schema = json.load(f)
    p6_features = p6_schema["feature_names"]
    print(f"[OK] Loaded {len(p6_features)} P6 target features from schema.")

    # Load UNSW-NB15 features
    unsw_features_meta = pd.read_csv("data/unsw_nb15/NUSW-NB15_features.csv", encoding="cp1252")
    unsw_features_meta.columns = [c.strip() for c in unsw_features_meta.columns]
    unsw_names = unsw_features_meta["Name"].str.strip().tolist()

    mapping_records = []

    # 1. Map all 56 P6 Features against UNSW-NB15
    for p6_feat in p6_features:
        if p6_feat == "Flow Duration":
            mapping_records.append({
                "source_feature": "dur",
                "target_p6_feature": "Flow Duration",
                "mapping_type": "unit_scale (dur * 1e6)",
                "status": "DERIVED_COMPATIBLE",
                "reason": "UNSW 'dur' is in seconds; scaled by 1,000,000 to match CIC microsecond flow duration."
            })
        elif p6_feat == "Total Fwd Packets":
            mapping_records.append({
                "source_feature": "spkts",
                "target_p6_feature": "Total Fwd Packets",
                "mapping_type": "identity",
                "status": "DIRECT_MATCH",
                "reason": "Direct semantic match: source-to-destination packet count."
            })
        elif p6_feat == "Total Backward Packets":
            mapping_records.append({
                "source_feature": "dpkts",
                "target_p6_feature": "Total Backward Packets",
                "mapping_type": "identity",
                "status": "DIRECT_MATCH",
                "reason": "Direct semantic match: destination-to-source packet count."
            })
        elif p6_feat == "Total Length of Fwd Packets":
            mapping_records.append({
                "source_feature": "sbytes",
                "target_p6_feature": "Total Length of Fwd Packets",
                "mapping_type": "identity",
                "status": "DIRECT_MATCH",
                "reason": "Direct semantic match: source-to-destination payload bytes."
            })
        elif p6_feat == "Total Length of Bwd Packets":
            mapping_records.append({
                "source_feature": "dbytes",
                "target_p6_feature": "Total Length of Bwd Packets",
                "mapping_type": "identity",
                "status": "DIRECT_MATCH",
                "reason": "Direct semantic match: destination-to-source payload bytes."
            })
        elif p6_feat == "Fwd Packet Length Mean":
            mapping_records.append({
                "source_feature": "smean",
                "target_p6_feature": "Fwd Packet Length Mean",
                "mapping_type": "identity",
                "status": "DIRECT_MATCH",
                "reason": "Direct semantic match: mean forward packet size."
            })
        elif p6_feat == "Bwd Packet Length Mean":
            mapping_records.append({
                "source_feature": "dmean",
                "target_p6_feature": "Bwd Packet Length Mean",
                "mapping_type": "identity",
                "status": "DIRECT_MATCH",
                "reason": "Direct semantic match: mean backward packet size."
            })
        elif p6_feat == "Flow Bytes/s":
            mapping_records.append({
                "source_feature": "sbytes, dbytes, dur",
                "target_p6_feature": "Flow Bytes/s",
                "mapping_type": "derived ((sbytes + dbytes) / dur)",
                "status": "DERIVED_COMPATIBLE",
                "reason": "Computed aggregate byte throughput: total bytes divided by duration."
            })
        elif p6_feat == "Flow Packets/s":
            mapping_records.append({
                "source_feature": "rate",
                "target_p6_feature": "Flow Packets/s",
                "mapping_type": "identity",
                "status": "DIRECT_MATCH",
                "reason": "Direct match: UNSW 'rate' represents (spkts + dpkts) / dur."
            })
        elif p6_feat == "Fwd Packets/s":
            mapping_records.append({
                "source_feature": "spkts, dur",
                "target_p6_feature": "Fwd Packets/s",
                "mapping_type": "derived (spkts / dur)",
                "status": "DERIVED_COMPATIBLE",
                "reason": "Forward transmission rate computed as forward packets divided by duration."
            })
        elif p6_feat == "Bwd Packets/s":
            mapping_records.append({
                "source_feature": "dpkts, dur",
                "target_p6_feature": "Bwd Packets/s",
                "mapping_type": "derived (dpkts / dur)",
                "status": "DERIVED_COMPATIBLE",
                "reason": "Backward transmission rate computed as backward packets divided by duration."
            })
        elif p6_feat == "Down/Up Ratio":
            mapping_records.append({
                "source_feature": "dpkts, spkts",
                "target_p6_feature": "Down/Up Ratio",
                "mapping_type": "derived (dpkts / spkts)",
                "status": "DERIVED_COMPATIBLE",
                "reason": "Backward to forward packet ratio."
            })
        elif p6_feat == "Average Packet Size":
            mapping_records.append({
                "source_feature": "sbytes, dbytes, spkts, dpkts",
                "target_p6_feature": "Average Packet Size",
                "mapping_type": "derived ((sbytes + dbytes) / (spkts + dpkts))",
                "status": "DERIVED_COMPATIBLE",
                "reason": "Mean packet size across all bidirectional packets in flow."
            })
        elif p6_feat == "Packet Length Mean":
            mapping_records.append({
                "source_feature": "sbytes, dbytes, spkts, dpkts",
                "target_p6_feature": "Packet Length Mean",
                "mapping_type": "derived ((sbytes + dbytes) / (spkts + dpkts))",
                "status": "DERIVED_COMPATIBLE",
                "reason": "Identical calculation to average packet size across bidirectional flow."
            })
        elif p6_feat == "Fwd IAT Mean":
            mapping_records.append({
                "source_feature": "sinpkt",
                "target_p6_feature": "Fwd IAT Mean",
                "mapping_type": "unit_scale (sinpkt * 1000)",
                "status": "DERIVED_COMPATIBLE",
                "reason": "UNSW 'sinpkt' is in ms; scaled to microseconds to match CIC-IDS2017."
            })
        elif p6_feat == "Bwd IAT Mean":
            mapping_records.append({
                "source_feature": "dinpkt",
                "target_p6_feature": "Bwd IAT Mean",
                "mapping_type": "unit_scale (dinpkt * 1000)",
                "status": "DERIVED_COMPATIBLE",
                "reason": "UNSW 'dinpkt' is in ms; scaled to microseconds to match CIC-IDS2017."
            })
        else:
            # All other 40 P6 features are NOT available in UNSW-NB15
            mapping_records.append({
                "source_feature": "NONE",
                "target_p6_feature": p6_feat,
                "mapping_type": "none",
                "status": "NOT_AVAILABLE",
                "reason": f"Argus/Bro feature extractor in UNSW-NB15 does not compute or extract '{p6_feat}'."
            })

    # 2. Add UNSW-NB15 Specific Features that are Incompatible with P6
    unsw_incompatibles = [
        ("sttl", "Source Time to Live (OS stack dependent)"),
        ("dttl", "Destination Time to Live (OS stack dependent)"),
        ("sloss", "Source packet retransmissions / drops"),
        ("dloss", "Destination packet retransmissions / drops"),
        ("service", "Application service protocol string (e.g. http, dns)"),
        ("Sload", "Source bits per second"),
        ("Dload", "Destination bits per second"),
        ("swin", "Source TCP window advertisement (purged OS fingerprint)"),
        ("dwin", "Destination TCP window advertisement (purged OS fingerprint)"),
        ("stcpb", "Source TCP base sequence number"),
        ("dtcpb", "Destination TCP base sequence number"),
        ("trans_depth", "HTTP pipelined transaction depth"),
        ("res_bdy_len", "HTTP response body content length"),
        ("Sjit", "Source jitter in milliseconds"),
        ("Djit", "Destination jitter in milliseconds"),
        ("tcprtt", "TCP connection handshake round-trip time"),
        ("synack", "TCP SYN to SYNACK duration"),
        ("ackdat", "TCP SYNACK to ACK duration"),
        ("is_sm_ips_ports", "Boolean indicator if src IP == dst IP and src port == dst port"),
        ("ct_state_ttl", "Count of connections with specific state and TTL"),
        ("ct_flw_http_mthd", "Count of HTTP methods in flow"),
        ("is_ftp_login", "Binary indicator of FTP login session"),
        ("ct_ftp_cmd", "Count of FTP commands in session"),
        ("ct_srv_src", "Count of connections with same service and src IP in 100-connection window"),
        ("ct_srv_dst", "Count of connections with same service and dst IP in 100-connection window"),
        ("ct_dst_ltm", "Count of connections to same dst IP in 100-connection window"),
        ("ct_src_ltm", "Count of connections from same src IP in 100-connection window"),
        ("ct_src_dport_ltm", "Count of connections with same src IP and dst port in window"),
        ("ct_dst_sport_ltm", "Count of connections with same dst IP and src port in window"),
        ("ct_dst_src_ltm", "Count of connections with same src and dst IP in window"),
        ("state", "Categorical TCP state machine string (FIN, CON, INT, etc.)"),
        ("proto", "Transaction protocol string (tcp, udp, unas, etc.)"),
        ("id", "Sequential row identifier")
    ]

    for feat, rsn in unsw_incompatibles:
        mapping_records.append({
            "source_feature": feat,
            "target_p6_feature": "NONE",
            "mapping_type": "none",
            "status": "INCOMPATIBLE",
            "reason": rsn
        })

    mapping_df = pd.DataFrame(mapping_records)
    csv_path = os.path.join(reports_dir, "p6_unsw_feature_mapping.csv")
    mapping_df.to_csv(csv_path, index=False)
    print(f"[SAVED] Mapping CSV: {csv_path}")

    # Summary table
    status_counts = mapping_df["status"].value_counts()
    print("\nFeature Harmonization Status Summary:")
    for stat, cnt in status_counts.items():
        print(f"  - {stat:20s}: {cnt:2d} entries")

    p6_mapped = mapping_df[(mapping_df["target_p6_feature"] != "NONE") & 
                           (mapping_df["status"].isin(["DIRECT_MATCH", "DERIVED_COMPATIBLE"]))]
    p6_unmapped = mapping_df[(mapping_df["target_p6_feature"] != "NONE") & 
                             (mapping_df["status"] == "NOT_AVAILABLE")]

    print(f"\nP6 Target Features ({len(p6_features)} total):")
    print(f"  - Successfully Mappable: {len(p6_mapped)} ({len(p6_mapped)/len(p6_features)*100:.1f}%)")
    print(f"  - Unobserved / Absent : {len(p6_unmapped)} ({len(p6_unmapped)/len(p6_features)*100:.1f}%)")

if __name__ == "__main__":
    generate_mapping()
