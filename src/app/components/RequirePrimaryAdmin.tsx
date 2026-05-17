import { Navigate } from "react-router";
import { useUser } from "../contexts/UserContext";

export function RequirePrimaryAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoggedIn } = useUser();

  if (!isLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  if (user?.role !== "admin" || user?.isPrimaryAdmin !== true) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}