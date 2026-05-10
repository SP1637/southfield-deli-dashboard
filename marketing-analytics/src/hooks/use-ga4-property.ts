import { useState, useEffect } from "react";

const STORAGE_KEY = "ga4_selected_property";

/**
 * Persists the selected GA4 property ID across all dashboard pages via localStorage.
 * Initialises from storage so the user never has to re-select after page navigation.
 */
export function useGA4Property() {
  const [propertyId, setPropertyId] = useState("");

  // Hydrate from localStorage on mount.
  // Only accept real numeric property IDs (6+ digits).
  // "oauth-connected" is a connection-badge marker, not a real property ID —
  // returning "" for it prevents a failed API call and red error banner.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) ?? "";
      if (/^\d{6,}$/.test(saved.trim())) setPropertyId(saved.trim());
    } catch {}
  }, []);

  function updateProperty(id: string) {
    setPropertyId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
      // Notify other components on the same page (storage event only fires cross-tab)
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: id }));
    } catch {}
  }

  return [propertyId, updateProperty] as const;
}
