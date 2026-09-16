
CyberOpt-RQ Production Models
==============================

This folder contains the Python PKL versions of the
CyberOpt-RQ XGBoost models.

Model 1
-------
NVD/CVE vulnerability exploitation model.

Model 2
-------
EPSS-style exploitation-risk model.

Model 3
-------
Organization-aware cyber-risk model.

Model 4
-------
ATT&CK-oriented prototype model.

Model 5
-------
Meta model.

Architecture:

P1 + P2 + P3 + P4
        |
        v
     Model 5
        |
        v
       P5

Model 5 uses exactly four inputs:
P1, P2, P3, P4

The PKL files are intended for Python
deployment/inference.

Keep the original JSON models separately
as native XGBoost backups.
