from typing import List, Dict, Any
from app.models.db_models import SecurityControl

class RiskEngine:
    @staticmethod
    def calculate_eal_pre(exploitation_prob: float, financial_impact: float) -> float:
        """
        Expected Annual Loss (EAL) before controls:
        EAL = Probability of Exploitation * Financial Breach Impact
        """
        return round(float(exploitation_prob) * float(financial_impact), 2)

    @staticmethod
    def calculate_eal_post(eal_pre: float, controls: List[SecurityControl]) -> float:
        """
        Expected Annual Loss (EAL) after applying security controls:
        EAL_post = EAL_pre * product(1 - effectiveness_i)
        """
        residual_factor = 1.0
        for ctrl in controls:
            eff = float(ctrl.effectiveness) if hasattr(ctrl, 'effectiveness') else float(ctrl.get('effectiveness', 0.0))
            residual_factor *= (1.0 - max(0.0, min(1.0, eff)))

        return round(eal_pre * residual_factor, 2)

    @staticmethod
    def calculate_risk_reduction(eal_pre: float, eal_post: float) -> float:
        """Delta EAL = EAL_pre - EAL_post"""
        return round(max(0.0, eal_pre - eal_post), 2)

    @staticmethod
    def calculate_total_cost(controls: List[SecurityControl]) -> float:
        """Sum of implementation costs for selected controls"""
        total = 0.0
        for ctrl in controls:
            cost = float(ctrl.cost) if hasattr(ctrl, 'cost') else float(ctrl.get('cost', 0.0))
            total += cost
        return round(total, 2)

    @staticmethod
    def calculate_rosi(risk_reduction: float, total_cost: float) -> float:
        """
        Return on Security Investment (ROSI):
        ROSI % = ((Risk Reduction - Cost) / Cost) * 100
        """
        if total_cost <= 0:
            return 0.0
        return round(((risk_reduction - total_cost) / total_cost) * 100.0, 2)

    @classmethod
    def evaluate_risk_profile(
        cls,
        exploitation_prob: float,
        financial_impact: float,
        controls: List[SecurityControl]
    ) -> Dict[str, float]:
        eal_pre = cls.calculate_eal_pre(exploitation_prob, financial_impact)
        eal_post = cls.calculate_eal_post(eal_pre, controls)
        risk_reduction = cls.calculate_risk_reduction(eal_pre, eal_post)
        total_cost = cls.calculate_total_cost(controls)
        rosi = cls.calculate_rosi(risk_reduction, total_cost)

        return {
            "exploitation_probability": round(exploitation_prob, 4),
            "financial_impact": financial_impact,
            "eal_pre": eal_pre,
            "eal_post": eal_post,
            "risk_reduction": risk_reduction,
            "total_control_cost": total_cost,
            "rosi": rosi
        }
