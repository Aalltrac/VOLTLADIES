import ChatRoom from "../components/ChatRoom";

export default function Discussion() {
  return (
    <div className="max-w-5xl mx-auto" data-testid="discussion-page">
      <div className="mb-6">
        <div className="label-3d mb-1">— Salon de la team —</div>
        <h1 className="page-title text-4xl md:text-5xl">Discussion</h1>
      </div>
      <ChatRoom roomId="general" title="# General" subtitle="Salon principal de l'équipe" />
    </div>
  );
}
