const STORAGE_KEY = "hoa_nightmares_frontend_admin_queues_v1";

export const FRONTEND_MANAGED_QUEUES = ["contact", "advocate", "moderation"];

export function isLocalQueueMirrorEnabled() {
  return (
    import.meta.env.DEV ||
    import.meta.env.VITE_ENABLE_LOCAL_ADMIN_QUEUE === "true"
  );
}

function canUseStorage() {
  return typeof window !== "undefined" && isLocalQueueMirrorEnabled();
}

function readStore() {
  if (!canUseStorage()) return {};

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage is a convenience mirror only; failed writes should not block forms.
  }
}

function createLocalKey(queue) {
  const suffix =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `local-${queue}-${suffix}`;
}

export function getLocalQueueRecords(queue) {
  const records = readStore()[queue];
  return Array.isArray(records) ? records : [];
}

export function upsertLocalQueueRecord(queue, record) {
  const store = readStore();
  const records = Array.isArray(store[queue]) ? store[queue] : [];
  const localKey = record.localKey || record.id || createLocalKey(queue);
  const normalized = {
    ...record,
    id: localKey,
    localKey,
    localOnly: true,
    status: record.status || "new",
    created_at: record.created_at || record.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const index = records.findIndex((item) => item.localKey === localKey);

  store[queue] =
    index >= 0
      ? records.map((item, itemIndex) =>
          itemIndex === index ? { ...item, ...normalized } : item,
        )
      : [normalized, ...records];

  writeStore(store);
  return normalized;
}

export function addLocalQueueRecord(queue, record) {
  if (!canUseStorage()) return null;
  return upsertLocalQueueRecord(queue, record);
}

export function removeLocalQueueRecord(queue, record) {
  const store = readStore();
  const records = Array.isArray(store[queue]) ? store[queue] : [];
  const localKey = record.localKey || record.id;
  store[queue] = records.filter((item) => item.localKey !== localKey);
  writeStore(store);
}

export function isFrontendManagedQueue(queue) {
  return FRONTEND_MANAGED_QUEUES.includes(queue);
}
