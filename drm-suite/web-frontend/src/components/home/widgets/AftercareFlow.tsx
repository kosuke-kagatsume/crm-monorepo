'use client';
import { Card } from "@/components/ui/card"; // 既存shadcn/ui想定。なければdivでOK

export function AftercareFlow() {
  return (
    <Card className="p-4">
      <div className="text-sm text-muted-foreground">AftercareFlow</div>
      <div className="text-xl font-semibold">（役職別の中身は後で差し替え）</div>
    </Card>
  );
}