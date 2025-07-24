import { Redirect } from 'expo-router'

/**
 * Index route that redirects to the tabs
 */
export default function Index() {
  return <Redirect href="/(tabs)/record" />
}
