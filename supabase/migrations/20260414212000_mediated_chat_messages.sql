CREATE TABLE public.mediated_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  author_role text NOT NULL CHECK (author_role IN ('responsavel', 'cuidador', 'ai')),
  owner_user_id uuid,
  visible_to_role text NOT NULL CHECK (visible_to_role IN ('responsavel', 'cuidador', 'both')),
  message_kind text NOT NULL DEFAULT 'message' CHECK (message_kind IN ('message', 'summary', 'question', 'system')),
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mediated_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view mediated messages for their role"
ON public.mediated_chat_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    WHERE c.id = conversation_id
      AND (
        (c.responsavel_id = auth.uid() AND visible_to_role IN ('responsavel', 'both'))
        OR
        (c.cuidador_id = auth.uid() AND visible_to_role IN ('cuidador', 'both'))
      )
  )
);

CREATE POLICY "Participants can send private messages to the AI"
ON public.mediated_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  author_role <> 'ai'
  AND owner_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    WHERE c.id = conversation_id
      AND (
        (c.responsavel_id = auth.uid() AND author_role = 'responsavel' AND visible_to_role = 'responsavel')
        OR
        (c.cuidador_id = auth.uid() AND author_role = 'cuidador' AND visible_to_role = 'cuidador')
      )
  )
);

CREATE POLICY "Participants can insert AI bridge messages in their own conversations"
ON public.mediated_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  author_role = 'ai'
  AND EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    WHERE c.id = conversation_id
      AND (c.responsavel_id = auth.uid() OR c.cuidador_id = auth.uid())
  )
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.mediated_chat_messages;

CREATE INDEX mediated_chat_messages_conversation_created_idx
  ON public.mediated_chat_messages (conversation_id, created_at);
