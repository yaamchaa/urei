// App v2.3.0 - 성능 최적화 (2026.04.22)
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { UserProvider } from "./contexts/UserContext";
import { ProgressProvider } from "./contexts/ProgressContext";
import { TimelineProvider } from "./contexts/TimelineContext";
import { ContributionProvider } from "./contexts/ContributionContext";
import { SmsAuthProvider } from "./contexts/SmsAuthContext";
import { HelmetProvider } from "react-helmet-async";
import { AriaLiveRegion } from "./components/AriaLiveRegion";
import "./utils/suppressRadixWarnings";

export default function App() {
  return (
    <HelmetProvider>
      <SmsAuthProvider>
        <UserProvider>
          <ProgressProvider>
            <ContributionProvider>
              <TimelineProvider>
                <div lang="ko">
                  <RouterProvider router={router} />
                  <Toaster />
                  <AriaLiveRegion />
                </div>
              </TimelineProvider>
            </ContributionProvider>
          </ProgressProvider>
        </UserProvider>
      </SmsAuthProvider>
    </HelmetProvider>
  );
}
