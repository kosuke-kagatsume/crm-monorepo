'use client';
import { Button } from "@/components/ui/button";
import { useRagToggle } from "@/components/rag/useRagToggle";

export function RagToggle() {
  const { toggle } = useRagToggle(); // ページ側の同hookと共有前提
  return <Button variant="secondary" onClick={toggle}>RAGを開く</Button>;
}