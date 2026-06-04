import { Redirect, type Href } from 'expo-router';

export default function LegacyInsightMapRedirect() {
  return <Redirect href={'/insight' as Href} />;
}
