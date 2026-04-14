import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";

// ─────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────

export interface FilterState {
  especialidades: string[];
  disponibilidade: string[];
  softSkills: string[];
  apenasVerificados: boolean;
  orderBy: "likes" | "match" | "nome";
  dependenteIdMatch?: string;
}

export const FILTER_DEFAULTS: FilterState = {
  especialidades: [],
  disponibilidade: [],
  softSkills: [],
  apenasVerificados: false,
  orderBy: "likes",
};

export const ESPECIALIDADES = [
  { key: "alzheimer",       label: "Alzheimer" },
  { key: "diabetes",        label: "Diabetes" },
  { key: "parkinson",       label: "Parkinson" },
  { key: "pos-operatorio",  label: "Pós-operatório" },
  { key: "medicamentos",    label: "Medicamentos" },
  { key: "acamado",         label: "Acamado" },
  { key: "demencia",        label: "Demência" },
];

export const DISPONIBILIDADES = [
  { key: "manha",       label: "Manhã" },
  { key: "tarde",       label: "Tarde" },
  { key: "noite",       label: "Noturno" },
  { key: "integral",    label: "Integral" },
  { key: "fins_semana", label: "Fins de semana" },
];

export const SOFT_SKILLS = [
  { key: "aceita_pets",  label: "Aceita pets" },
  { key: "nao_fumante",  label: "Não fumante" },
  { key: "possui_carro", label: "Possui carro" },
];

// ─────────────────────────────────────────────
// Keyword matchers (used here for chip display,
// actual filtering lives in BuscarCuidadores)
// ─────────────────────────────────────────────

export const ESPECIALIDADE_PATTERNS: Record<string, RegExp> = {
  alzheimer:      /alzheimer/i,
  diabetes:       /diabetes/i,
  parkinson:      /parkinson/i,
  "pos-operatorio": /p[oó]s[- ]?operat/i,
  medicamentos:   /medicament|injeç[aã]o/i,
  acamado:        /acamado/i,
  demencia:       /dem[eê]ncia/i,
};

export const SOFT_SKILL_PATTERNS: Record<string, RegExp> = {
  aceita_pets:  /aceita pet|com pet|gosta de animal|tem pet/i,
  nao_fumante:  /n[aã]o fum|sem cigarro|n[aã]o fumo/i,
  possui_carro: /tem carro|possui carro|carro pr[oó]prio/i,
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

interface SmartFilterProps {
  value: FilterState;
  onChange: (f: FilterState) => void;
  dependentes?: { id: string; nome: string }[];
}

const SmartFilter = ({ value, onChange, dependentes = [] }: SmartFilterProps) => {
  const [expanded, setExpanded] = useState(false);

  const activeCount =
    value.especialidades.length +
    value.disponibilidade.length +
    value.softSkills.length +
    (value.apenasVerificados ? 1 : 0);

  const toggle = <T extends string>(arr: T[], key: T): T[] =>
    arr.includes(key) ? arr.filter((k) => k !== key) : [...arr, key];

  const reset = () => onChange(FILTER_DEFAULTS);

  const ChipButton = ({
    active,
    onClick,
    label,
  }: {
    active: boolean;
    onClick: () => void;
    label: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 px-3 rounded-full text-sm font-medium border transition-all ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-transparent text-foreground border-border/60 hover:border-primary/50 hover:bg-primary/5"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      {/* Control row */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant={expanded ? "default" : "outline"}
          size="sm"
          className="h-9 gap-2 rounded-xl"
          onClick={() => setExpanded(!expanded)}
        >
          <Filter className="h-4 w-4" />
          Filtros
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="h-5 px-1.5 text-xs ml-0.5 bg-primary-foreground/20 text-primary-foreground"
            >
              {activeCount}
            </Badge>
          )}
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </Button>

        {/* Ordenação */}
        <Select
          value={value.orderBy}
          onValueChange={(v) =>
            onChange({ ...value, orderBy: v as FilterState["orderBy"] })
          }
        >
          <SelectTrigger className="h-9 w-44 rounded-xl text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="likes">Mais curtidos</SelectItem>
            <SelectItem value="nome">Nome (A–Z)</SelectItem>
            <SelectItem value="match">⭐ Melhor Match</SelectItem>
          </SelectContent>
        </Select>

        {/* Idoso para match */}
        {value.orderBy === "match" && dependentes.length > 0 && (
          <Select
            value={value.dependenteIdMatch ?? ""}
            onValueChange={(v) =>
              onChange({ ...value, dependenteIdMatch: v || undefined })
            }
          >
            <SelectTrigger className="h-9 w-52 rounded-xl text-sm">
              <SelectValue placeholder="Comparar com idoso…" />
            </SelectTrigger>
            <SelectContent>
              {dependentes.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1 text-muted-foreground rounded-xl"
            onClick={reset}
          >
            <X className="h-3.5 w-3.5" /> Limpar filtros
          </Button>
        )}
      </div>

      {/* Active chips (collapsed summary) */}
      {activeCount > 0 && !expanded && (
        <div className="flex gap-1.5 flex-wrap">
          {value.especialidades.map((k) => {
            const label = ESPECIALIDADES.find((e) => e.key === k)?.label ?? k;
            return (
              <Badge
                key={k}
                variant="secondary"
                className="gap-1 pr-1 cursor-pointer hover:bg-destructive/10"
                onClick={() =>
                  onChange({
                    ...value,
                    especialidades: value.especialidades.filter((e) => e !== k),
                  })
                }
              >
                {label} <X className="h-3 w-3" />
              </Badge>
            );
          })}
          {value.disponibilidade.map((k) => {
            const label = DISPONIBILIDADES.find((e) => e.key === k)?.label ?? k;
            return (
              <Badge
                key={k}
                variant="secondary"
                className="gap-1 pr-1 cursor-pointer hover:bg-destructive/10"
                onClick={() =>
                  onChange({
                    ...value,
                    disponibilidade: value.disponibilidade.filter((e) => e !== k),
                  })
                }
              >
                {label} <X className="h-3 w-3" />
              </Badge>
            );
          })}
          {value.softSkills.map((k) => {
            const label = SOFT_SKILLS.find((e) => e.key === k)?.label ?? k;
            return (
              <Badge
                key={k}
                variant="secondary"
                className="gap-1 pr-1 cursor-pointer hover:bg-destructive/10"
                onClick={() =>
                  onChange({
                    ...value,
                    softSkills: value.softSkills.filter((e) => e !== k),
                  })
                }
              >
                {label} <X className="h-3 w-3" />
              </Badge>
            );
          })}
          {value.apenasVerificados && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer hover:bg-destructive/10"
              onClick={() => onChange({ ...value, apenasVerificados: false })}
            >
              Verificados <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      )}

      {/* Expanded panel */}
      {expanded && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Especializações */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Especializações
            </p>
            <div className="flex flex-wrap gap-2">
              {ESPECIALIDADES.map(({ key, label }) => (
                <ChipButton
                  key={key}
                  label={label}
                  active={value.especialidades.includes(key)}
                  onClick={() =>
                    onChange({
                      ...value,
                      especialidades: toggle(value.especialidades, key),
                    })
                  }
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* Disponibilidade */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Disponibilidade / Turno
            </p>
            <div className="flex flex-wrap gap-2">
              {DISPONIBILIDADES.map(({ key, label }) => (
                <ChipButton
                  key={key}
                  label={label}
                  active={value.disponibilidade.includes(key)}
                  onClick={() =>
                    onChange({
                      ...value,
                      disponibilidade: toggle(value.disponibilidade, key),
                    })
                  }
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* Preferências / Soft Skills */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Preferências
            </p>
            <div className="flex flex-wrap gap-2">
              {SOFT_SKILLS.map(({ key, label }) => (
                <ChipButton
                  key={key}
                  label={label}
                  active={value.softSkills.includes(key)}
                  onClick={() =>
                    onChange({
                      ...value,
                      softSkills: toggle(value.softSkills, key),
                    })
                  }
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* Apenas verificados */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="verificados-switch" className="text-sm font-medium">
                Apenas verificados
              </Label>
              <p className="text-xs text-muted-foreground">
                Cuidadores com identidade confirmada
              </p>
            </div>
            <Switch
              id="verificados-switch"
              checked={value.apenasVerificados}
              onCheckedChange={(v) =>
                onChange({ ...value, apenasVerificados: v })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartFilter;
