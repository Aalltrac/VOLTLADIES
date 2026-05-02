import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";
import Logo3D from "../components/three/Logo3D";
import SceneBackground from "../components/three/SceneBackground";
import { Mail, Lock, Chrome } from "lucide-react";

export default function Login() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const ensureUserDoc = async (user) => {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        email: user.email,
        pseudo: "",
        photoURL: user.photoURL || "",
        createdAt: serverTimestamp(),
      });
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let cred;
      if (mode === "signup") {
        cred = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        cred = await signInWithEmailAndPassword(auth, email, password);
      }
      await ensureUserDoc(cred.user);
      navigate("/app");
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await ensureUserDoc(cred.user);
      navigate("/app");
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 min-h-screen w-full flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10">
        <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 1.5]}>
          <SceneBackground />
          Logo3D position={[3.5, 0.2, 0]} scale={0.9} rotateSpeed={0.4} />
          <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
        </Canvas>
      </div>

      <div className="grid lg:grid-cols-2 gap-10 max-w-6xl w-full items-center">
        {/* Left: branding */}
        <div className="text-left fade-up">
          <div className="label-3d mb-3" data-testid="login-team-label">— Équipe Esport —</div>
          <h1 className="page-title text-5xl md:text-7xl leading-[0.95]">
            Volt<br />Ladies
          </h1>
          <p className="mt-6 text-pink-100/70 max-w-md font-body text-lg">
            Le hub privé de la team. Planning, disponibilités, Eva Pass, stratégie de map et discussions — tout au même endroit.
          </p>
          <div className="mt-8 flex gap-3">
            <span className="px-3 py-1 text-xs font-display tracking-widest uppercase border border-pink-500/40 text-pink-200">11 Maps</span>
            <span className="px-3 py-1 text-xs font-display tracking-widest uppercase border border-pink-500/40 text-pink-200">Temps Réel</span>
            <span className="px-3 py-1 text-xs font-display tracking-widest uppercase border border-pink-500/40 text-pink-200">3D</span>
          </div>
        </div>

        {/* Right: form */}
        <div className="glass p-8 md:p-10 rounded-md fade-up" data-testid="login-card">
          <div className="flex gap-2 mb-6">
            <button
              data-testid="login-tab-login"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-xs font-display tracking-widest uppercase transition ${
                mode === "login" ? "bg-pink-600/30 text-white border-b-2 border-pink-500" : "text-pink-300/60 hover:text-white"
              }`}
            >
              Connexion
            </button>
            <button
              data-testid="login-tab-signup"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-xs font-display tracking-widest uppercase transition ${
                mode === "signup" ? "bg-pink-600/30 text-white border-b-2 border-pink-500" : "text-pink-300/60 hover:text-white"
              }`}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="label-3d block mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400" />
                <input
                  data-testid="login-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="lady@volt.gg"
                />
              </div>
            </div>
            <div>
              <label className="label-3d block mb-2">Mot de passe</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400" />
                <input
                  data-testid="login-password-input"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div data-testid="login-error" className="text-sm text-rose-400 border border-rose-500/30 bg-rose-900/20 p-2 rounded">
                {error}
              </div>
            )}

            <button
              data-testid="login-submit-button"
              disabled={loading}
              type="submit"
              className="btn-neon w-full disabled:opacity-50"
            >
              {loading ? "..." : mode === "signup" ? "Créer le compte" : "Se connecter"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-pink-300/40 font-display tracking-widest uppercase">
            <span className="flex-1 h-px bg-pink-700/40" />
            ou
            <span className="flex-1 h-px bg-pink-700/40" />
          </div>

          <button
            data-testid="login-google-button"
            onClick={handleGoogle}
            disabled={loading}
            className="btn-ghost w-full disabled:opacity-50"
          >
            <Chrome size={16} /> Continuer avec Google
          </button>
        </div>
      </div>
    </div>
  );
}
