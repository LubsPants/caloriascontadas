import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Profile() {
  const { user, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    age: "",
    sex: "",
    weight: "",
    height: "",
    body_fat: "",
    muscle_mass: "",
    activity_level: "",
    goal: "",
    goal_period: "monthly",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile({
            name: data.name || "",
            age: data.age?.toString() || "",
            sex: data.sex || "",
            weight: data.weight?.toString() || "",
            height: data.height?.toString() || "",
            body_fat: data.body_fat?.toString() || "",
            muscle_mass: data.muscle_mass?.toString() || "",
            activity_level: data.activity_level || "",
            goal: data.goal || "",
            goal_period: data.goal_period || "monthly",
          });
        }
      });
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const calculateSuggestedKcal = () => {
    const w = parseFloat(profile.weight);
    const h = parseFloat(profile.height);
    const a = parseInt(profile.age);
    if (!w || !h || !a || !profile.sex) return null;

    // Mifflin-St Jeor
    let bmr = profile.sex === "male"
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161;

    const multipliers: Record<string, number> = {
      sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
    };

    bmr *= multipliers[profile.activity_level] || 1.2;

    if (profile.goal === "lose") bmr -= 500;
    if (profile.goal === "gain") bmr += 300;

    return Math.round(bmr);
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: profile.name || null,
        age: profile.age ? parseInt(profile.age) : null,
        sex: profile.sex || null,
        weight: profile.weight ? parseFloat(profile.weight) : null,
        height: profile.height ? parseFloat(profile.height) : null,
        body_fat: profile.body_fat ? parseFloat(profile.body_fat) : null,
        muscle_mass: profile.muscle_mass ? parseFloat(profile.muscle_mass) : null,
        activity_level: profile.activity_level || null,
        goal: profile.goal || null,
        goal_period: profile.goal_period || null,
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erro ao salvar perfil");
    } else {
      toast.success("Perfil salvo! 💪");

      const suggested = calculateSuggestedKcal();
      if (suggested) {
        await supabase.from("daily_targets").update({ kcal_target: suggested }).eq("user_id", user.id);
        toast.info(`Meta sugerida: ${suggested} kcal/dia`);
      }
    }
    setSaving(false);
  };

  const field = (label: string, key: keyof typeof profile, type = "text", placeholder = "") => (
    <div>
      <label className="text-sm font-medium text-foreground mb-1 block">{label}</label>
      <Input
        type={type}
        placeholder={placeholder}
        value={profile[key]}
        onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
        className="h-12 rounded-xl"
      />
    </div>
  );

  return (
    <div className="px-6 pt-12 pb-6">
      <h1 className="font-display text-2xl font-bold mb-6">Perfil 👤</h1>

      <div className="space-y-4">
        {field("Nome", "name", "text", "Seu nome")}

        <div className="grid grid-cols-2 gap-3">
          {field("Idade", "age", "number", "Ex: 28")}
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Sexo</label>
            <Select value={profile.sex} onValueChange={(v) => setProfile({ ...profile, sex: v })}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="female">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {field("Peso (kg)", "weight", "number", "Ex: 75")}
          {field("Altura (cm)", "height", "number", "Ex: 175")}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {field("Gordura (%)", "body_fat", "number", "Ex: 18")}
          {field("Massa musc. (kg)", "muscle_mass", "number", "Ex: 35")}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Nível de atividade</label>
          <Select value={profile.activity_level} onValueChange={(v) => setProfile({ ...profile, activity_level: v })}>
            <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sedentary">Sedentário</SelectItem>
              <SelectItem value="light">Leve (1-3x/sem)</SelectItem>
              <SelectItem value="moderate">Moderado (3-5x/sem)</SelectItem>
              <SelectItem value="active">Ativo (6-7x/sem)</SelectItem>
              <SelectItem value="very_active">Muito ativo (2x/dia)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Objetivo</label>
          <Select value={profile.goal} onValueChange={(v) => setProfile({ ...profile, goal: v })}>
            <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="lose">Perder peso</SelectItem>
              <SelectItem value="maintain">Manter peso</SelectItem>
              <SelectItem value="gain">Ganhar massa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {calculateSuggestedKcal() && (
          <div className="rounded-xl bg-calorie-bg p-4 border border-primary/20">
            <p className="text-sm text-foreground">
              💡 Meta sugerida: <strong className="font-display">{calculateSuggestedKcal()} kcal/dia</strong>
            </p>
          </div>
        )}

        <Button onClick={save} disabled={saving} className="w-full h-12 rounded-xl text-base font-semibold">
          {saving ? "Salvando..." : "Salvar perfil ✅"}
        </Button>
      </div>
    </div>
  );
}
