
-- Mediated chat messages (used by the AI-mediated chat)
CREATE TABLE IF NOT EXISTS public.mediated_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  author_role TEXT NOT NULL CHECK (author_role IN ('responsavel','cuidador','ai')),
  visible_to_role TEXT NOT NULL CHECK (visible_to_role IN ('responsavel','cuidador','both')),
  message_kind TEXT NOT NULL DEFAULT 'message',
  content TEXT NOT NULL,
  owner_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mediated_chat_conv ON public.mediated_chat_messages(conversation_id, created_at);

ALTER TABLE public.mediated_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view mediated messages"
ON public.mediated_chat_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = conversation_id
      AND (c.responsavel_id = auth.uid() OR c.cuidador_id = auth.uid())
  )
);

CREATE POLICY "Participants insert mediated messages"
ON public.mediated_chat_messages FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = conversation_id
      AND (c.responsavel_id = auth.uid() OR c.cuidador_id = auth.uid())
  )
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.mediated_chat_messages;

-- Proposals between responsavel and cuidador
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  responsavel_id UUID NOT NULL,
  cuidador_id UUID NOT NULL,
  valor TEXT,
  horarios TEXT,
  periodo TEXT,
  tarefas TEXT[] NOT NULL DEFAULT '{}',
  regras TEXT[] NOT NULL DEFAULT '{}',
  mensagem TEXT,
  responsavel_accepted BOOLEAN NOT NULL DEFAULT true,
  cuidador_accepted BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposals_conv ON public.proposals(conversation_id);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view proposals"
ON public.proposals FOR SELECT TO authenticated
USING (auth.uid() = responsavel_id OR auth.uid() = cuidador_id);

CREATE POLICY "Responsavel creates proposals"
ON public.proposals FOR INSERT TO authenticated
WITH CHECK (auth.uid() = responsavel_id);

CREATE POLICY "Participants update proposals"
ON public.proposals FOR UPDATE TO authenticated
USING (auth.uid() = responsavel_id OR auth.uid() = cuidador_id)
WITH CHECK (auth.uid() = responsavel_id OR auth.uid() = cuidador_id);

CREATE TRIGGER trg_proposals_updated_at
BEFORE UPDATE ON public.proposals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.proposals;
