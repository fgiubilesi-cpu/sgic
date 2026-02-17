"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress"; // Assicurati che questo esista, sennò usa un div semplice
// Se non hai il componente Progress di shadcn, il codice sotto ha un fallback nativo (HTML standard)

type AuditStatsProps = {
  audit: {
    checklists: {
      items: {
        status: string | null;
      }[];
    }[];
  };
};

export function AuditStats({ audit }: AuditStatsProps) {
  // 1. Appiattiamo tutte le domande in un unico array per contarle
  const allItems = audit.checklists.flatMap((c) => c.items);
  const totalItems = allItems.length;

  if (totalItems === 0) return null;

  // 2. Calcoli Statistici
  const completedItems = allItems.filter((i) => i.status && i.status !== "pending").length;
  const compliantItems = allItems.filter((i) => i.status === "compliant").length;
  const nonCompliantItems = allItems.filter((i) => i.status === "non_compliant").length;

  // Percentuali
  const progressPercentage = Math.round((completedItems / totalItems) * 100);
  const complianceScore = completedItems > 0 
    ? Math.round((compliantItems / completedItems) * 100) 
    : 0;

  // Colore dinamico del punteggio
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* CARD 1: Avanzamento */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm font-medium text-muted-foreground mb-2">Avanzamento Audit</div>
          <div className="flex items-end justify-between mb-2">
            <span className="text-2xl font-bold">{progressPercentage}%</span>
            <span className="text-sm text-muted-foreground">{completedItems}/{totalItems} items</span>
          </div>
          {/* Barra di progresso (Fallback HTML nativo se manca Shadcn Progress) */}
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-500" 
              style={{ width: `${progressPercentage}%` }} 
            />
          </div>
        </CardContent>
      </Card>

      {/* CARD 2: Conformità (Score) */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm font-medium text-muted-foreground mb-2">Punteggio Conformità</div>
          <div className="flex items-end justify-between">
            <span className={`text-2xl font-bold ${getScoreColor(complianceScore)}`}>
              {complianceScore}%
            </span>
            <span className="text-sm text-muted-foreground">sui completati</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Basato sulle risposte fornite finora.
          </p>
        </CardContent>
      </Card>

      {/* CARD 3: Riepilogo Rapido */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm font-medium text-muted-foreground mb-4">Riepilogo</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Conforme
              </span>
              <span className="font-medium">{compliantItems}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Non Conforme
              </span>
              <span className="font-medium">{nonCompliantItems}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}