import { Stack } from "expo-router";

// A Stack is the navigator: each screen is pushed on top of the previous one,
// and Android's back gesture pops it off again. This app has one screen;
// everything else opens over it.
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "My day" }} />
    </Stack>
  );
}
