import { Tabs } from "expo-router";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.text }
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Levels" }} />
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="tutor" options={{ title: "AI Tutor" }} />
    </Tabs>
  );
}
