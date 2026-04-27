// Alias route for /teacher/:username → redirects to /t/:username (canonical teacher portfolio URL).
// The web app has both /t/:username and /teacher/:username pointing to TeacherPortfolioPage.

import { Redirect, useLocalSearchParams } from "expo-router";

export default function TeacherUsernameAlias() {
  const { username } = useLocalSearchParams<{ username: string }>();
  return <Redirect href={`/t/${username}`} />;
}
