
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cuidador_data jsonb;
BEGIN
  cuidador_data := NEW.raw_user_meta_data->'cuidador';

  INSERT INTO public.profiles (
    user_id, nome, perfil,
    cpf, telefone, cidade, estado,
    especialidade, experiencia, formacao,
    disponibilidade, bio
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'perfil', 'familiar'),
    COALESCE(cuidador_data->>'cpf', NULL),
    COALESCE(cuidador_data->>'telefone', NULL),
    COALESCE(cuidador_data->>'cidade', NULL),
    COALESCE(cuidador_data->>'estado', NULL),
    COALESCE(cuidador_data->>'especialidade', NULL),
    COALESCE(cuidador_data->>'anosExperiencia', NULL),
    COALESCE(cuidador_data->>'formacao', NULL),
    COALESCE(cuidador_data->>'disponibilidade', NULL),
    COALESCE(cuidador_data->>'sobre', NULL)
  );
  RETURN NEW;
END;
$function$;
