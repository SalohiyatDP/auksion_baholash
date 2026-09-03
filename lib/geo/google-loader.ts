// Google Maps JavaScript API ni bir marta yuklash uchun yordamchi.

/* eslint-disable @typescript-eslint/no-explicit-any */

let promise: Promise<any> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("Faqat brauzerda"));
  const w = window as any;
  if (w.google && w.google.maps) return Promise.resolve(w.google);
  if (promise) return promise;

  promise = new Promise((resolve, reject) => {
    const cbName = "__ya_gmaps_cb";
    w[cbName] = () => resolve(w.google);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=${cbName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Google Maps yuklab bo'lmadi"));
    document.head.appendChild(script);
  });
  return promise;
}
