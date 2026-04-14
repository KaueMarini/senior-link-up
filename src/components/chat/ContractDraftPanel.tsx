import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Download,
  CheckCircle,
  Clock,
  DollarSign,
  ListTodo,
  Shield,
  Calendar,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import type { ContractDraft } from "@/hooks/useChatAI";

// ─────────────────────────────────────────────
// PDF generation — no external dependency,
// uses the browser's native print dialog.
// ─────────────────────────────────────────────

function openContractPDF(
  draft: ContractDraft,
  otherUserName: string,
  myName: string
) {
  const today = new Date().toLocaleDateString("pt-BR");

  const tagList = (items: string[]) =>
    items.length > 0
      ? items.map((i) => `<span class="tag">${i}</span>`).join(" ")
      : '<span class="empty">A definir em conversa</span>';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Pré-Contrato FlyCare — ${today}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 760px; margin: 40px auto; padding: 0 24px; color: #1a1a1a; font-size: 14px; line-height: 1.6; }
    h1  { color: #2d7d5e; font-size: 22px; border-bottom: 2px solid #2d7d5e; padding-bottom: 8px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 12px; margin-bottom: 24px; }
    h2  { color: #444; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; margin: 20px 0 6px; }
    .field { background: #f7faf9; border: 1px solid #d4e8df; border-radius: 6px; padding: 10px 14px; min-height: 36px; }
    .field.filled { background: #edf7f3; border-color: #56b68e; font-weight: 600; color: #1b5e42; }
    .tag { display: inline-block; background: #e0f2eb; color: #1b5e42; padding: 2px 10px; border-radius: 99px; margin: 2px; font-size: 12px; }
    .empty { color: #999; font-style: italic; font-size: 12px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 64px; }
    .sig { text-align: center; width: 220px; }
    .sig-line { border-top: 1px solid #555; margin-bottom: 6px; }
    .footer { margin-top: 40px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
    @media print {
      body { margin: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>📋 Pré-Contrato de Prestação de Serviços</h1>
  <p class="subtitle">Gerado pelo FlyCare em ${today} · Partes: <strong>${myName}</strong> e <strong>${otherUserName}</strong></p>

  <h2>💰 Remuneração acordada</h2>
  <div class="field ${draft.valorAcordado ? "filled" : ""}">${draft.valorAcordado ?? '<span class="empty">A definir</span>'}</div>

  <h2>🕐 Horários de trabalho</h2>
  <div class="field ${draft.horarios ? "filled" : ""}">${draft.horarios ?? '<span class="empty">A definir</span>'}</div>

  <h2>📅 Período / Frequência</h2>
  <div class="field ${draft.periodo ? "filled" : ""}">${draft.periodo ?? '<span class="empty">A definir</span>'}</div>

  <h2>✅ Tarefas inclusas</h2>
  <div class="field">${tagList(draft.tarefas)}</div>

  <h2>📌 Regras da casa</h2>
  <div class="field">${tagList(draft.regras)}</div>

  <div class="signatures">
    <div class="sig">
      <div class="sig-line"></div>
      <strong>${myName}</strong><br/><span style="font-size:11px;color:#888">Assinatura</span>
    </div>
    <div class="sig">
      <div class="sig-line"></div>
      <strong>${otherUserName}</strong><br/><span style="font-size:11px;color:#888">Assinatura</span>
    </div>
  </div>

  <p class="footer">
    Este documento é um pré-contrato informal gerado pelo FlyCare para auxiliar no alinhamento entre as partes.<br/>
    Recomendamos a formalização com um contrato profissional assinado por ambas as partes.
  </p>

  <script>window.addEventListener('load', () => window.print());</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// ─────────────────────────────────────────────
// Stage / Sentiment helpers
// ─────────────────────────────────────────────

const STAGE_LABEL: Record<string, string> = {
  inicio:      "Início",
  negociacao:  "Negociação",
  acordo:      "Acordo",
  finalizado:  "Fechado",
};

const STAGE_CLASS: Record<string, string> = {
  inicio:     "bg-slate-100 text-slate-600",
  negociacao: "bg-blue-100 text-blue-700",
  acordo:     "bg-amber-100 text-amber-700",
  finalizado: "bg-green-100 text-green-700",
};

const SENTIMENT_DOT: Record<string, string> = {
  positivo: "bg-green-500",
  neutro:   "bg-slate-400",
  tenso:    "bg-red-500",
};

const SENTIMENT_LABEL: Record<string, string> = {
  positivo: "Tom positivo",
  neutro:   "Tom neutro",
  tenso:    "Tom tenso",
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const EMPTY = "Aguardando no chat...";

interface ContractDraftPanelProps {
  draft: ContractDraft;
  completionScore: number;
  otherUserName: string;
  myName: string;
  conversationStage?: string;
  sentiment?: string;
  discussedTopics?: string[];
  className?: string;
}

const ContractDraftPanel = ({
  draft,
  completionScore,
  otherUserName,
  myName,
  conversationStage = "inicio",
  sentiment = "neutro",
  discussedTopics = [],
  className = "",
}: ContractDraftPanelProps) => {
  const isReady = completionScore >= 50;

  return (
    <Card className={`flex flex-col w-64 shrink-0 overflow-hidden ${className}`}>
      {/* Header */}
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-heading flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Draft de Contrato
        </CardTitle>

        {/* Stage + Sentiment row */}
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STAGE_CLASS[conversationStage] ?? STAGE_CLASS.inicio}`}
          >
            {STAGE_LABEL[conversationStage] ?? conversationStage}
          </span>
          <div className="flex items-center gap-1 ml-auto">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${SENTIMENT_DOT[sentiment] ?? SENTIMENT_DOT.neutro}`}
            />
            <span className="text-[10px] text-muted-foreground">
              {SENTIMENT_LABEL[sentiment] ?? sentiment}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${completionScore}%` }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {completionScore}%
          </span>
        </div>
      </CardHeader>

      {/* Fields */}
      <CardContent className="flex-1 overflow-y-auto px-4 pb-3 space-y-3 text-sm">
        {/* Valor */}
        <div>
          <FieldLabel icon={<DollarSign className="h-3.5 w-3.5" />} label="Valor Acordado" filled={!!draft.valorAcordado} />
          <FieldValue value={draft.valorAcordado} filled={!!draft.valorAcordado} />
        </div>

        <Separator />

        {/* Horários */}
        <div>
          <FieldLabel icon={<Clock className="h-3.5 w-3.5" />} label="Horários" filled={!!draft.horarios} />
          <FieldValue value={draft.horarios} filled={!!draft.horarios} />
        </div>

        {/* Período (only when extracted) */}
        {draft.periodo && (
          <>
            <Separator />
            <div>
              <FieldLabel icon={<Calendar className="h-3.5 w-3.5" />} label="Período" filled />
              <FieldValue value={draft.periodo} filled />
            </div>
          </>
        )}

        <Separator />

        {/* Tarefas */}
        <div>
          <FieldLabel
            icon={<ListTodo className="h-3.5 w-3.5" />}
            label="Tarefas Inclusas"
            filled={draft.tarefas.length > 0}
          />
          {draft.tarefas.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {draft.tarefas.map((t) => (
                <Badge key={t} variant="secondary" className="text-[11px] font-normal">
                  {t}
                </Badge>
              ))}
            </div>
          ) : (
            <FieldValue value={undefined} filled={false} />
          )}
        </div>

        {/* Regras (only when extracted) */}
        {draft.regras.length > 0 && (
          <>
            <Separator />
            <div>
              <FieldLabel icon={<Shield className="h-3.5 w-3.5" />} label="Regras da Casa" filled />
              <div className="flex flex-wrap gap-1 mt-1">
                {draft.regras.map((r) => (
                  <Badge key={r} variant="outline" className="text-[11px] font-normal">
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Tópicos discutidos */}
        {discussedTopics.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Tópicos Discutidos
                </span>
                <TrendingUp className="h-3 w-3 text-green-500 ml-auto" />
              </div>
              <div className="flex flex-wrap gap-1">
                {discussedTopics.map((t) => (
                  <Badge
                    key={t}
                    className="text-[10px] font-normal bg-primary/10 text-primary border-0 hover:bg-primary/20"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Footer */}
      <div className="border-t p-3 space-y-1.5">
        <Button
          className="w-full gap-2"
          size="sm"
          variant={isReady ? "default" : "outline"}
          onClick={() => openContractPDF(draft, otherUserName, myName)}
        >
          <Download className="h-3.5 w-3.5" />
          Gerar PDF
        </Button>
        {!isReady && (
          <p className="text-[11px] text-muted-foreground text-center leading-tight">
            Continue a conversa para completar o draft
          </p>
        )}
      </div>
    </Card>
  );
};

// ─── Sub-components ─────────────────────────

function FieldLabel({
  icon,
  label,
  filled,
}: {
  icon: React.ReactNode;
  label: string;
  filled: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-1">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      {filled && <CheckCircle className="h-3 w-3 text-green-500 ml-auto" />}
    </div>
  );
}

function FieldValue({ value, filled }: { value?: string; filled: boolean }) {
  return (
    <p
      className={`text-[12px] px-2 py-1.5 rounded-md leading-snug ${
        filled
          ? "bg-green-50 text-green-800 font-medium"
          : "bg-muted text-muted-foreground italic"
      }`}
    >
      {value ?? EMPTY}
    </p>
  );
}

export default ContractDraftPanel;
