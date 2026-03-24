import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WEBHOOK_URL = "https://webhook.saveautomatik.shop/webhook/flyCare";

serve(async (_req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();

    // Calculate 30 minutes from now
    const reminderTime = new Date(now.getTime() + 30 * 60 * 1000);
    const reminderHour = reminderTime.getHours().toString().padStart(2, "0");
    const reminderMinute = reminderTime.getMinutes().toString().padStart(2, "0");
    const targetTime = `${reminderHour}:${reminderMinute}`;

    const diasMap = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
    const today = diasMap[now.getDay()];

    // Fetch active medications that have this time in their horarios
    const { data: medications, error } = await supabase
      .from("medications")
      .select("*")
      .eq("ativo", true)
      .contains("horarios", [targetTime]);

    if (error) {
      console.error("Error fetching medications:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    let sent = 0;
    for (const med of medications || []) {
      const dias = med.dias_semana || [];
      if (dias.length > 0 && !dias.includes(today)) continue;

      // Fetch user profile and auth email
      const { data: profile } = await supabase
        .from("profiles")
        .select("telefone, user_id")
        .eq("user_id", med.user_id)
        .single();

      const telefone = profile?.telefone;
      if (!telefone) continue;

      // Get user email from auth
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(med.user_id);

      const mensagem = `⏰ *Lembrete de remédio!*\n\nEstá quase na hora de tomar:\nRemédio: ${med.nome}\nDosagem: ${med.dosagem || "Não informada"}\nHorário: ${targetTime}\n\n💊 Não se esqueça!`;

      try {
        await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            telefone,
            mensagem,
            tipo: "lembrete_remedio",
            timestamp: now.toISOString(),
          }),
        });
        sent++;
      } catch (e) {
        console.error(`Failed to send reminder for medication ${med.id}:`, e);
      }
    }

    console.log(`Medication reminders sent: ${sent}`);
    return new Response(JSON.stringify({ success: true, sent }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in medication-reminders:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
