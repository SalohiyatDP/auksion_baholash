// Google "Encoded Polyline Algorithm" — nuqtalarni ([lat,lng]) siqilgan satrga kodlaydi.

function encodeValue(value: number): string {
  let v = value < 0 ? ~(value << 1) : value << 1;
  let output = "";
  while (v >= 0x20) {
    output += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }
  output += String.fromCharCode(v + 63);
  return output;
}

/** points: [[lat, lng], ...] */
export function encodePolyline(points: Array<[number, number]>): string {
  let lastLat = 0;
  let lastLng = 0;
  let result = "";
  for (const [lat, lng] of points) {
    const iLat = Math.round(lat * 1e5);
    const iLng = Math.round(lng * 1e5);
    result += encodeValue(iLat - lastLat);
    result += encodeValue(iLng - lastLng);
    lastLat = iLat;
    lastLng = iLng;
  }
  return result;
}
