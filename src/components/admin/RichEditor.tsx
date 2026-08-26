"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Color } from "@tiptap/extension-color";
import { TextStyle, FontSize, FontFamily, LineHeight } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Tiktok } from "./tiktok-node";
import { Indent } from "./indent";
import { useRef, useState, useCallback, useEffect, memo } from "react";

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
}

// --- Shared sub-components ---

const Btn = ({
  onClick, active, disabled, children, title,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean;
  children: React.ReactNode; title: string;
}) => (
  <button
    type="button" onClick={onClick} disabled={disabled} title={title}
    onMouseDown={(e) => e.preventDefault()}
    className={`p-1.5 rounded-md text-sm transition-colors ${
      active
        ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
    } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />;

const Dropdown = ({
  name, label, menuWidth, open, onToggle, children,
}: {
  name: string; label: React.ReactNode; menuWidth?: string;
  open: string | null; onToggle: (n: string) => void; children: React.ReactNode;
}) => (
  <div className="relative">
    <button type="button" onClick={() => onToggle(name)}
      onMouseDown={(e) => e.preventDefault()}
      className="flex items-center gap-1 px-1.5 py-1 text-sm rounded-md transition-colors text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
      {label}
    </button>
    {open === name && (
      <div className={`absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 ${menuWidth || ""}`}>
        {children}
      </div>
    )}
  </div>
);

const DropdownItem = ({
  active, onClick, children, style,
}: {
  active?: boolean; onClick: () => void; children: React.ReactNode; style?: React.CSSProperties;
}) => (
  <button type="button" onClick={onClick} style={style}
    onMouseDown={(e) => e.preventDefault()}
    className={`w-full flex items-center px-3 py-1.5 text-sm text-left transition-colors ${
      active
        ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
        : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
    }`}>
    {children}
  </button>
);

const Chevron = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// --- SVG icons ---

const Icon = {
  bold: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>,
  italic: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>,
  underline: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>,
  strike: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4H9a3 3 0 0 0-3 3v0a3 3 0 0 0 3 3h6"/><line x1="4" y1="12" x2="20" y2="12"/><path d="M15 12a3 3 0 0 1 0 6H8"/></svg>,
  code: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  highlight: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" fill="currentColor" opacity="0.3"/></svg>,
  alignLeft: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>,
  alignCenter: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>,
  alignRight: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>,
  alignJustify: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  link: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  image: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>,
  video: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  hr: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/></svg>,
  clear: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 10L3 3l7 14 2-6 6-2-6-2z"/><line x1="3" y1="3" x2="21" y2="21"/></svg>,
  undo: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>,
  redo: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  quote: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.166 11 15c0 1.933-1.567 3.5-3.5 3.5-1.193 0-2.31-.566-2.917-1.179z"/></svg>,
  codeBlock: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10l3 3-3 3"/><line x1="14" y1="16" x2="17" y2="16"/></svg>,
  table: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>,
  bulletList: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle cx="4" cy="5" r="2" fill="currentColor" stroke="none"/>
      <line x1="9" y1="5" x2="21" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="4" cy="12" r="2" fill="currentColor" stroke="none"/>
      <line x1="9" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="4" cy="19" r="2" fill="currentColor" stroke="none"/>
      <line x1="9" y1="19" x2="21" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  orderedList: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <text x="4" y="7.5" fontSize="8" fontWeight="700" fill="currentColor" stroke="none" fontFamily="sans-serif" textAnchor="middle">1</text>
      <line x1="9" y1="5" x2="21" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <text x="4" y="14.5" fontSize="8" fontWeight="700" fill="currentColor" stroke="none" fontFamily="sans-serif" textAnchor="middle">2</text>
      <line x1="9" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <text x="4" y="21.5" fontSize="8" fontWeight="700" fill="currentColor" stroke="none" fontFamily="sans-serif" textAnchor="middle">3</text>
      <line x1="9" y1="19" x2="21" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  taskList: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <rect x="1" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="2"/>
      <path d="M2.5 5L4 6.5L6.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="9" y1="5" x2="21" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="2"/>
      <line x1="9" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="1" y="16" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="2"/>
      <line x1="9" y1="19" x2="21" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  indent: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="11 8 15 12 11 16"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="16" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>,
  outdent: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="13 8 9 12 13 16"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>,
  addRowAbove: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="6" width="18" height="12" rx="2"/><line x1="12" y1="3" x2="12" y2="6"/><polyline points="10 4.5 12 2 14 4.5"/></svg>,
  addRowBelow: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="6" width="18" height="12" rx="2"/><line x1="12" y1="18" x2="12" y2="21"/><polyline points="10 19.5 12 22 14 19.5"/></svg>,
  addColLeft: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="6" y="3" width="12" height="18" rx="2"/><line x1="3" y1="12" x2="6" y2="12"/><polyline points="4.5 10 2 12 4.5 14"/></svg>,
  addColRight: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="6" y="3" width="12" height="18" rx="2"/><line x1="18" y1="12" x2="21" y2="12"/><polyline points="19.5 10 22 12 19.5 14"/></svg>,
  deleteRow: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="9" y1="8" x2="15" y2="16" strokeWidth="2.5"/><line x1="15" y1="8" x2="9" y2="16" strokeWidth="2.5"/></svg>,
  deleteCol: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="8" y1="8" x2="16" y2="16" strokeWidth="2.5"/><line x1="16" y1="8" x2="8" y2="16" strokeWidth="2.5"/></svg>,
  deleteTable: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15" strokeWidth="2.5"/><line x1="15" y1="9" x2="9" y2="15" strokeWidth="2.5"/></svg>,
};

// --- Config data ---

const HEADING_OPTIONS = [
  { level: 0 as const, label: "Paragraph", tag: "P" },
  { level: 1 as const, label: "Heading 1", tag: "H1" },
  { level: 2 as const, label: "Heading 2", tag: "H2" },
  { level: 3 as const, label: "Heading 3", tag: "H3" },
  { level: 4 as const, label: "Heading 4", tag: "H4" },
  { level: 5 as const, label: "Heading 5", tag: "H5" },
  { level: 6 as const, label: "Heading 6", tag: "H6" },
];

const FONT_SIZES = [
  { value: "", label: "Mặc định" },
  { value: "12px", label: "12px — Nhỏ" },
  { value: "14px", label: "14px — Bình thường" },
  { value: "16px", label: "16px — Vừa" },
  { value: "18px", label: "18px — Lớn" },
  { value: "20px", label: "20px" },
  { value: "24px", label: "24px — Tiêu đề nhỏ" },
  { value: "30px", label: "30px" },
  { value: "36px", label: "36px — Tiêu đề lớn" },
];

const FONT_FAMILIES = [
  { value: "", label: "Mặc định (Inter)" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Times New Roman, serif", label: "Times New Roman" },
  { value: "Courier New, monospace", label: "Courier New" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "Tahoma, sans-serif", label: "Tahoma" },
];

const LINE_HEIGHTS = [
  { value: "", label: "Mặc định" },
  { value: "1.0", label: "1.0 — Hẹp" },
  { value: "1.25", label: "1.25" },
  { value: "1.5", label: "1.5 — Bình thường" },
  { value: "1.75", label: "1.75" },
  { value: "2.0", label: "2.0 — Rộng" },
  { value: "2.5", label: "2.5" },
  { value: "3.0", label: "3.0 — Rất rộng" },
];

const TEXT_COLORS = [
  { color: "", label: "Mặc định" },
  { color: "#ef4444", label: "Đỏ" },
  { color: "#f97316", label: "Cam" },
  { color: "#eab308", label: "Vàng" },
  { color: "#22c55e", label: "Xanh lá" },
  { color: "#3b82f6", label: "Xanh dương" },
  { color: "#8b5cf6", label: "Tím" },
  { color: "#ec4899", label: "Hồng" },
  { color: "#6b7280", label: "Xám" },
  { color: "#78350f", label: "Nâu" },
  { color: "#0f766e", label: "Teal" },
];

const ALIGN_OPTIONS = [
  { align: "left" as const, icon: Icon.alignLeft, title: "Căn trái" },
  { align: "center" as const, icon: Icon.alignCenter, title: "Căn giữa" },
  { align: "right" as const, icon: Icon.alignRight, title: "Căn phải" },
  { align: "justify" as const, icon: Icon.alignJustify, title: "Căn đều" },
];

// --- Component ---

const EDITOR_PROPS = {
  attributes: {
    class: "prose prose-lg max-w-none focus:outline-none min-h-[400px] px-4 py-3 dark:prose-invert prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 dark:prose-headings:text-white dark:prose-p:text-gray-300 dark:prose-a:text-blue-400",
  },
};

function RichEditorInner({ content, onChange }: RichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [openDrop, setOpenDrop] = useState<string | null>(null);
  const [showTableGrid, setShowTableGrid] = useState(false);
  const [tableGridHover, setTableGridHover] = useState({ rows: 0, cols: 0 });
  const [toolbarKey, setToolbarKey] = useState(0);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const tableGridRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  useEffect(() => {
    if (!openDrop && !showTableGrid) return;
    const handleClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenDrop(null);
        setShowTableGrid(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openDrop, showTableGrid]);

  const rafRef = useRef(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-blue-600 underline dark:text-blue-400" } }),
      Placeholder.configure({ placeholder: "Bắt đầu viết nội dung..." }),
      Youtube.configure({ width: 640, height: 360, nocookie: true }),
      Tiktok, Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow, TableCell, TableHeader,
      Subscript, Superscript,
      TextStyle, FontSize, FontFamily, LineHeight, Color, Typography,
      TaskList, TaskItem.configure({ nested: true }),
      Indent,
    ],
    content,
    onTransaction: () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setToolbarKey((k) => k + 1);
      });
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setToolbarKey((k) => k + 1);
        onChangeRef.current(html);
      });
    },
    editorProps: EDITOR_PROPS,
  });

  const uploadImage = useCallback(async (file: File) => {
    if (!editor) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) editor.chain().focus().setImage({ src: data.url }).blur().run();
    } catch { /* silent */ }
  }, [editor]);

  const addLink = () => {
    if (!editor || !linkUrl.trim()) return;
    if (linkText.trim()) {
      editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).blur().run();
    } else {
      editor.chain().focus().setLink({ href: linkUrl }).blur().run();
    }
    setLinkUrl(""); setLinkText(""); setShowLinkInput(false);
  };

  const addVideo = () => {
    if (!editor || !videoUrl.trim()) return;
    const url = videoUrl.trim();
    if (url.includes("tiktok.com")) {
      editor.chain().focus().setTiktok({ src: url }).blur().run();
    } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
      editor.chain().focus().setYoutubeVideo({ src: url }).blur().run();
    }
    setVideoUrl(""); setShowVideoInput(false);
  };

  const headingLevel = (): number => {
    if (!editor) return 0;
    for (let i = 1; i <= 6; i++) { if (editor.isActive("heading", { level: i })) return i; }
    return 0;
  };

  const toggle = (n: string) => setOpenDrop(openDrop === n ? null : n);

  const mark = (name: string, attrs?: Record<string, unknown>) => editor!.chain().focus().setMark(name, attrs).run();
  const unsetMark = (name: string) => editor!.chain().focus().unsetMark(name).run();
  const isMark = (name: string) => editor!.isActive(name);
  const cmd = () => editor!.chain().focus();

  if (!editor) return null;

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
      <div ref={toolbarRef} className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">

        {/* --- Heading --- */}
        <div className="relative">
          <button type="button" onClick={() => toggle("heading")}
            onMouseDown={(e) => e.preventDefault()}
            className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors min-w-[70px]">
            <span className="text-xs font-bold">{headingLevel() > 0 ? `H${headingLevel()}` : "P"}</span>
            <Chevron />
          </button>
          {openDrop === "heading" && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
              {HEADING_OPTIONS.map((o) => (
                <DropdownItem key={o.level}
                  active={o.level === 0 ? headingLevel() === 0 : editor.isActive("heading", { level: o.level })}
                  onClick={() => {
                    if (o.level === 0) cmd().setParagraph().run();
                    else cmd().toggleHeading({ level: o.level as 1|2|3|4|5|6 }).run();
                    setOpenDrop(null);
                  }}>
                  <span className={`font-bold ${o.level === 0 ? "text-sm" : o.level <= 2 ? o.level === 1 ? "text-xl" : "text-lg" : "text-xs"}`}>{o.tag}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{o.label}</span>
                </DropdownItem>
              ))}
            </div>
          )}
        </div>

        <Divider />

        {/* --- Font size --- */}
        <Dropdown name="fontSize" label={<><span className="text-xs">Aa</span><Chevron /></>} open={openDrop} onToggle={toggle} menuWidth="w-48">
          {FONT_SIZES.map((fs) => (
            <DropdownItem key={fs.value} onClick={() => { if (fs.value) mark("textStyle", { fontSize: fs.value }); else unsetMark("textStyle"); setOpenDrop(null); }}>
              {fs.label}
            </DropdownItem>
          ))}
        </Dropdown>

        {/* --- Font family --- */}
        <Dropdown name="fontFamily" label={<><span className="text-xs font-serif">Aa</span><Chevron /></>} open={openDrop} onToggle={toggle} menuWidth="w-52">
          {FONT_FAMILIES.map((ff) => (
            <DropdownItem key={ff.value} onClick={() => { if (ff.value) mark("textStyle", { fontFamily: ff.value }); else unsetMark("textStyle"); setOpenDrop(null); }}
              style={{ fontFamily: ff.value || "inherit" }}>
              {ff.label}
            </DropdownItem>
          ))}
        </Dropdown>

        {/* --- Line height --- */}
        <Dropdown name="lineHeight" label={<>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          <Chevron />
        </>} open={openDrop} onToggle={toggle} menuWidth="w-44">
          {LINE_HEIGHTS.map((lh) => (
            <DropdownItem key={lh.value} onClick={() => { if (lh.value) mark("textStyle", { lineHeight: lh.value }); else unsetMark("textStyle"); setOpenDrop(null); }}>
              {lh.label}
            </DropdownItem>
          ))}
        </Dropdown>

        <Divider />

        <Btn onClick={() => cmd().toggleBold().run()} active={isMark("bold")} title="Đậm (Ctrl+B)">{Icon.bold}</Btn>
        <Btn onClick={() => cmd().toggleItalic().run()} active={isMark("italic")} title="Nghiêng (Ctrl+I)">{Icon.italic}</Btn>
        <Btn onClick={() => cmd().toggleUnderline().run()} active={isMark("underline")} title="Gạch chân (Ctrl+U)">{Icon.underline}</Btn>
        <Btn onClick={() => cmd().toggleStrike().run()} active={isMark("strike")} title="Gạch ngang">{Icon.strike}</Btn>
        <Btn onClick={() => cmd().toggleCode().run()} active={isMark("code")} title="Code inline">{Icon.code}</Btn>
        <Btn onClick={() => cmd().toggleHighlight().run()} active={isMark("highlight")} title="Highlight">{Icon.highlight}</Btn>
        <Btn onClick={() => cmd().toggleSubscript().run()} active={isMark("subscript")} title="Chữ nhỏ dưới (x₂)"><span className="text-xs font-bold">X<sub>2</sub></span></Btn>
        <Btn onClick={() => cmd().toggleSuperscript().run()} active={isMark("superscript")} title="Chữ nhỏ trên (x²)"><span className="text-xs font-bold">X<sup>2</sup></span></Btn>

        <Divider />

        {/* --- Color --- */}
        <Dropdown name="color" label={<><span className="font-bold">A</span><div className="w-4 h-1 rounded-full bg-current" /></>} open={openDrop} onToggle={toggle} menuWidth="w-40">
          {TEXT_COLORS.map((tc) => (
            <DropdownItem key={tc.color || "default"} onClick={() => { if (tc.color) editor.chain().focus().setColor(tc.color).run(); else editor.chain().focus().unsetColor().run(); setOpenDrop(null); }}>
              <span className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600 shrink-0 mr-2" style={{ backgroundColor: tc.color || "#e5e7eb" }} />
              {tc.label}
            </DropdownItem>
          ))}
        </Dropdown>

        <Divider />

        {/* --- Lists --- */}
        <Btn onClick={() => cmd().toggleBulletList().run()} active={isMark("bulletList")} title="Danh sách">{Icon.bulletList}</Btn>
        <Btn onClick={() => cmd().toggleOrderedList().run()} active={isMark("orderedList")} title="Danh sách đánh số">{Icon.orderedList}</Btn>
        <Btn onClick={() => cmd().toggleTaskList().run()} active={isMark("taskList")} title="Danh sách công việc">{Icon.taskList}</Btn>
        <Btn onClick={() => cmd().toggleBlockquote().run()} active={isMark("blockquote")} title="Trích dẫn">{Icon.quote}</Btn>
        <Btn onClick={() => cmd().toggleCodeBlock().run()} active={isMark("codeBlock")} title="Code block">{Icon.codeBlock}</Btn>

        <Divider />

        {/* --- Indent / Outdent --- */}
        <Btn onClick={() => cmd().indent().run()} title="Thụt lề (Tab)">{Icon.indent}</Btn>
        <Btn onClick={() => cmd().outdent().run()} title="Lùi lề (Shift+Tab)">{Icon.outdent}</Btn>

        <Divider />

        {/* --- Table --- */}
        <div className="relative">
          <Btn onClick={() => { setShowTableGrid(!showTableGrid); setOpenDrop(null); }} active={showTableGrid} title="Chèn bảng">{Icon.table}</Btn>
          {showTableGrid && (
            <div ref={tableGridRef} className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">
                {tableGridHover.rows > 0 && tableGridHover.cols > 0
                  ? `${tableGridHover.rows} × ${tableGridHover.cols}`
                  : "Chọn kích thước bảng"}
              </div>
              <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(8, 1fr)` }}>
                {Array.from({ length: 8 }, (_, row) =>
                  Array.from({ length: 8 }, (_, col) => {
                    const isActive = row < tableGridHover.rows && col < tableGridHover.cols;
                    return (
                      <div
                        key={`${row}-${col}`}
                        className={`w-5 h-5 rounded-sm border transition-colors cursor-pointer ${
                          isActive
                            ? "bg-blue-500 border-blue-600"
                            : "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-blue-400"
                        }`}
                        onMouseEnter={() => setTableGridHover({ rows: row + 1, cols: col + 1 })}
                        onClick={() => {
                           cmd().insertTable({ rows: row + 1, cols: col + 1, withHeaderRow: true }).run();
                          setShowTableGrid(false);
                          setTableGridHover({ rows: 0, cols: 0 });
                        }}
                      />
                    );
                  })
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    cmd().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                    setShowTableGrid(false);
                    setTableGridHover({ rows: 0, cols: 0 });
                  }}
                  className="w-full text-xs text-center py-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 rounded-md transition-colors"
                >
                  Bảng mặc định (3×3)
                </button>
              </div>
            </div>
          )}
        </div>

        <Divider />

        {/* --- Alignment --- */}
        {ALIGN_OPTIONS.map((a) => (
          <Btn key={a.align} onClick={() => cmd().setTextAlign(a.align).run()} active={editor.isActive({ textAlign: a.align })} title={a.title}>
            {a.icon}
          </Btn>
        ))}

        <Divider />

        {/* --- Link / Image / Video / HR / Clear --- */}
        <Btn onClick={() => {
          if (editor.isActive("link")) { cmd().unsetLink().run(); }
          else { setLinkText(editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, "")); setShowLinkInput(!showLinkInput); setShowVideoInput(false); }
        }} active={isMark("link")} title="Chèn link">{Icon.link}</Btn>
        <Btn onClick={() => fileInputRef.current?.click()} title="Chèn ảnh">{Icon.image}</Btn>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await uploadImage(f); e.target.value = ""; }} />
        <Btn onClick={() => { setShowVideoInput(!showVideoInput); setShowLinkInput(false); }} title="Chèn video">{Icon.video}</Btn>
        <Btn onClick={() => cmd().setHorizontalRule().run()} title="Đường kẻ ngang">{Icon.hr}</Btn>
        <Btn onClick={() => cmd().clearNodes().unsetAllMarks().run()} title="Xóa format">{Icon.clear}</Btn>

        {/* --- Undo/Redo --- */}
        <div className="ml-auto flex items-center gap-0.5">
          <Btn onClick={() => cmd().undo().run()} disabled={!editor.can().undo()} title="Hoàn tác (Ctrl+Z)">{Icon.undo}</Btn>
          <Btn onClick={() => cmd().redo().run()} disabled={!editor.can().redo()} title="Làm lại (Ctrl+Y)">{Icon.redo}</Btn>
        </div>
      </div>

      {/* --- Table Context Toolbar --- */}
      {toolbarKey >= 0 && editor?.isActive("table") && (
        <div className="flex items-center gap-0.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border-b border-emerald-200 dark:border-emerald-500/20">
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mr-2">Bảng</span>
          <Divider />
          <Btn onClick={() => cmd().addColumnAfter().run()} title="Thêm cột phải">{Icon.addColRight}</Btn>
          <Btn onClick={() => cmd().addColumnBefore().run()} title="Thêm cột trái">{Icon.addColLeft}</Btn>
          <Btn onClick={() => cmd().addRowAfter().run()} title="Thêm hàng dưới">{Icon.addRowBelow}</Btn>
          <Btn onClick={() => cmd().addRowBefore().run()} title="Thêm hàng trên">{Icon.addRowAbove}</Btn>
          <Divider />
          <Btn onClick={() => cmd().deleteColumn().run()} title="Xóa cột">{Icon.deleteCol}</Btn>
          <Btn onClick={() => cmd().deleteRow().run()} title="Xóa hàng">{Icon.deleteRow}</Btn>
          <Divider />
          <Btn onClick={() => cmd().deleteTable().run()} title="Xóa bảng">
            <span className="flex items-center gap-1 text-red-500 dark:text-red-400">
              {Icon.deleteTable}
              <span className="text-xs">Xóa bảng</span>
            </span>
          </Btn>
        </div>
      )}

      {/* --- Link input --- */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-500/10 border-b border-blue-200 dark:border-blue-500/20">
          <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
            className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="URL: https://..." autoFocus />
          <input type="text" value={linkText} onChange={(e) => setLinkText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
            className="w-48 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Text hiển thị (tùy chọn)" />
          <button onClick={addLink} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Thêm</button>
          <button onClick={() => { setShowLinkInput(false); setLinkUrl(""); setLinkText(""); }} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Hủy</button>
        </div>
      )}

      {/* --- Video input --- */}
      {showVideoInput && (
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-500/10 border-b border-purple-200 dark:border-purple-500/20">
          <span className="text-xs text-purple-600 dark:text-purple-400 shrink-0">🎬</span>
          <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVideo())}
            className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            placeholder="Dán link YouTube hoặc TikTok..." autoFocus />
          <button onClick={addVideo} className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700">Chèn</button>
          <button onClick={() => { setShowVideoInput(false); setVideoUrl(""); }} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Hủy</button>
        </div>
      )}

      <div className="max-h-[70vh] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

const RichEditor = memo(RichEditorInner);
export default RichEditor;
