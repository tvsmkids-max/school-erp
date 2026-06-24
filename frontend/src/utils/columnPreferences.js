export const loadColumnPreferences = (storageKey, defaultColumns) => {
  const raw = localStorage.getItem(storageKey);

  if (!raw) {
    return defaultColumns;
  }

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    return defaultColumns;
  } catch (error) {
    return defaultColumns;
  }
};

export const saveColumnPreferences = (storageKey, columns) => {
  localStorage.setItem(storageKey, JSON.stringify(columns));
};