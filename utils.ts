
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
};

export const estimateTravelTime = (
  distanceKm: number,
  mode: 'DRIVING' | 'WALKING' | 'TRANSIT' = 'DRIVING'
): string => {
  let speedKmH = 35; // City driving speed
  if (mode === 'WALKING') speedKmH = 5;
  if (mode === 'TRANSIT') speedKmH = 25;

  const totalMinutes = Math.max(2, Math.round((distanceKm / speedKmH) * 60));
  if (totalMinutes < 60) {
    return `${totalMinutes} mins`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours} hr ${mins} mins` : `${hours} hr`;
};

/**
 * Generates an interpolated curvature path between two coordinates for smooth fallback rendering
 */
export const interpolatePath = (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  pointsCount = 20
): { lat: number; lng: number }[] => {
  const path: { lat: number; lng: number }[] = [];
  for (let i = 0; i <= pointsCount; i++) {
    const fraction = i / pointsCount;
    // slight natural road curve
    const curveOffset = Math.sin(fraction * Math.PI) * 0.003;
    const lat = start.lat + (end.lat - start.lat) * fraction + curveOffset;
    const lng = start.lng + (end.lng - start.lng) * fraction;
    path.push({ lat, lng });
  }
  return path;
};

export const getBloodColor = (group: string) => {
  return "text-red-600 font-bold";
};

export const playEmergencySound = () => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
  
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 1);
};
