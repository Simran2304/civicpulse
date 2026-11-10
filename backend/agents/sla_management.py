"""
Agent 6: SLA & Deadline Management Agent
Assigns dynamic SLA timelines based on department benchmarks and priority severity,
tracks countdown clocks, and forecasts SLA breach risks.
"""

import time
from datetime import datetime, timedelta
from typing import Tuple
from config import DEPARTMENTS
from models.incident import PrioritySeverityData, DepartmentRoutingData, SLAData, AgentExecutionTrace

class SLAManagementAgent:
    def __init__(self):
        self.agent_id = "AGENT-06"
        self.agent_name = "SLA & Deadline Management Agent"

    def assign_sla(
        self, 
        priority_data: PrioritySeverityData, 
        routing_data: DepartmentRoutingData,
        current_sim_time: datetime = None
    ) -> Tuple[SLAData, AgentExecutionTrace]:
        start_time = time.time()
        reasoning_log = []
        
        sim_time = current_sim_time or datetime.now()
        dept_info = DEPARTMENTS.get(routing_data.department_id, {})
        sla_matrix = dept_info.get("sla_matrix_hours", {"CRITICAL": 12, "HIGH": 24, "MEDIUM": 48, "LOW": 72})

        # Base SLA hours from department matrix & priority
        sla_hours = sla_matrix.get(priority_data.priority.value, 48)
        reasoning_log.append(f"Department '{routing_data.department_code}' SLA Matrix matched: {sla_hours} hours for {priority_data.priority.value} priority.")

        target_deadline = sim_time + timedelta(hours=sla_hours)
        remaining_seconds = (target_deadline - sim_time).total_seconds()
        remaining_hours = max(0.0, round(remaining_seconds / 3600.0, 2))

        # Risk level determination
        if remaining_seconds <= 0:
            breach_risk = "BREACHED"
            is_breached = True
            countdown_text = "SLA EXPIRED / BREACHED"
        elif remaining_hours <= (0.20 * sla_hours) or remaining_hours <= 6.0:
            breach_risk = "IMMINENT"
            is_breached = False
            countdown_text = f"CRITICAL: Breach risk in {int(remaining_hours)}h {int((remaining_hours%1)*60)}m"
        elif remaining_hours <= (0.50 * sla_hours):
            breach_risk = "MODERATE"
            is_breached = False
            countdown_text = f"{int(remaining_hours)}h {int((remaining_hours%1)*60)}m remaining"
        else:
            breach_risk = "LOW"
            is_breached = False
            countdown_text = f"{int(remaining_hours)}h {int((remaining_hours%1)*60)}m remaining"

        reasoning_log.append(f"Deadline set to {target_deadline.strftime('%Y-%m-%d %H:%M:%S')} (Remaining: {remaining_hours}h, Risk: {breach_risk}).")

        sla_data = SLAData(
            sla_hours=sla_hours,
            deadline=target_deadline.isoformat(),
            created_at=sim_time.isoformat(),
            target_resolution_timestamp=target_deadline.isoformat(),
            remaining_hours=remaining_hours,
            is_breached=is_breached,
            breach_risk_level=breach_risk,
            countdown_text=countdown_text
        )

        duration = round((time.time() - start_time) * 1000, 2)
        trace = AgentExecutionTrace(
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            duration_ms=duration,
            timestamp=sim_time.isoformat(),
            input_summary=f"Dept: {routing_data.department_code} | Priority: {priority_data.priority.value}",
            output_summary=f"SLA: {sla_hours} hrs | Deadline: {target_deadline.strftime('%b %d, %H:%M')} | Risk: {breach_risk}",
            reasoning_log=reasoning_log,
            metadata={"sla_hours": sla_hours, "breach_risk": breach_risk}
        )

        return sla_data, trace

    def recompute_sla(self, sla_data: SLAData, current_sim_time: datetime) -> SLAData:
        """Re-evaluates countdown and breach risk as time passes in simulation"""
        deadline_dt = datetime.fromisoformat(sla_data.deadline)
        diff_seconds = (deadline_dt - current_sim_time).total_seconds()
        
        if diff_seconds <= 0:
            sla_data.is_breached = True
            sla_data.breach_risk_level = "BREACHED"
            sla_data.remaining_hours = 0.0
            overdue_hrs = abs(diff_seconds) / 3600.0
            sla_data.countdown_text = f"OVERDUE by {int(overdue_hrs)}h {int((overdue_hrs%1)*60)}m"
        else:
            rem_hrs = diff_seconds / 3600.0
            sla_data.remaining_hours = round(rem_hrs, 2)
            sla_data.is_breached = False
            if rem_hrs <= 6.0 or rem_hrs <= (0.25 * sla_data.sla_hours):
                sla_data.breach_risk_level = "IMMINENT"
                sla_data.countdown_text = f"Breach risk in {int(rem_hrs)}h {int((rem_hrs%1)*60)}m"
            elif rem_hrs <= (0.50 * sla_data.sla_hours):
                sla_data.breach_risk_level = "MODERATE"
                sla_data.countdown_text = f"{int(rem_hrs)}h {int((rem_hrs%1)*60)}m"
            else:
                sla_data.breach_risk_level = "LOW"
                sla_data.countdown_text = f"{int(rem_hrs)}h {int((rem_hrs%1)*60)}m"

        return sla_data
