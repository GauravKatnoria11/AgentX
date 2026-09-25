import math
import re
import asyncio
import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)
# httpx logs full request URLs at INFO; Google Maps keys are query parameters.
logging.getLogger('httpx').setLevel(logging.WARNING)

HOSHIARPUR_PLACES: List[Dict[str, Any]] = [
    {"name": "Model Town", "formatted_address": "Model Town, Hoshiarpur, Punjab 146001", "latitude": 31.5312, "longitude": 75.9184, "locality": "Model Town"},
    {"name": "Civil Lines", "formatted_address": "Civil Lines, Court Road, Hoshiarpur, Punjab 146001", "latitude": 31.5284, "longitude": 75.9122, "locality": "Civil Lines"},
    {"name": "Central Bus Stand", "formatted_address": "Central Bus Stand, Sutheri Road, Hoshiarpur, Punjab 146001", "latitude": 31.5342, "longitude": 75.9158, "locality": "Sutheri Road"},
    {"name": "District Session Courts", "formatted_address": "District & Session Courts, Phagwara Road, Hoshiarpur, Punjab 146001", "latitude": 31.5188, "longitude": 75.9082, "locality": "Phagwara Road"},
    {"name": "Railway Station Road", "formatted_address": "Railway Station Road, Hoshiarpur, Punjab 146001", "latitude": 31.5245, "longitude": 75.9055, "locality": "Railway Station"},
    {"name": "Shimla Pahari", "formatted_address": "Shimla Pahari Chowk, Mall Road, Hoshiarpur, Punjab 146001", "latitude": 31.5328, "longitude": 75.9196, "locality": "Mall Road"},
    {"name": "Prabhat Chowk", "formatted_address": "Prabhat Chowk, Main City Corridor, Hoshiarpur, Punjab 146001", "latitude": 31.5305, "longitude": 75.9140, "locality": "Prabhat Chowk"},
    {"name": "Kotwali Bazar", "formatted_address": "Kotwali Bazar, Old City, Hoshiarpur, Punjab 146001", "latitude": 31.5330, "longitude": 75.9100, "locality": "Old City"},
    {"name": "Bajwara", "formatted_address": "Bajwara Kalan & Khurd, NH503A, Hoshiarpur, Punjab 146023", "latitude": 31.5186, "longitude": 75.9535, "locality": "Bajwara"},
    {"name": "Purhiran", "formatted_address": "Purhiran, GT Road / Phagwara Highway, Hoshiarpur, Punjab 146001", "latitude": 31.5050, "longitude": 75.9100, "locality": "Purhiran"},
    {"name": "Piplanwala", "formatted_address": "Piplanwala, Dasuya Road Bypass, Hoshiarpur, Punjab 146022", "latitude": 31.5420, "longitude": 75.9250, "locality": "Piplanwala"},
    {"name": "Aslamabad", "formatted_address": "Aslamabad, Mall Road Extension, Hoshiarpur, Punjab 146001", "latitude": 31.5350, "longitude": 75.9220, "locality": "Aslamabad"},
    {"name": "Chandigarh Road Bypass", "formatted_address": "Chandigarh Road Bypass, Hoshiarpur, Punjab 146023", "latitude": 31.5165, "longitude": 75.9285, "locality": "Chandigarh Road"},
    {"name": "Bullowal / Mahilpur Road", "formatted_address": "Mahilpur Road Junction, Bullowal, Hoshiarpur, Punjab 146113", "latitude": 31.4850, "longitude": 75.9550, "locality": "Bullowal"},
    {"name": "Mini Secretariat (DC Office)", "formatted_address": "Mini Secretariat, DC Office Complex, Hoshiarpur, Punjab 146001", "latitude": 31.5270, "longitude": 75.9110, "locality": "Court Road"},
    {"name": "Naloyan Chowk", "formatted_address": "Naloyan Chowk, Sutheri Road, Hoshiarpur, Punjab 146001", "latitude": 31.5290, "longitude": 75.9170, "locality": "Naloyan"},
    {"name": "Fatehgarh", "formatted_address": "Fatehgarh Road, Hoshiarpur, Punjab 146001", "latitude": 31.5380, "longitude": 75.9080, "locality": "Fatehgarh"},
    {"name": "Kamalpur", "formatted_address": "Kamalpur, Near Model Town, Hoshiarpur, Punjab 146001", "latitude": 31.5260, "longitude": 75.9200, "locality": "Kamalpur"},
    {"name": "Tanda Road Bypass", "formatted_address": "Tanda Road Bypass Junction, Hoshiarpur, Punjab 146001", "latitude": 31.5450, "longitude": 75.9020, "locality": "Tanda Road"},
    {"name": "Dasuya Road", "formatted_address": "Dasuya Road, Near Industrial Area, Hoshiarpur, Punjab 146001", "latitude": 31.5500, "longitude": 75.8950, "locality": "Dasuya Road"},
    {"name": "Hariana Road", "formatted_address": "Hariana Road, Northern Hoshiarpur, Punjab 146001", "latitude": 31.5480, "longitude": 75.9150, "locality": "Hariana Road"},
    {"name": "Una Road / Chohal", "formatted_address": "Una Road, Near Chohal Valley, Hoshiarpur, Punjab 146024", "latitude": 31.5400, "longitude": 75.9600, "locality": "Una Road"},
    {"name": "Ghumar Mandi", "formatted_address": "Ghumar Mandi, City Market, Hoshiarpur, Punjab 146001", "latitude": 31.5310, "longitude": 75.9120, "locality": "City Market"},
    {"name": "Subhash Nagar", "formatted_address": "Subhash Nagar, Hoshiarpur, Punjab 146001", "latitude": 31.5220, "longitude": 75.9140, "locality": "Subhash Nagar"},
    {"name": "Bassi Ghulam Hussain", "formatted_address": "Bassi Ghulam Hussain, Hoshiarpur, Punjab 146021", "latitude": 31.5120, "longitude": 75.8980, "locality": "Bassi"},
    {"name": "Rayat Bahra Professional University Hoshiarpur", "formatted_address": "Rayat Bahra Professional University, V.P.O. Bohan, Chandigarh Road, Hoshiarpur, Punjab 146101", "latitude": 31.4820, "longitude": 75.9591, "locality": "Bohan"},
    {"name": "Rayat Bahra University Hoshiarpur", "formatted_address": "Rayat Bahra University, Hoshiarpur Campus, V.P.O. Bohan, Chandigarh Road, Hoshiarpur, Punjab 146101", "latitude": 31.4820, "longitude": 75.9591, "locality": "Bohan"},
    {"name": "Rayat Bahra Campus Bohan", "formatted_address": "Rayat Bahra Group of Institutes, Chandigarh Road, Bohan, Hoshiarpur, Punjab 146101", "latitude": 31.4820, "longitude": 75.9591, "locality": "Bohan"},
    {"name": "RBPU Hoshiarpur", "formatted_address": "Rayat Bahra Professional University, Bohan Campus, Hoshiarpur, Punjab 146101", "latitude": 31.4820, "longitude": 75.9591, "locality": "Bohan"}
]


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


class MapService:
    def __init__(self):
        self.api_key = settings.maps_api_key
        self._geocode_cache: Dict[str, tuple[float, float, float]] = {}
        self._geocode_lock = asyncio.Lock()
        self._last_geocode_at = 0.0

    @staticmethod
    def _with_hoshiarpur_context(place: str) -> str:
        query = (place or '').strip()
        # Only add local context to a bare, known Hoshiarpur landmark. Never
        # silently force an arbitrary facility or user-entered city into this area.
        known_locality = any(
            query.casefold() == item['name'].casefold()
            or query.casefold() == item.get('locality', '').casefold()
            for item in HOSHIARPUR_PLACES
        )
        if known_locality and not any(token in query.casefold() for token in ('hoshiarpur', 'punjab', 'india')):
            query = f'{query}, Hoshiarpur, Punjab, India'
        return query

    @staticmethod
    def _matches_requested_area(place: str, area_values: List[str]) -> bool:
        query = (place or '').casefold()
        areas = ' '.join(str(value).casefold() for value in area_values if value)
        if 'hoshiarpur' in query and 'hoshiarpur' not in areas:
            return False
        if 'punjab' in query and 'punjab' not in areas:
            return False
        return True

    async def _resolve_coordinates(self, place: str) -> Optional[tuple[float, float]]:
        """Resolve a user-provided place at route time; never substitute a guessed city pin."""
        match = re.search(r'(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)', place or '')
        if match:
            lat, lon = float(match.group(1)), float(match.group(2))
            if -90 <= lat <= 90 and -180 <= lon <= 180:
                return lat, lon

        cache_key = (place or '').strip().casefold()
        cached = self._geocode_cache.get(cache_key)
        if cached and cached[0] > time.monotonic():
            return cached[1], cached[2]

        # Use the configured Google key when available, but keep it on the backend.
        if self.api_key:
            try:
                query = self._with_hoshiarpur_context(place)
                async with httpx.AsyncClient(timeout=6.0) as client:
                    response = await client.get(
                        'https://maps.googleapis.com/maps/api/geocode/json',
                        params={'address': query, 'region': 'in', 'key': self.api_key}
                    )
                    payload = response.json()
                    if payload.get('status') == 'OK' and payload.get('results'):
                        candidate = payload['results'][0]
                        component_values = [
                            component.get('long_name', '')
                            for component in candidate.get('address_components', [])
                        ]
                        if self._matches_requested_area(query, component_values):
                            point = candidate['geometry']['location']
                            coords = (float(point['lat']), float(point['lng']))
                            self._geocode_cache[cache_key] = (time.monotonic() + 86400, *coords)
                            return coords
                        logger.info('Google geocode result was outside the requested area: %s', place)
            except Exception as exc:
                logger.debug('Google geocoding failed; trying OpenStreetMap: %s', exc)

        # Nominatim is a fallback for a user-submitted route, not a per-keystroke autocomplete source.
        async with self._geocode_lock:
            cached = self._geocode_cache.get(cache_key)
            if cached and cached[0] > time.monotonic():
                return cached[1], cached[2]
            wait_for_slot = 1.1 - (time.monotonic() - self._last_geocode_at)
            if wait_for_slot > 0:
                await asyncio.sleep(wait_for_slot)
            query = self._with_hoshiarpur_context(place)
            try:
                async with httpx.AsyncClient(timeout=7.0) as client:
                    response = await client.get(
                        f'{settings.NOMINATIM_BASE_URL.rstrip("/")}/search',
                        params={'q': query, 'format': 'jsonv2', 'limit': 5, 'countrycodes': 'in', 'addressdetails': 1},
                        headers={
                            'User-Agent': 'CarelinkHealthcareApp/2.0',
                            'Referer': settings.FRONTEND_URL
                        }
                    )
                    self._last_geocode_at = time.monotonic()
                    response.raise_for_status()
                    results = response.json()
                    if results:
                        for candidate in results:
                            candidate_address = candidate.get('address', {})
                            area_values = [
                                candidate_address.get(key)
                                for key in ('city', 'town', 'village', 'municipality', 'county', 'state_district', 'district', 'state')
                            ]
                            if not self._matches_requested_area(query, area_values):
                                logger.debug('Skipping out-of-area place result %s for %s', candidate.get('display_name'), place)
                                continue
                            facility_query = bool(re.search(r'\b(hospital|clinic|medical centre|medical center|health centre|health center)\b', place, re.I))
                            query_name = re.sub(r'[^a-z0-9]+', ' ', place.split(',')[0].casefold()).strip()
                            result_name = re.sub(r'[^a-z0-9]+', ' ', str(candidate.get('name') or '').casefold()).strip()
                            result_label = re.sub(r'[^a-z0-9]+', ' ', str(candidate.get('display_name') or '').casefold()).strip()
                            name_match = (
                                query_name in result_label
                                or (result_name and result_name in query_name)
                                or all(token in result_label for token in query_name.split() if token not in {'the', 'and'})
                            )
                            if facility_query and not name_match:
                                logger.debug('Skipping unmatched healthcare facility result %s for %s', candidate.get('display_name'), place)
                                continue
                            coords = (float(candidate['lat']), float(candidate['lon']))
                            self._geocode_cache[cache_key] = (time.monotonic() + 86400, *coords)
                            return coords
            except Exception as exc:
                logger.warning('Place geocoding failed for route: %s', exc)
        return None

    async def search_locations(self, query: str) -> List[Dict[str, Any]]:
        """
        Searches Hoshiarpur localities, landmarks, and addresses.
        Uses local instant dictionary + fallback to Geocoding if not found.
        """
        if not query or not query.strip():
            return HOSHIARPUR_PLACES[:10]

        q = query.strip().lower()
        matched = []

        # 1. Match local curated Hoshiarpur landmarks
        for place in HOSHIARPUR_PLACES:
            if q in place["name"].lower() or q in place["formatted_address"].lower() or q in place.get("locality", "").lower():
                matched.append(place)

        if matched:
            return matched[:8]

        # This endpoint backs autocomplete. Unknown text is geocoded only when the
        # user submits a route, rather than sending each keystroke to a public service.
        return []

    async def get_route(
        self,
        origin: str,
        destination: str,
        mode: str = "driving"
    ) -> Dict[str, Any]:
        """Get a provider-computed road route; don't synthesize geometry or travel times."""
        if self.api_key:
            try:
                async with httpx.AsyncClient(timeout=4.0) as client:
                    params = {
                        "origin": origin,
                        "destination": destination,
                        "mode": mode,
                        "key": self.api_key,
                        "alternatives": "false"
                    }
                    if mode == "driving":
                        params.update({"departure_time": "now", "traffic_model": "best_guess"})
                    resp = await client.get(
                        "https://maps.googleapis.com/maps/api/directions/json",
                        params=params
                    )
                    data = resp.json()
                    if data.get("status") == "OK" and data.get("routes"):
                        route = data["routes"][0]
                        leg = route["legs"][0]
                        steps = [
                            {
                                "instruction": s.get("html_instructions", s.get("maneuver", "Proceed on route")),
                                "distance_text": s.get("distance", {}).get("text", ""),
                                "duration_text": s.get("duration", {}).get("text", "")
                            }
                            for s in leg.get("steps", [])
                        ]
                        dist_val = leg.get("distance", {}).get("value", 5000) / 1000.0
                        live_duration = leg.get("duration_in_traffic") if mode == "driving" else None
                        duration = live_duration or leg.get("duration", {})
                        dur_val = int(round(duration.get("value", 0) / 60.0))
                        if not dur_val:
                            raise ValueError("Google Maps returned no route duration.")
                        return {
                            "origin": origin,
                            "destination": destination,
                            "mode": mode,
                            "distance_km": round(dist_val, 2),
                            "distance_text": leg.get("distance", {}).get("text", f"{round(dist_val, 1)} km"),
                            "duration_minutes": max(1, dur_val),
                            "duration_text": duration.get("text", f"{max(1, dur_val)} mins"),
                            "steps": steps,
                            "polyline": route.get("overview_polyline", {}).get("points"),
                            "traffic_aware": bool(live_duration),
                            "routing_source": "google",
                            "origin_lat": leg.get("start_location", {}).get("lat"),
                            "origin_lon": leg.get("start_location", {}).get("lng"),
                            "destination_lat": leg.get("end_location", {}).get("lat"),
                            "destination_lon": leg.get("end_location", {}).get("lng")
                        }
            except Exception as e:
                logger.debug("Google Maps route failed; trying OpenStreetMap: %s", e)

        if mode != "driving":
            raise ValueError("Live walking or transit directions require a configured Google Maps API key.")

        origin_coords, destination_coords = await asyncio.gather(
            self._resolve_coordinates(origin),
            self._resolve_coordinates(destination)
        )
        if not origin_coords or not destination_coords:
            raise ValueError("Could not verify both locations. Check the addresses and try again.")

        try:
            coordinates = f"{origin_coords[1]},{origin_coords[0]};{destination_coords[1]},{destination_coords[0]}"
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(
                    f"{settings.OSRM_BASE_URL.rstrip('/')}/route/v1/driving/{coordinates}",
                    params={"overview": "full", "geometries": "polyline", "steps": "true"}
                )
                response.raise_for_status()
                payload = response.json()
            route = (payload.get("routes") or [None])[0]
            if payload.get("code") != "Ok" or not route:
                raise ValueError("No drivable route was found between these locations.")

            distance_km = route["distance"] / 1000
            duration_minutes = max(1, int(round(route["duration"] / 60)))
            waypoints = payload.get("waypoints") or []
            origin_snap = waypoints[0].get("location", []) if waypoints else []
            destination_snap = waypoints[1].get("location", []) if len(waypoints) > 1 else []
            steps = []
            for step in route.get("legs", [{}])[0].get("steps", []):
                maneuver = step.get("maneuver", {})
                instruction = " ".join(part for part in [maneuver.get("type", "Continue"), maneuver.get("modifier"), step.get("name")] if part)
                steps.append({
                    "instruction": instruction,
                    "distance_text": f"{step.get('distance', 0) / 1000:.1f} km",
                    "duration_text": f"{max(1, int(round(step.get('duration', 0) / 60)))} min"
                })
            return {
                "origin": origin,
                "destination": destination,
                "mode": mode,
                "distance_km": round(distance_km, 2),
                "distance_text": f"{distance_km:.1f} km",
                "duration_minutes": duration_minutes,
                "duration_text": f"{duration_minutes} min",
                "steps": steps,
                "polyline": route.get("geometry"),
                "traffic_aware": False,
                "routing_source": "openstreetmap",
                "origin_lat": origin_snap[1] if len(origin_snap) == 2 else origin_coords[0],
                "origin_lon": origin_snap[0] if len(origin_snap) == 2 else origin_coords[1],
                "destination_lat": destination_snap[1] if len(destination_snap) == 2 else destination_coords[0],
                "destination_lon": destination_snap[0] if len(destination_snap) == 2 else destination_coords[1]
            }
        except httpx.HTTPError as exc:
            logger.error("OSRM route request failed: %s", exc)
            raise ValueError("The routing service is unavailable right now. Please try again.") from exc

    async def get_distance_matrix(
        self,
        origin: str,
        destination: str,
        mode: str = "driving"
    ) -> Dict[str, Any]:
        """
        Calculates distance and duration matrix.
        """
        route = await self.get_route(origin, destination, mode)
        return {
            "origin": origin,
            "destination": destination,
            "distance_km": route["distance_km"],
            "distance_text": route["distance_text"],
            "duration_minutes": route["duration_minutes"],
            "duration_text": route["duration_text"],
            "traffic_aware": route.get("traffic_aware", False)
        }

    async def get_eta(
        self,
        origin: str,
        destination: str,
        mode: str = "driving"
    ) -> Dict[str, Any]:
        """
        Computes ETA and suggested departure time.
        """
        matrix = await self.get_distance_matrix(origin, destination, mode)
        duration_mins = matrix["duration_minutes"]
        now = datetime.now(timezone.utc)
        eta_dt = now + timedelta(minutes=duration_mins)

        return {
            "origin": origin,
            "destination": destination,
            "travel_mode": mode,
            "current_time": now.strftime("%H:%M:%S UTC"),
            "duration_minutes": duration_mins,
            "eta_timestamp": eta_dt.strftime("%H:%M:%S UTC"),
            "suggested_departure_time": now.strftime("%H:%M:%S UTC"),
            "traffic_condition": "Live traffic estimate" if matrix.get("traffic_aware") else "Live traffic data unavailable"
        }

    async def reverse_geocode(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Reverse geocodes GPS coordinates into real-world address, locality and landmark.
        Combines local high-precision landmark mapping + Nominatim OpenStreetMap fallback.
        """
        # Resolve the exact GPS point through the address provider; nearby sample
        # landmarks are not reliable enough to label a patient's current location.
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                url = f"{settings.NOMINATIM_BASE_URL.rstrip('/')}/reverse"
                resp = await client.get(
                    url,
                    params={"lat": lat, "lon": lon, "format": "jsonv2", "zoom": 18, "addressdetails": 1},
                    headers={"User-Agent": "CarelinkHealthcareApp/2.0", "Referer": settings.FRONTEND_URL}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    addr = data.get("address", {})
                    road = addr.get("road") or addr.get("suburb") or addr.get("neighbourhood") or addr.get("residential")
                    city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("county") or "Hoshiarpur"
                    state = addr.get("state", "Punjab")
                    postcode = addr.get("postcode", "146001")

                    locality_name = road or city or "Current Location"
                    parts = [p for p in [road, addr.get("suburb"), city, state, postcode] if p]
                    formatted = ", ".join(parts) if parts else data.get("display_name", f"{lat:.4f}, {lon:.4f}")

                    return {
                        "name": locality_name,
                        "formatted_address": formatted,
                        "latitude": lat,
                        "longitude": lon,
                        "locality": city,
                        "distance_to_center_km": 0.0
                    }
        except Exception as e:
            logger.debug(f"Reverse geocode failed: {e}")

        return {
            "name": f"GPS Pin ({lat:.4f}, {lon:.4f})",
            "formatted_address": f"GPS Coordinates ({lat:.4f}, {lon:.4f}), Punjab",
            "latitude": lat,
            "longitude": lon,
            "locality": "Hoshiarpur Area",
            "distance_to_center_km": 0.0
        }


map_service = MapService()

