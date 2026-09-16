"""
investment_optimizer.py
Portfolio optimization engine for cybersecurity control investments.

Calculates estimated risk reduction, residual risk, and optimal portfolio selection
within a specified budget ceiling (in INR / ₹).
"""

from typing import List, Dict, Any, Optional
import copy

# Catalog of standardized cybersecurity investments mapped to NIST CSF 2.0 categories
INVESTMENT_CATALOG = [
    {
        "id": "INV-MFA",
        "name": "Enterprise Multi-Factor Authentication (MFA) & FIDO2",
        "category": "identity_and_access",
        "cost_small": 150000,
        "cost_medium": 500000,
        "cost_large": 2000000,
        "posture_delta": {
            "mfa_coverage": 100.0,
            "privileged_account_mfa": True
        },
        "description": "Deploys hardware/push-based MFA across 100% of employees and admin accounts."
    },
    {
        "id": "INV-EDR",
        "name": "Next-Gen Managed EDR & Threat Hunting",
        "category": "detection",
        "cost_small": 250000,
        "cost_medium": 900000,
        "cost_large": 3500000,
        "posture_delta": {
            "edr_coverage": 95.0,
            "mean_time_to_detect": 6.0
        },
        "description": "Continuous behavioral endpoint detection, telemetry archiving, and automated quarantine."
    },
    {
        "id": "INV-BACKUP",
        "name": "Immutable Air-Gapped Offline Backup Solution",
        "category": "recovery",
        "cost_small": 200000,
        "cost_medium": 650000,
        "cost_large": 2500000,
        "posture_delta": {
            "offline_backup": True,
            "backup_testing_frequency_months": 3,
            "recovery_time_objective_hours": 8.0
        },
        "description": "Ransomware-resilient, write-once-read-many (WORM) cloud and offline tape backup vault."
    },
    {
        "id": "INV-PATCH",
        "name": "Automated Patch & Vulnerability Orchestration Platform",
        "category": "vulnerability_management",
        "cost_small": 120000,
        "cost_medium": 450000,
        "cost_large": 1800000,
        "posture_delta": {
            "average_patch_delay": 7,
            "critical_vulnerability_remediation_time": 3,
            "vulnerability_scanning_frequency_days": 7
        },
        "description": "Continuous asset scanning and automated patch testing pipeline for CVE remediation."
    },
    {
        "id": "INV-NETSEG",
        "name": "Zero-Trust Microsegmentation & Next-Gen Firewalls",
        "category": "protection",
        "cost_small": 180000,
        "cost_medium": 750000,
        "cost_large": 3000000,
        "posture_delta": {
            "network_segmentation": True,
            "firewall_deployment": True
        },
        "description": "Restricts lateral adversary movement between internal subnets and server clusters."
    },
    {
        "id": "INV-PENTEST",
        "name": "Bi-Annual Red Team Penetration Testing & Posture Audit",
        "category": "vulnerability_management",
        "cost_small": 100000,
        "cost_medium": 350000,
        "cost_large": 1200000,
        "posture_delta": {
            "penetration_testing_frequency_months": 6
        },
        "description": "External adversary simulation to discover misconfigurations and exploitable bypasses."
    },
    {
        "id": "INV-TRAIN",
        "name": "Continuous Phishing Simulation & Security Awareness",
        "category": "protection",
        "cost_small": 60000,
        "cost_medium": 200000,
        "cost_large": 700000,
        "posture_delta": {
            "security_awareness_training": True
        },
        "description": "Monthly simulated phishing drills and credential defense training for all staff."
    },
    {
        "id": "INV-SIEM",
        "name": "Cloud SIEM & 24/7 Virtual SOC Monitoring",
        "category": "detection",
        "cost_small": 300000,
        "cost_medium": 1200000,
        "cost_large": 4500000,
        "posture_delta": {
            "siem_deployed": True,
            "soc_coverage_hours": 24,
            "log_retention_days": 365
        },
        "description": "Centralized log ingestion, correlation rules, and 24/7 threat monitoring."
    }
]


class InvestmentOptimizer:
    def __init__(self, risk_evaluator_fn):
        """
        risk_evaluator_fn: Callable taking an organization dict and returning a risk score (0-100).
        """
        self.risk_evaluator_fn = risk_evaluator_fn

    def get_investment_cost(self, investment: Dict[str, Any], size: str) -> float:
        size = size.lower() if size else "medium"
        if size == "small":
            return investment.get("cost_small", 200000)
        elif size == "large":
            return investment.get("cost_large", 2500000)
        else:
            return investment.get("cost_medium", 600000)

    def evaluate_investment_impacts(self, current_org: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Evaluates the marginal risk reduction for every individual security investment.
        """
        base_assessment = self.risk_evaluator_fn(current_org)
        base_risk = base_assessment["risk_score"] if isinstance(base_assessment, dict) else float(base_assessment)
        size = current_org.get("organization_size", "medium")

        results = []
        for inv in INVESTMENT_CATALOG:
            cost = self.get_investment_cost(inv, size)
            
            # Create a simulated copy with the control applied
            simulated_org = copy.deepcopy(current_org)
            for k, v in inv["posture_delta"].items():
                simulated_org[k] = v
                
            new_assessment = self.risk_evaluator_fn(simulated_org)
            new_risk = new_assessment["risk_score"] if isinstance(new_assessment, dict) else float(new_assessment)
            
            risk_reduction = max(0.0, round(base_risk - new_risk, 2))
            
            # Efficiency: risk reduction per ₹100,000 spent
            efficiency = round((risk_reduction / (cost / 100000.0)), 3) if cost > 0 else 0.0

            results.append({
                "id": inv["id"],
                "name": inv["name"],
                "category": inv["category"],
                "cost_inr": cost,
                "expected_risk_reduction": risk_reduction,
                "projected_risk_score": round(new_risk, 1),
                "efficiency_score": efficiency,
                "description": inv["description"]
            })

        # Sort by marginal risk reduction descending
        results.sort(key=lambda x: x["expected_risk_reduction"], reverse=True)
        return results

    def optimize_portfolio(self, current_org: Dict[str, Any], budget_inr: float) -> Dict[str, Any]:
        """
        Knapsack 0-1 optimization to select the portfolio of controls that maximizes
        risk reduction within the allocated budget ceiling.
        """
        base_assessment = self.risk_evaluator_fn(current_org)
        base_risk = base_assessment["risk_score"] if isinstance(base_assessment, dict) else float(base_assessment)
        size = current_org.get("organization_size", "medium")

        # Evaluate individual candidates
        candidates = self.evaluate_investment_impacts(current_org)
        # Filter only candidates that provide positive risk reduction
        viable = [c for c in candidates if c["expected_risk_reduction"] > 0]

        # Greedy knapsack heuristic by efficiency ratio (risk_reduction / cost)
        viable_sorted = sorted(viable, key=lambda x: x["efficiency_score"], reverse=True)

        selected = []
        spent = 0.0
        simulated_org = copy.deepcopy(current_org)

        for item in viable_sorted:
            if spent + item["cost_inr"] <= budget_inr:
                selected.append(item)
                spent += item["cost_inr"]
                # Apply delta
                matching_inv = next(i for i in INVESTMENT_CATALOG if i["id"] == item["id"])
                for k, v in matching_inv["posture_delta"].items():
                    simulated_org[k] = v

        # Calculate final joint portfolio impact
        final_assessment = self.risk_evaluator_fn(simulated_org)
        final_risk = final_assessment["risk_score"] if isinstance(final_assessment, dict) else float(final_assessment)
        total_risk_reduction = max(0.0, round(base_risk - final_risk, 1))

        if final_risk < 25.0:
            final_level = "Low"
        elif final_risk < 50.0:
            final_level = "Moderate"
        elif final_risk < 75.0:
            final_level = "High"
        else:
            final_level = "Critical"

        return {
            "budget_inr": budget_inr,
            "total_spent_inr": spent,
            "remaining_budget_inr": budget_inr - spent,
            "baseline_risk_score": base_risk,
            "optimized_risk_score": final_risk,
            "total_risk_reduction": total_risk_reduction,
            "projected_risk_level": final_level,
            "selected_controls_count": len(selected),
            "selected_investments": selected
        }
