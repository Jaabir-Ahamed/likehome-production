import { Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

interface Props {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: Props) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                Loading...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

