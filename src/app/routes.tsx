import { createHashRouter } from "react-router";
import { Root } from "./components/Root";
import { RequireAdmin } from "./components/RequireAdmin";
import { RequirePrimaryAdmin } from "./components/RequirePrimaryAdmin";

// Import critical components eagerly to avoid suspension issues
import { HomePage } from "./components/HomePage";
import { AdminLoginPage } from "./components/AdminLoginPage";

export const router = createHashRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        index: true,
        Component: HomePage
      },
      {
        path: "complex/:id",
        lazy: () => import("./components/DashboardPage").then(m => ({ Component: m.DashboardPage }))
      },
      {
        path: "dashboard",
        lazy: () => import("./components/DashboardSelectionPage").then(m => ({ Component: m.DashboardSelectionPage }))
      },
      {
        path: "dashboard/bundang-reconstruction",
        lazy: () => import("./components/DashboardPage").then(m => ({ Component: m.DashboardPage }))
      },
      {
        path: "dashboard/old-town-reconstruction",
        lazy: () => import("./components/DashboardPage").then(m => ({ Component: m.DashboardPage }))
      },
      {
        path: "dashboard/old-town-redevelopment",
        lazy: () => import("./components/DashboardPage").then(m => ({ Component: m.DashboardPage }))
      },
      {
        path: "dashboard/street-housing",
        lazy: () => import("./components/DashboardPage").then(m => ({ Component: m.DashboardPage }))
      },
      {
        path: "community",
        lazy: () => import("./components/CommunitySelectionPage").then(m => ({ Component: m.CommunitySelectionPage }))
      },
      {
        path: "community/bundang-reconstruction",
        lazy: () => import("./components/CommunityPage").then(m => ({ Component: m.CommunityPage }))
      },
      {
        path: "community/old-town-reconstruction",
        lazy: () => import("./components/CommunityPage").then(m => ({ Component: m.CommunityPage }))
      },
      {
        path: "community/old-town-redevelopment",
        lazy: () => import("./components/CommunityPage").then(m => ({ Component: m.CommunityPage }))
      },
      {
        path: "community/street-housing",
        lazy: () => import("./components/CommunityPage").then(m => ({ Component: m.CommunityPage }))
      },
      {
        path: "news",
        lazy: () => import("./components/NewsfeedPage").then(m => ({ Component: m.NewsfeedPage }))
      },
      {
        path: "guide",
        lazy: () => import("./components/GuidelinePage").then(m => ({ Component: m.GuidelinePage }))
      },
      {
        path: "settings",
        lazy: () => import("./components/SettingsPage").then(m => ({ Component: m.SettingsPage }))
      },
      {
        path: "profile",
        lazy: () => import("./components/ProfilePage").then(m => ({ Component: m.ProfilePage }))
      },
      {
        path: "lead-zone-guide",
        lazy: () => import("./components/LeadZoneGuidePage").then(m => ({ Component: m.LeadZoneGuidePage }))
      },
      {
        path: "progress-management",
        lazy: () => import("./components/ProgressManagementPage").then(m => ({ Component: m.ProgressManagementPage }))
      },
      {
        path: "timeline-management",
        lazy: () => import("./components/TimelineManagementPage").then(m => ({ Component: m.TimelineManagementPage }))
      },
      {
        path: "contribution-management",
        lazy: () => import("./components/ContributionManagementPage").then(m => ({ Component: m.ContributionManagementPage }))
      },
      {
        path: "poll-management",
        lazy: () => import("./components/PollManagementPage").then(m => ({ Component: m.PollManagementPage }))
      },
      {
        path: "school-management",
        lazy: () => import("./components/SchoolManagementPage").then(m => ({ Component: m.SchoolManagementPage }))
      },
      {
        path: "transport-management",
        lazy: () => import("./components/TransportManagementPage").then(m => ({ Component: m.TransportManagementPage }))
      },
      {
        path: "notes-management",
        lazy: () => import("./components/NotesManagementPage").then(m => ({ Component: m.NotesManagementPage }))
      },
      {
        path: "newsfeed-management",
        lazy: () => import("./components/NewsfeedManagementPage").then(m => ({ Component: m.NewsfeedManagementPage }))
      },
      {
        path: "analytics-management",
        lazy: () => import("./components/AnalyticsManagementPage").then(m => ({ Component: m.AnalyticsManagementPage }))
      },
      {
        path: "login-management",
        lazy: async () => {
          const { LoginManagementPage } = await import("./components/LoginManagementPage");
          return {
            Component: () => (
              <RequirePrimaryAdmin>
                <LoginManagementPage />
              </RequirePrimaryAdmin>
            )
          };
        }
      },
      {
        path: "complex-selection-management",
        lazy: () => import("./components/ComplexSelectionManagementPage").then(m => ({ Component: m.ComplexSelectionManagementPage }))
      },
      {
        path: "dashboard-selection-management",
        lazy: () => import("./components/DashboardSelectionManagementPage").then(m => ({ Component: m.DashboardSelectionManagementPage }))
      },
      {
        path: "image-management",
        lazy: () => import("./components/ImageManagementPage").then(m => ({ Component: m.ImageManagementPage }))
      },
      {
        path: "basic-info-management",
        lazy: () => import("./components/BasicInfoManagementPage").then(m => ({ Component: m.BasicInfoManagementPage }))
      },
      {
        path: "parking-management",
        lazy: () => import("./components/ParkingManagementPage").then(m => ({ Component: m.ParkingManagementPage }))
      },
      {
        path: "floors-management",
        lazy: () => import("./components/FloorsManagementPage").then(m => ({ Component: m.FloorsManagementPage }))
      },
      {
        path: "floor-area-ratio-management",
        lazy: () => import("./components/FloorAreaRatioManagementPage").then(m => ({ Component: m.FloorAreaRatioManagementPage }))
      },
      {
        path: "guide-management",
        lazy: () => import("./components/GuideManagementPage").then(m => ({ Component: m.GuideManagementPage }))
      },
      {
        path: "community-management",
        lazy: () => import("./components/CommunityManagementPage").then(m => ({ Component: m.CommunityManagementPage }))
      },
      {
        path: "security-logs",
        lazy: () => import("./components/SecurityLogsPage").then(m => ({ Component: m.SecurityLogsPage }))
      },
    ],
  },
  {
    path: "/admin/register",
    lazy: async () => {
      const { AdminRegisterPage } = await import("./components/AdminRegisterPage");
      return {
        Component: () => (
          <RequireAdmin>
            <AdminRegisterPage />
          </RequireAdmin>
        )
      };
    }
  },
  {
    path: "/admin/login",
    Component: AdminLoginPage
  },
  {
    path: "/auth/anyid/callback",
    lazy: () => import("./components/AnyIdCallbackPage").then(m => ({ Component: m.AnyIdCallbackPage }))
  },
]);