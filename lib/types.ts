export type View =
  | "all"
  | "favorites"
  | "recent"
  | "trash"
  | `folder:${string}`;
export type Folder = {
  id: string;
  name: string;
  icon: string;
  color: string;
  position?: number;
};
export type Note = {
  id: string;
  title: string;
  content: string;
  contentText: string;
  folderId: string | null;
  color?: string | null;
  favorite: boolean;
  pinned: boolean;
  deletedAt: string | null;
  updatedAt: string;
};
export const pastelColors = [
  { value: "", label: "Padrão" },
  { value: "#fef3c7", label: "Baunilha" },
  { value: "#fce7f3", label: "Rosa" },
  { value: "#dbeafe", label: "Azul" },
  { value: "#dcfce7", label: "Verde" },
  { value: "#f3e8ff", label: "Lilás" },
  { value: "#ffedd5", label: "Pêssego" },
] as const;
export const folderIcons = [
  { value: "📁", label: "Pasta" },
  { value: "📚", label: "Estudos" },
  { value: "💡", label: "Ideias" },
  { value: "🌿", label: "Pessoal" },
  { value: "💼", label: "Trabalho" },
  { value: "🎯", label: "Metas" },
  { value: "⭐", label: "Importante" },
  { value: "❤️", label: "Favoritos" },
  { value: "🎨", label: "Criativo" },
] as const;
