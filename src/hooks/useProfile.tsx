import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles"> & { banner_url?: string | null };

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    setProfile(data as Profile | null);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { data: null, error: "Não autenticado" };
    const { data, error } = await supabase
      .from("profiles")
      .update(updates as any)
      .eq("user_id", user.id)
      .select()
      .single();
    if (!error && data) setProfile(data as Profile);
    return { data, error };
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { url: null, error: "Não autenticado" };
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (error) return { url: null, error: error.message };
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${urlData.publicUrl}?t=${Date.now()}`;
    await updateProfile({ avatar_url: url });
    return { url, error: null };
  };

  const uploadBanner = async (file: File) => {
    if (!user) return { url: null, error: "Não autenticado" };
    const ext = file.name.split(".").pop();
    const path = `${user.id}/banner.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (error) return { url: null, error: error.message };
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${urlData.publicUrl}?t=${Date.now()}`;
    await updateProfile({ banner_url: url } as any);
    return { url, error: null };
  };

  return { profile, loading, updateProfile, uploadAvatar, uploadBanner, refetch: fetchProfile };
};
