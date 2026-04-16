
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export function ProtectedLayout() {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                Loading...
            </div>
        );
    }

    if (!user) {
        sessionStorage.setItem('loginRedirect', location.pathname + location.search);
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
