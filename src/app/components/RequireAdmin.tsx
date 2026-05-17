import { Navigate } from "react-router";
import { useUser } from "../contexts/UserContext";

export function RequireAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoggedIn } = useUser();

  if (!isLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
