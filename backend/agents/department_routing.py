"""
Agent 3: Department Routing Agent
Dispatches complaints to the authoritative government municipal agency 
based on jurisdictional taxonomy, geographic division, and operational mandate.
"""

import time
from datetime import datetime
from typing import Tuple
from config import DEPARTMENTS
from models.incident import ExtractedIssueData, ResolvedLocationData, DepartmentRoutingData, AgentExecutionTrace, IssueCategory

class DepartmentRoutingAgent:
    def __init__(self):
        self.agent_id = "AGENT-03"
        self.agent_name = "Department Routing Agent"

    def route(self, extracted: ExtractedIssueData, location: ResolvedLocationData) -> Tuple[DepartmentRoutingData, AgentExecutionTrace]:
        start_time = time.time()
        reasoning_log = []
        reasoning_log.append(f"Routing issue '{extracted.issue_type}' (Category: {extracted.category}) in {location.ward_name}")

        dept_id = "DEPT-SWM" # default
        
        # Jurisdictional routing matrix
        if extracted.category == IssueCategory.SOLID_WASTE:
            dept_id = "DEPT-SWM"
            reasoning_log.append("Jurisdiction Check: Solid waste & sanitation falls under Municipal Sanitation Unit.")
        elif extracted.category == IssueCategory.ROADS_INFRASTRUCTURE:
            dept_id = "DEPT-PWD"
            reasoning_log.append("Jurisdiction Check: Civil road infrastructure & manholes fall under Public Works Department (PWD).")
        elif extracted.category == IssueCategory.WATER_SEWERAGE:
            dept_id = "DEPT-WSSB"
            reasoning_log.append("Jurisdiction Check: Potable water and sewage mains fall under Water Supply & Sewerage Board.")
        elif extracted.category == IssueCategory.ELECTRICAL_POWER:
            dept_id = "DEPT-PSUB"
            reasoning_log.append("Jurisdiction Check: Public lighting, wires, and transformers fall under Power Utility Board.")
        elif extracted.category == IssueCategory.TRAFFIC_MOBILITY:
            dept_id = "DEPT-TEUM"
            reasoning_log.append("Jurisdiction Check: Traffic signals and road geometry fall under Traffic Engineering & Urban Mobility.")
        elif extracted.category == IssueCategory.PUBLIC_HEALTH:
            dept_id = "DEPT-PHVC"
            reasoning_log.append("Jurisdiction Check: Vector control & epidemic prevention fall under Public Health Department.")
        else:
            # Fallback based on issue type
            for d_id, d_data in DEPARTMENTS.items():
                if extracted.issue_type in d_data["categories"]:
                    dept_id = d_id
                    break
            reasoning_log.append(f"Heuristic Match: Issue mapped to {dept_id}.")

        dept = DEPARTMENTS[dept_id]
        assigned_division = f"{location.zone} Urban Maintenance Squad (Div-{location.ward_id[-2:]})"
        dispatch_notes = (
            f"Automated civic dispatch ticket generated for {dept['name']}. "
            f"Assigned to {assigned_division}. Contact officer: {dept['head']}."
        )

        routing_data = DepartmentRoutingData(
            department_id=dept["id"],
            department_name=dept["name"],
            department_code=dept["code"],
            assigned_division=assigned_division,
            lead_officer=dept["head"],
            contact_phone=dept["contact"],
            dispatch_notes=dispatch_notes
        )

        duration = round((time.time() - start_time) * 1000, 2)
        trace = AgentExecutionTrace(
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            duration_ms=duration,
            timestamp=datetime.now().isoformat(),
            input_summary=f"Issue: {extracted.issue_type} | Ward: {location.ward_id}",
            output_summary=f"Department: {dept['name']} ({dept['code']}) | Division: {assigned_division}",
            reasoning_log=reasoning_log,
            metadata={"department_id": dept_id, "lead_officer": dept["head"]}
        )

        return routing_data, trace
