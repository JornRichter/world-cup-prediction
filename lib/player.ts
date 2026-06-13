export function getDisplayName(profile: any, user: any) {
  if (profile?.display_name) return profile.display_name;
  if (user?.email) return user.email.split("@")[0];
  return "Player";
}