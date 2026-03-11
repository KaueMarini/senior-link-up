
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  dosagem TEXT,
  frequencia TEXT NOT NULL DEFAULT 'diario',
  dias_semana TEXT[] DEFAULT '{}',
  horarios TEXT[] DEFAULT '{}',
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_inicio DATE DEFAULT CURRENT_DATE,
  data_fim DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their medications" ON public.medications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create medications" ON public.medications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their medications" ON public.medications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their medications" ON public.medications FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON public.medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
