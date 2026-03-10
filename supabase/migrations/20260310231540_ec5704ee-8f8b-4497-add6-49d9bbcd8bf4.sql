-- Fix RLS policies to be PERMISSIVE (drop restrictive ones and recreate)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Video tips are viewable by everyone" ON public.video_tips;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Video tips are viewable by everyone" ON public.video_tips FOR SELECT USING (true);

-- Favorites table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cuidador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, cuidador_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Reviews / likes / messages about caregivers
CREATE TABLE public.caregiver_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cuidador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'like' CHECK (tipo IN ('like', 'dislike')),
  mensagem TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, cuidador_id)
);

ALTER TABLE public.caregiver_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone" ON public.caregiver_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.caregiver_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their reviews" ON public.caregiver_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their reviews" ON public.caregiver_reviews FOR DELETE USING (auth.uid() = user_id);

-- Appointments / smart scheduling
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cuidador_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'consulta' CHECK (tipo IN ('consulta', 'exame', 'retorno', 'outro')),
  status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'concluido')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their appointments" ON public.appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their appointments" ON public.appointments FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Medical exams
CREATE TABLE public.medical_exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  arquivo_url TEXT,
  data_exame DATE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their exams" ON public.medical_exams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload exams" ON public.medical_exams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their exams" ON public.medical_exams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their exams" ON public.medical_exams FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for medical exams
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-exams', 'medical-exams', false);

CREATE POLICY "Users can view their own exams" ON storage.objects FOR SELECT USING (bucket_id = 'medical-exams' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload their own exams" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'medical-exams' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own exams" ON storage.objects FOR DELETE USING (bucket_id = 'medical-exams' AND auth.uid()::text = (storage.foldername(name))[1]);