import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { Camera, User, Sparkles } from "lucide-react";

export default function ProfileSetup() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [pseudo, setPseudo] = useState(profile?.pseudo || "");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(profile?.photoURL || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 700_000) {
      setError("Image trop lourde, max 700 KB");
      return;
    }
    setError("");
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      let photoURL = profile?.photoURL || "";
      if (photoFile) {
        photoURL = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(photoFile);
        });
      }
      await updateDoc(doc(db, "users", user.uid), {
        pseudo: pseudo.trim(),
        photoURL,
        updatedAt: serverTimestamp(),
      });
      navigate("/app");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
      <div className="glass p-8 md:p-12 max-w-lg w-full rounded-md fade-up" data-testid="profile-setup-card">
        <div className="flex items-center gap-2 text-pink-400 mb-2">
          <Sparkles size={16} />
          <span className="label-3d">Bienvenue dans la team</span>
        </div>
        <h1 className="page-title text-3xl md:text-4xl mb-6">Configure ton profil</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center">
            <label
              htmlFor="photo"
              className="relative cursor-pointer group"
              data-testid="profile-photo-label"
            >
              <div className="w-28 h-28 rounded-full border-2 border-pink-500/60 overflow-hidden bg-pink-900/30 flex items-center justify-center shadow-[0_0_30px_rgba(255,45,117,0.5)] transition group-hover:shadow-[0_0_50px_rgba(255,45,117,0.8)]">
                {photoPreview ? (
                  <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <User size={42} className="text-pink-300" />
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-pink-600 flex items-center justify-center border-2 border-black">
                <Camera size={16} className="text-white" />
              </div>
              <input
                data-testid="profile-photo-input"
                id="photo"
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
            </label>
            <span className="text-xs text-pink-300/60 mt-3 font-body">Clique pour changer ta photo (max 700 KB)</span>
          </div>

          <div>
            <label className="label-3d block mb-2">Pseudo</label>
            <input
              data-testid="profile-pseudo-input"
              type="text"
              required
              minLength={2}
              maxLength={24}
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              className="input-field"
              placeholder="VoltGirl"
            />
          </div>

          {error && (
            <div data-testid="profile-error" className="text-sm text-rose-400 border border-rose-500/30 bg-rose-900/20 p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !pseudo.trim()}
            data-testid="profile-save-button"
            className="btn-neon w-full disabled:opacity-50"
          >
            {loading ? "Enregistrement..." : "Entrer dans le hub"}
          </button>
        </form>
      </div>
    </div>
  );
}
