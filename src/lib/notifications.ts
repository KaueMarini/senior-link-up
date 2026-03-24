import { supabase } from "@/integrations/supabase/client";

type NotificationType = "remedio" | "exame" | "agendamento" | "lembrete_remedio";

interface NotificationPayload {
  telefone: string;
  tipo: NotificationType;
  mensagem: string;
}

const buildMessage = (tipo: NotificationType, detalhes: Record<string, string>): string => {
  switch (tipo) {
    case "remedio":
      return `💊 *Novo remédio cadastrado!*\n\nRemédio: ${detalhes.nome}\nDosagem: ${detalhes.dosagem || "Não informada"}\nFrequência: ${detalhes.frequencia || "Diário"}\nHorários: ${detalhes.horarios || "Não informados"}\n\n📋 Acesse o Fly Care para mais detalhes.`;

    case "lembrete_remedio":
      return `⏰ *Lembrete de remédio!*\n\nEstá quase na hora de tomar:\nRemédio: ${detalhes.nome}\nDosagem: ${detalhes.dosagem || ""}\nHorário: ${detalhes.horario}\n\n💊 Não se esqueça!`;

    case "exame":
      return `🏥 *Novo exame cadastrado!*\n\nExame: ${detalhes.nome}\nData: ${detalhes.data || "Não informada"}\nDescrição: ${detalhes.descricao || "Sem descrição"}\n\n📋 Acesse o Fly Care para mais detalhes.`;

    case "agendamento":
      return `📅 *Novo agendamento criado!*\n\nTítulo: ${detalhes.titulo}\nTipo: ${detalhes.tipo || "Consulta"}\nData/Hora: ${detalhes.data_hora}\nDescrição: ${detalhes.descricao || "Sem descrição"}\n\n📋 Acesse o Fly Care para mais detalhes.`;

    default:
      return `📢 Notificação do Fly Care: ${JSON.stringify(detalhes)}`;
  }
};

export const sendNotification = async (
  tipo: NotificationType,
  detalhes: Record<string, string>,
  telefone: string,
  email?: string
) => {
  if (!telefone) {
    console.warn("Notificação não enviada: telefone não cadastrado");
    return;
  }

  const mensagem = buildMessage(tipo, detalhes);

  try {
    const { data, error } = await supabase.functions.invoke("notify-webhook", {
      body: { telefone, mensagem, tipo, email: email || null },
    });

    if (error) {
      console.error("Erro ao enviar notificação:", error);
    } else {
      console.log("Notificação enviada:", data);
    }
  } catch (err) {
    console.error("Erro ao chamar edge function:", err);
  }
};

export { buildMessage };
export type { NotificationType };
