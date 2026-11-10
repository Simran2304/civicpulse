"""
CivicPulse AI - Simulation Clock and Fast-Forward Time Engine
Manages municipal time anchored to the real-world system clock,
supports dynamic hour offsets, and triggers automated SLA checks.
"""

from datetime import datetime, timedelta
from typing import Dict, Any

class SimulationClock:
    def __init__(self):
        # Time offset from current real-world system time in seconds
        self.time_offset_seconds: float = 0.0
        self.weather: str = "Clear & Sunny (28°C)"
        self.rainfall_mm: float = 0.0

    def get_time(self) -> datetime:
        """Returns the current real-world time plus any active simulation offset"""
        return datetime.now() + timedelta(seconds=self.time_offset_seconds)

    def get_formatted_time(self) -> str:
        """Formatted string with day, date, year, and time with seconds"""
        return self.get_time().strftime("%A, %b %d, %Y • %I:%M:%S %p")

    def advance_hours(self, hours: float) -> datetime:
        """Advances clock forward by specified hours"""
        self.time_offset_seconds += hours * 3600.0
        return self.get_time()

    def reset_to_realtime(self) -> datetime:
        """Resets clock to exact current real-world system time"""
        self.time_offset_seconds = 0.0
        return self.get_time()

    def get_offset_hours(self) -> float:
        return round(self.time_offset_seconds / 3600.0, 1)

    def is_realtime(self) -> bool:
        return abs(self.time_offset_seconds) < 1.0

    def set_weather(self, weather: str, rainfall_mm: float = 0.0):
        self.weather = weather
        self.rainfall_mm = rainfall_mm
