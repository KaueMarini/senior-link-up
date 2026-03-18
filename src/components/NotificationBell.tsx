import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isToday, isTomorrow, differenceInMinutes, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NotificationItem {
  id: string;
  tipo: "remedio" | "exame" | "agendamento";
  titulo: string;
  descricao: string;
  dataHora: Date;
  urgente: boolean;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [animate, setAnimate] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    const now = new Date();
    const items: NotificationItem[] = [];

    // Fetch active medications with horarios for today
    const { data: meds } = await supabase
      .from("medications")
      .select("*")
      .eq("user_id", user.id)
      .eq("ativo", true);

    const diasMap = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
    const today = diasMap[now.getDay()];

    if (meds) {
      for (const med of meds) {
        const dias = med.dias_semana || [];
        if (dias.length > 0 && !dias.includes(today)) continue;

        const horarios = med.horarios || [];
        for (const horario of horarios) {
          const [h, m] = horario.split(":").map(Number);
          const medTime = new Date(now);
          medTime.setHours(h, m, 0, 0);

          const diffMin = differenceInMinutes(medTime, now);

          // Show if within -5 to +60 minutes (past 5 min or next hour)
          if (diffMin >= -5 && diffMin <= 60) {
            items.push({
              id: `med-${med.id}-${horario}`,
              tipo: "remedio",
              titulo: med.nome,
              descricao: `${med.dosagem || ""} às ${horario}`,
              dataHora: medTime,
              urgente: diffMin <= 5,
            });
          }
        }
      }
    }

    // Fetch today's and tomorrow's appointments
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(now);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 2);
    tomorrowEnd.setHours(0, 0, 0, 0);

    const { data: appointments } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", user.id)
      .gte("data_hora", todayStart.toISOString())
      .lt("data_hora", tomorrowEnd.toISOString())
      .eq("status", "agendado");

    if (appointments) {
      for (const apt of appointments) {
        const aptDate = parseISO(apt.data_hora);
        const diffMin = differenceInMinutes(aptDate, now);
        items.push({
          id: `apt-${apt.id}`,
          tipo: "agendamento",
          titulo: apt.titulo,
          descricao: `${apt.tipo} - ${format(aptDate, "dd/MM HH:mm")}`,
          dataHora: aptDate,
          urgente: diffMin >= -10 && diffMin <= 30,
        });
      }
    }

    // Fetch exams for today and tomorrow
    const todayStr = format(now, "yyyy-MM-dd");
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = format(tomorrow, "yyyy-MM-dd");

    const { data: exams } = await supabase
      .from("medical_exams")
      .select("*")
      .eq("user_id", user.id)
      .or(`data_exame.eq.${todayStr},data_exame.eq.${tomorrowStr}`);

    if (exams) {
      for (const exam of exams) {
        const examDate = exam.data_exame ? parseISO(exam.data_exame) : new Date();
        items.push({
          id: `exam-${exam.id}`,
          tipo: "exame",
          titulo: exam.nome,
          descricao: exam.data_exame
            ? isToday(examDate) ? "Hoje" : isTomorrow(examDate) ? "Amanhã" : format(examDate, "dd/MM")
            : "",
          dataHora: examDate,
          urgente: exam.data_exame ? isToday(examDate) : false,
        });
      }
    }

    // Sort by urgency then time
    items.sort((a, b) => {
      if (a.urgente !== b.urgente) return a.urgente ? -1 : 1;
      return a.dataHora.getTime() - b.dataHora.getTime();
    });

    setNotifications(items);

    // Animate bell if there are urgent notifications
    if (items.some((n) => n.urgente)) {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 3000);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // check every minute
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const urgentCount = notifications.filter((n) => n.urgente).length;

  const tipoIcon = (tipo: NotificationItem["tipo"]) => {
    switch (tipo) {
      case "remedio": return "💊";
      case "exame": return "🏥";
      case "agendamento": return "📅";
    }
  };

  const tipoColor = (tipo: NotificationItem["tipo"]) => {
    switch (tipo) {
      case "remedio": return "bg-blue-500/10 text-blue-600";
      case "exame": return "bg-green-500/10 text-green-600";
      case "agendamento": return "bg-orange-500/10 text-orange-600";
    }
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell
            className={`h-5 w-5 text-foreground transition-transform ${
              animate ? "animate-bell-ring" : ""
            }`}
          />
          {notifications.length > 0 && (
            <span
              className={`absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                urgentCount > 0 ? "bg-destructive animate-pulse" : "bg-primary"
              }`}
            >
              {notifications.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b px-4 py-3">
          <h3 className="font-heading font-bold text-foreground">Notificações</h3>
          <p className="text-xs text-muted-foreground">
            {notifications.length > 0
              ? `${notifications.length} lembrete(s) ativo(s)`
              : "Nenhum lembrete no momento"}
          </p>
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 ${
                    n.urgente ? "bg-destructive/5" : ""
                  }`}
                >
                  <span className={`mt-0.5 rounded-lg p-2 text-sm ${tipoColor(n.tipo)}`}>
                    {tipoIcon(n.tipo)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {n.titulo}
                    </p>
                    <p className="text-xs text-muted-foreground">{n.descricao}</p>
                    {n.urgente && (
                      <span className="mt-1 inline-block text-[10px] font-bold uppercase text-destructive">
                        ⚠ Agora
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8">
              <Bell className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Tudo tranquilo! 😊</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
