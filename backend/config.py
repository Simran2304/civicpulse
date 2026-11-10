"""
CivicPulse AI - System Configuration, Jurisdictional Rules, and SLA Matrix
Smart City Grievance & Urban Operations System (PS-10)
"""

from typing import Dict, List, Any

CITY_NAME = "Metropolis Smart Urban Region"

# Municipal Wards with Geo-Centroids and Population Density
CITY_WARDS: Dict[str, Dict[str, Any]] = {
    "WARD-01": {
        "id": "WARD-01",
        "name": "Central Business & Administrative District",
        "zone": "Central",
        "lat": 28.6139,
        "lng": 77.2090,
        "population": 142000,
        "counselor": "Rajesh Varma, Municipal Councilor",
        "risk_factors": ["High pedestrian footfall", "VVIP transit corridors"],
        "base_efficiency": 91
    },
    "WARD-02": {
        "id": "WARD-02",
        "name": "North Sector 14 & Old Market",
        "zone": "North",
        "lat": 28.6450,
        "lng": 77.2180,
        "population": 185000,
        "counselor": "Sunita Devi, Ward Member",
        "risk_factors": ["Dense commercial market", "Narrow access alleys", "High solid waste output"],
        "base_efficiency": 74
    },
    "WARD-03": {
        "id": "WARD-03",
        "name": "South Extension & Tech Park Sector 9",
        "zone": "South",
        "lat": 28.5700,
        "lng": 77.2250,
        "population": 210000,
        "counselor": "Amitabh Sen, Ward Member",
        "risk_factors": ["Heavy arterial commuter traffic", "Stormwater runoff basin"],
        "base_efficiency": 86
    },
    "WARD-04": {
        "id": "WARD-04",
        "name": "East Riverfront & Industrial Zone",
        "zone": "East",
        "lat": 28.6250,
        "lng": 77.2800,
        "population": 160000,
        "counselor": "Pooja Malhotra, Ward Member",
        "risk_factors": ["Industrial effluents", "Vulnerable to monsoon waterlogging"],
        "base_efficiency": 68
    },
    "WARD-05": {
        "id": "WARD-05",
        "name": "West Lake Residency & Sector 22",
        "zone": "West",
        "lat": 28.6100,
        "lng": 77.1500,
        "population": 195000,
        "counselor": "Col. Hardeep Singh (Retd.)",
        "risk_factors": ["Suburban residential", "Aging underground water mains"],
        "base_efficiency": 82
    },
    "WARD-06": {
        "id": "WARD-06",
        "name": "Civil Lines & University Enclave",
        "zone": "North-West",
        "lat": 28.6750,
        "lng": 77.2100,
        "population": 128000,
        "counselor": "Dr. Meenakshi Joshi",
        "risk_factors": ["Heritage trees", "Student transit corridors"],
        "base_efficiency": 88
    },
    "WARD-07": {
        "id": "WARD-07",
        "name": "Metro Terminal & Logistics Hub",
        "zone": "South-West",
        "lat": 28.5400,
        "lng": 77.1700,
        "population": 155000,
        "counselor": "Vikas Yadav",
        "risk_factors": ["Heavy transport vehicle traffic", "24x7 street lighting requirement"],
        "base_efficiency": 79
    },
    "WARD-08": {
        "id": "WARD-08",
        "name": "Green Meadows & Health Village",
        "zone": "East-South",
        "lat": 28.5800,
        "lng": 77.2950,
        "population": 115000,
        "counselor": "Anita Deshmukh",
        "risk_factors": ["Hospital zone - zero tolerance for sewerage leaks"],
        "base_efficiency": 94
    }
}

# Municipal Departments and Operational Rules
DEPARTMENTS: Dict[str, Dict[str, Any]] = {
    "DEPT-SWM": {
        "id": "DEPT-SWM",
        "name": "Municipal Sanitation & Solid Waste Management",
        "code": "SWM",
        "head": "Er. K. R. Sharma, Chief Engineer (Sanitation)",
        "contact": "+91-11-2345-0101",
        "categories": ["solid_waste", "garbage_dump", "drain_cleaning", "dead_animal_removal", "bio_waste"],
        "sla_matrix_hours": {"CRITICAL": 12, "HIGH": 24, "MEDIUM": 48, "LOW": 72}
    },
    "DEPT-PWD": {
        "id": "DEPT-PWD",
        "name": "Public Works & Road Infrastructure Department",
        "code": "PWD",
        "head": "Er. Ananya Gupta, Chief Infrastructure Officer",
        "contact": "+91-11-2345-0102",
        "categories": ["road_pothole", "cave_in", "broken_footpath", "bridge_damage", "illegal_encroachment", "open_manhole"],
        "sla_matrix_hours": {"CRITICAL": 6, "HIGH": 24, "MEDIUM": 72, "LOW": 144}
    },
    "DEPT-WSSB": {
        "id": "DEPT-WSSB",
        "name": "Water Supply & Sewerage Board",
        "code": "WSSB",
        "head": "Er. Tariq Ahmed, Director (Water & Hydrology)",
        "contact": "+91-11-2345-0103",
        "categories": ["water_leakage", "dirty_water", "low_pressure", "sewage_overflow", "burst_pipeline", "blocked_drain"],
        "sla_matrix_hours": {"CRITICAL": 6, "HIGH": 18, "MEDIUM": 36, "LOW": 72}
    },
    "DEPT-PSUB": {
        "id": "DEPT-PSUB",
        "name": "Power Utility & Streetlight Board",
        "code": "PSUB",
        "head": "Er. Manish Chawla, Supt. Engineer (Electrical)",
        "contact": "+91-11-2345-0104",
        "categories": ["broken_streetlight", "hanging_wire", "transformer_sparking", "power_outage", "open_fuse_box"],
        "sla_matrix_hours": {"CRITICAL": 4, "HIGH": 12, "MEDIUM": 48, "LOW": 96}
    },
    "DEPT-TEUM": {
        "id": "DEPT-TEUM",
        "name": "Traffic Engineering & Urban Mobility",
        "code": "TEUM",
        "head": "DCP Alok Ranjan, Traffic & Transit Ops",
        "contact": "+91-11-2345-0105",
        "categories": ["broken_traffic_signal", "missing_signage", "road_barrier_damage", "traffic_hazard"],
        "sla_matrix_hours": {"CRITICAL": 4, "HIGH": 12, "MEDIUM": 36, "LOW": 72}
    },
    "DEPT-PHVC": {
        "id": "DEPT-PHVC",
        "name": "Public Health & Vector Control",
        "code": "PHVC",
        "head": "Dr. Neha Kapoor, Chief Medical Officer (Health)",
        "contact": "+91-11-2345-0106",
        "categories": ["stagnant_water_mosquitoes", "dengue_fogging", "food_safety_hazard", "public_urinal_hygiene"],
        "sla_matrix_hours": {"CRITICAL": 12, "HIGH": 24, "MEDIUM": 48, "LOW": 96}
    }
}

# Dynamic Base Severity Weight Table (0 - 100)
BASE_HAZARD_SCORES: Dict[str, int] = {
    "open_manhole": 95,
    "hanging_wire": 94,
    "transformer_sparking": 92,
    "burst_pipeline": 85,
    "cave_in": 90,
    "broken_traffic_signal": 80,
    "sewage_overflow": 75,
    "road_pothole": 65,
    "water_leakage": 55,
    "garbage_dump": 52,
    "stagnant_water_mosquitoes": 58,
    "broken_streetlight": 40,
    "blocked_drain": 48,
    "broken_footpath": 35,
    "missing_signage": 30,
    "park_bench_broken": 18,
    "general_civic_issue": 30
}

# Spatial clustering threshold (meters and hours)
DUPLICATE_RADIUS_METERS = 350.0
DUPLICATE_TIME_WINDOW_HOURS = 72.0
