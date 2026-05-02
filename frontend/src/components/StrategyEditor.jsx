import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote, Link as LinkIcon,
  Image as ImageIcon, Youtube as YoutubeIcon, Table as TableIcon, Undo2, Redo2,
  AlignLeft, AlignCenter, AlignRight, Save,
} from "lucide-react";

function ToolButton({ active, onClick, children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded transition border ${
        active
          ? "bg-pink-600/40 border-pink-500 text-white"
          : "border-pink-800/40 text-pink-200/80 hover:bg-pink-900/30 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export default function StrategyEditor({ value, onChange, onSave, saving }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener", target: "_blank" } }),
      Image,
      Youtube.configure({ controls: true, nocookie: true, modestBranding: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // sync external value changes (e.g., from firestore)
  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  const addImage = () => {
    const url = prompt("URL de l'image :");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };
  const addYoutube = () => {
    const url = prompt("URL YouTube :");
    if (url) editor.chain().focus().setYoutubeVideo({ src: url, width: 640, height: 360 }).run();
  };
  const addLink = () => {
    const url = prompt("URL du lien :");
    if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };
  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="glass rounded-md overflow-hidden" data-testid="strategy-editor">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-pink-800/40 bg-black/40">
        <ToolButton title="Annuler" onClick={() => editor.chain().focus().undo().run()}><Undo2 size={14} /></ToolButton>
        <ToolButton title="Rétablir" onClick={() => editor.chain().focus().redo().run()}><Redo2 size={14} /></ToolButton>
        <span className="w-px bg-pink-800/40 mx-1" />
        <ToolButton title="Titre 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={14} /></ToolButton>
        <ToolButton title="Titre 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={14} /></ToolButton>
        <ToolButton title="Titre 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={14} /></ToolButton>
        <span className="w-px bg-pink-800/40 mx-1" />
        <ToolButton title="Gras" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={14} /></ToolButton>
        <ToolButton title="Italique" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={14} /></ToolButton>
        <ToolButton title="Souligner" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={14} /></ToolButton>
        <ToolButton title="Barrer" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={14} /></ToolButton>
        <ToolButton title="Surligner" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}><Highlighter size={14} /></ToolButton>
        <span className="w-px bg-pink-800/40 mx-1" />
        <ToolButton title="Aligner à gauche" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft size={14} /></ToolButton>
        <ToolButton title="Centrer" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter size={14} /></ToolButton>
        <ToolButton title="Aligner à droite" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight size={14} /></ToolButton>
        <span className="w-px bg-pink-800/40 mx-1" />
        <ToolButton title="Liste" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={14} /></ToolButton>
        <ToolButton title="Liste numérotée" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={14} /></ToolButton>
        <ToolButton title="Citation" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={14} /></ToolButton>
        <span className="w-px bg-pink-800/40 mx-1" />
        <ToolButton title="Lien" active={editor.isActive("link")} onClick={addLink}><LinkIcon size={14} /></ToolButton>
        <ToolButton title="Image" onClick={addImage}><ImageIcon size={14} /></ToolButton>
        <ToolButton title="Vidéo YouTube" onClick={addYoutube}><YoutubeIcon size={14} /></ToolButton>
        <ToolButton title="Tableau" onClick={addTable}><TableIcon size={14} /></ToolButton>
        <div className="ml-auto">
          <button
            data-testid="strategy-save-button"
            onClick={onSave}
            disabled={saving}
            className="btn-neon !py-1.5 !px-3 text-xs disabled:opacity-50"
          >
            <Save size={14} /> {saving ? "..." : "Enregistrer"}
          </button>
        </div>
      </div>

      <EditorContent editor={editor} className="bg-black/30" />
    </div>
  );
}
