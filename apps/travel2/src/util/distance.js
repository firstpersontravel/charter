function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function latLngDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1); // deg2rad below
  const dLon = deg2rad(lng2 - lng1);
  const a = (Math.sin(dLat / 2) * Math.sin(dLat / 2))
    + (Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2))
    * Math.sin(dLon / 2) * Math.sin(dLon / 2));
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d * 1000; // in meters
}

export default function (lat1, lng1, lat2, lng2) {
  return latLngDistance(lat1, lng1, lat2, lng2);
}
