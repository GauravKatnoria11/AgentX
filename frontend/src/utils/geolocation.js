import { reverseGeocode } from '../api';

/**
 * High-Precision GPS Geolocation Service for Carelink
 * - Uses satellite hardware GPS (enableHighAccuracy: true)
 * - Zero cache stale fix (maximumAge: 0)
 * - Automatic soft fallback to Wi-Fi/Cellular if satellite cold-lock times out
 * - Real-world street address reverse geocoding via Backend & Nominatim
 */

export async function getAccurateGPSLocation(onProgress) {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser.');
  }

  if (onProgress) onProgress('Acquiring high-precision GPS lock...');

  // Step 1: Attempt Satellite / Hardware High-Accuracy GPS
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0
        }
      );
    });
    return await processPosition(position, onProgress);
  } catch (err) {
    // If user explicitly denied, don't retry, give helpful message
    if (err.code === 1) { // PERMISSION_DENIED
      throw new Error('Location permission denied. Please allow location access in your browser or device settings to get your exact GPS position.');
    }

    // Step 2: Soft fallback to Network / Wi-Fi / Cell tower triangulation
    if (onProgress) onProgress('Connecting via network Wi-Fi positioning...');
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 30000
          }
        );
      });
      return await processPosition(position, onProgress);
    } catch (fallbackErr) {
      throw new Error(
        fallbackErr.code === 1
          ? 'Location permission was denied.'
          : 'Unable to establish GPS or Wi-Fi positioning. Please check device location services.'
      );
    }
  }
}

async function processPosition(position, onProgress) {
  const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
  const lat = parseFloat(latitude.toFixed(6));
  const lon = parseFloat(longitude.toFixed(6));
  const accMeters = Math.round(accuracy || 10);

  if (onProgress) onProgress(`GPS locked (±${accMeters}m). Resolving street address...`);

  let resolvedName = `GPS Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
  let resolvedAddress = `Hoshiarpur GPS Pin (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
  let resolvedLocality = 'Hoshiarpur';

  // 1. Try backend reverse-geocode
  try {
    const res = await reverseGeocode(lat, lon);
    if (res?.success && res.data) {
      resolvedName = res.data.name || resolvedName;
      resolvedAddress = res.data.formatted_address || resolvedAddress;
      resolvedLocality = res.data.locality || resolvedLocality;
    }
  } catch (e) {
    // 2. Client-side Nominatim fallback
    try {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18`,
        { headers: { 'User-Agent': 'CarelinkFrontendApp/2.0' } }
      );
      if (nomRes.ok) {
        const nomData = await nomRes.json();
        const addr = nomData.address || {};
        const road = addr.road || addr.suburb || addr.neighbourhood;
        const city = addr.city || addr.town || addr.village || 'Hoshiarpur';
        if (road) resolvedName = road;
        resolvedAddress = nomData.display_name || `${resolvedName}, ${city}`;
        resolvedLocality = city;
      }
    } catch (nomErr) {
      console.warn('Reverse geocode fallback failed:', nomErr);
    }
  }

  return {
    name: resolvedName,
    formatted_address: resolvedAddress,
    lat,
    lon,
    accuracy: accMeters,
    accuracy_label: accMeters <= 20 ? 'Satellite GPS (Pinpoint)' : accMeters <= 100 ? 'Wi-Fi / Mobile Network' : 'Cell Tower Triangulation',
    altitude: altitude ? Math.round(altitude) : null,
    heading,
    speed,
    timestamp: position.timestamp || Date.now(),
    isExactGPS: true
  };
}
