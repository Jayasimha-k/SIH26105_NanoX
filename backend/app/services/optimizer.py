import time
import logging
from typing import List, Dict, Any, Optional
import pulp
from app.models.db_models import SecurityControl
from app.services.risk_engine import RiskEngine

logger = logging.getLogger(__name__)

class OptimizationEngine:
    @staticmethod
    def optimize_security_budget(
        available_budget: float,
        controls: List[SecurityControl],
        pre_eal: float,
        enforce_control_ids: Optional[List[str]] = None,
        exclude_control_ids: Optional[List[str]] = None,
        target_metric: str = "MAX_RISK_REDUCTION"
    ) -> Dict[str, Any]:
        """
        Solves 0-1 Integer Linear Program (ILP) using PuLP solver.
        Maximize total expected risk reduction under budget and dependency constraints.
        """
        start_time = time.time()
        enforce_control_ids = enforce_control_ids or []
        exclude_control_ids = exclude_control_ids or []

        # Create PuLP Linear Programming problem
        prob = pulp.LpProblem("Security_Investment_Optimization", pulp.LpMaximize)

        # Decision variables: x_i in {0, 1} indicating whether control i is selected
        x_vars = {}
        for ctrl in controls:
            x_vars[ctrl.id] = pulp.LpVariable(f"x_{ctrl.id}", cat=pulp.LpBinary)

        # Calculate estimated individual risk reduction value per control
        # Value = pre_eal * effectiveness
        ctrl_values = {}
        for ctrl in controls:
            ctrl_values[ctrl.id] = pre_eal * float(ctrl.effectiveness)

        # Objective Function: Maximize sum(Value_i * x_i)
        prob += pulp.lpSum([ctrl_values[ctrl.id] * x_vars[ctrl.id] for ctrl in controls]), "Total_Risk_Reduction"

        # Constraint 1: Total Cost <= Available Budget
        prob += pulp.lpSum([float(ctrl.cost) * x_vars[ctrl.id] for ctrl in controls]) <= available_budget, "Budget_Limit"

        # Constraint 2: Enforced controls (x_i = 1)
        for cid in enforce_control_ids:
            if cid in x_vars:
                prob += x_vars[cid] == 1, f"Enforce_{cid}"

        # Constraint 3: Excluded controls (x_i = 0)
        for cid in exclude_control_ids:
            if cid in x_vars:
                prob += x_vars[cid] == 0, f"Exclude_{cid}"

        # Constraint 4: Prerequisite dependency rules (requires_control_id)
        for ctrl in controls:
            if ctrl.requires_control_id and ctrl.requires_control_id in x_vars:
                prob += x_vars[ctrl.id] <= x_vars[ctrl.requires_control_id], f"Dep_{ctrl.id}_req_{ctrl.requires_control_id}"

        # Solve ILP problem using PuLP default solver (PULP_CBC_CMD / COIN-OR)
        solver = pulp.PULP_CBC_CMD(msg=False)
        status = prob.solve(solver)

        selected_controls = []
        total_cost = 0.0

        if pulp.LpStatus[status] == "Optimal" or pulp.LpStatus[status] == "Not Solved":
            for ctrl in controls:
                val = pulp.value(x_vars[ctrl.id])
                if val is not None and val > 0.5:
                    selected_controls.append(ctrl)
                    total_cost += float(ctrl.cost)

        # Evaluate final post-control EAL and ROSI
        eval_result = RiskEngine.evaluate_risk_profile(
            exploitation_prob=1.0,  # Base normalized factor
            financial_impact=pre_eal,
            controls=selected_controls
        )

        exec_time = round((time.time() - start_time) * 1000.0, 2)

        return {
            "budget": available_budget,
            "selected_controls": selected_controls,
            "total_cost": round(total_cost, 2),
            "pre_eal": round(pre_eal, 2),
            "post_eal": eval_result["eal_post"],
            "risk_reduction": eval_result["risk_reduction"],
            "rosi": eval_result["rosi"],
            "solver_status": pulp.LpStatus[status],
            "execution_time_ms": exec_time
        }
