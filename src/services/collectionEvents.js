const COLLECTION_CHANGE_EVENT = "studio:collection-change";

/** Notify subscribers after a collection or session write in the current tab. */
export function publishCollectionChange(key) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(COLLECTION_CHANGE_EVENT, { detail: { key } }));
}

/** Subscribe to same-tab writes and cross-tab storage changes, including clear(). */
export function subscribeToCollections(keys, listener) {
  if (typeof window === "undefined") return () => {};
  const watchedKeys = new Set(keys);
  function handleStorage(event) {
    if (event.storageArea && event.storageArea !== localStorage) return;
    if (event.key === null || watchedKeys.has(event.key)) listener(event);
  }
  function handleCollectionChange(event) {
    if (watchedKeys.has(event.detail?.key)) listener(event);
  }
  window.addEventListener("storage", handleStorage);
  window.addEventListener(COLLECTION_CHANGE_EVENT, handleCollectionChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(COLLECTION_CHANGE_EVENT, handleCollectionChange);
  };
}
