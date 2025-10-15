// src/hooks/useGoogleMaps.ts
import { useEffect, useState } from 'react';

interface UseGoogleMapsResult {
  isLoaded: boolean;
  loadError: Error | null;
}

let isScriptLoaded = false;
let isScriptLoading = false;
let scriptLoadPromise: Promise<void> | null = null;

export const useGoogleMaps = (apiKey: string): UseGoogleMapsResult => {
  const [isLoaded, setIsLoaded] = useState(isScriptLoaded);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    // If already loaded, return immediately
    if (isScriptLoaded) {
      setIsLoaded(true);
      return;
    }

    // If currently loading, wait for existing promise
    if (isScriptLoading && scriptLoadPromise) {
      scriptLoadPromise
        .then(() => setIsLoaded(true))
        .catch((err) => setLoadError(err));
      return;
    }

    // Check if script already exists in DOM
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );

    if (existingScript) {
      // Script exists, wait for it to load
      if ((window as any).google?.maps?.places) {
        isScriptLoaded = true;
        setIsLoaded(true);
        return;
      }

      existingScript.addEventListener('load', () => {
        isScriptLoaded = true;
        setIsLoaded(true);
      });

      existingScript.addEventListener('error', () => {
        setLoadError(new Error('Failed to load Google Maps script'));
      });

      return;
    }

    // Load new script
    isScriptLoading = true;
    scriptLoadPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        isScriptLoaded = true;
        isScriptLoading = false;
        setIsLoaded(true);
        resolve();
      };

      script.onerror = () => {
        isScriptLoading = false;
        const error = new Error('Failed to load Google Maps script');
        setLoadError(error);
        reject(error);
      };

      document.head.appendChild(script);
    });
  }, [apiKey]);

  return { isLoaded, loadError };
};