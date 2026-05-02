import { BrowserRouter, Routes, Route, Navigate } from \"react-router-dom\";
import \"./App.css\";
import { AuthProvider } from \"./contexts/AuthContext\";
import GlobalBackground from \"./components/three/GlobalBackground\";
import ProtectedRoute from \"./components/ProtectedRoute\";
import Layout from \"./components/Layout\";
import Login from \"./pages/Login\";
import ProfileSetup from \"./pages/ProfileSetup\";
import Home from \"./pages/Home\";
import Planning from \"./pages/Planning\";
import Disponibilite from \"./pages/Disponibilite\";
import EvaPass from \"./pages/EvaPass\";
import Discussion from \"./pages/Discussion\";
import Strategie from \"./pages/Strategie\";
import MapPage from \"./pages/MapPage\";

function App() {
  return (
    <div className=\"App\">
      <GlobalBackground />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path=\"/\" element={<Navigate to=\"/login\" replace />} />
            <Route path=\"/login\" element={<Login />} />
            <Route
              path=\"/profile-setup\"
              element={
                <ProtectedRoute requireProfile={false}>
                  <ProfileSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path=\"/app\"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Home />} />
              <Route path=\"planning\" element={<Planning />} />
              <Route path=\"disponibilite\" element={<Disponibilite />} />
              <Route path=\"eva-pass\" element={<EvaPass />} />
              <Route path=\"discussion\" element={<Discussion />} />
              <Route path=\"strategie\" element={<Strategie />} />
              <Route path=\"strategie/:mapSlug\" element={<MapPage />} />
            </Route>
            <Route path=\"*\" element={<Navigate to=\"/login\" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
