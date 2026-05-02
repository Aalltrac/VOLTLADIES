import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children, requireProfile = true }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="font-display text-pink-300 tracking-[0.3em] uppercase animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requireProfile && (!profile || !profile.pseudo)) return <Navigate to="/profile-setup" replace />;
  return children;
}
