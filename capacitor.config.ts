import type { CapacitorConfig } from "@capacitor/cli";

// The store apps ship the built website (dist/) inside the package and talk to the same backend.
const config: CapacitorConfig = {
  appId: "ca.flexs.app",
  appName: "FLEXS",
  webDir: "dist",
  backgroundColor: "#203b74",
  android: { allowMixedContent: false },
  ios: { contentInset: "never" },
};

export default config;
