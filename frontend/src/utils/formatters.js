export function readable(value) {
  return String(value)
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeCurrentUser(profileData) {
  if (profileData.user) {
    return {
      ...profileData.user,
      auth0Sub: profileData.user.auth0Sub || profileData.auth?.sub || null,
      email: profileData.user.email || profileData.auth?.email || null,
      displayName: profileData.user.displayName || profileData.auth?.name || null,
    };
  }

  return {
    auth0Sub: profileData.auth?.sub || null,
    email: profileData.auth?.email || null,
    displayName: profileData.auth?.name || null,
    role: null,
  };
}
