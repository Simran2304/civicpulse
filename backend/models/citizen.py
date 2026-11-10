"""
Citizen Profile and Reputation Model
Tracks citizen credibility, reported grievances, verified resolutions, and spam penalties.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class CitizenProfile(BaseModel):
    phone: str
    name: str
    reputation_score: int = 85  # 0 to 100
    badge: str = "Verified Resident"
    total_reported: int = 1
    verified_resolutions: int = 1
    false_reports: int = 0
    disputes_filed: int = 0
    joined_date: str = "2026-01-15"
    recent_tickets: List[str] = []

    def get_trust_tier(self) -> str:
        if self.reputation_score >= 90:
            return "Elite Community Watcher (Fast-Track Dispatch)"
        elif self.reputation_score >= 75:
            return "Verified Resident (Standard Triage)"
        elif self.reputation_score >= 50:
            return "Probationary Reporter (AI Verification Required)"
        else:
            return "Flagged / Low Credibility (Manual Audit Required)"
