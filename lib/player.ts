export function getPreferredDisplayName(profile: { display_name?: string | null } | null, email?: string | null) {
  if (profile?.display_name && profile.display_name.trim()) {
    return profile.display_name.trim();
  }

  if (email) {
    return email.split("@")[0];
  }

  return "Player";
}