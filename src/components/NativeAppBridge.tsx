import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { App as NativeApp } from "@capacitor/app";
import { inAppPathFromUrl, isNativeApp } from "@/lib/platform";

/** Store-app only: route verified flexs.ca links into the app and make the Android back button behave. */
export default function NativeAppBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNativeApp()) return;
    document.documentElement.classList.add("native-app");
    const opened = NativeApp.addListener("appUrlOpen", ({ url }) => {
      const path = inAppPathFromUrl(url);
      if (path) navigate(path);
    });
    const back = NativeApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else void NativeApp.exitApp();
    });
    return () => {
      void opened.then(handle => handle.remove());
      void back.then(handle => handle.remove());
    };
  }, [navigate]);

  return null;
}
