import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const [kcalTarget, setKcalTarget] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("daily_targets")
      .select("kcal_target")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setKcalTarget(data.kcal_target.toString());
      });
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const save = async () => {
    const value = parseInt(kcalTarget);
    if (!value || value < 500 || value > 10000) {
      toast.error("Informe um valor entre 500 e 10.000 kcal");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("daily_targets")
      .update({ kcal_target: value })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erro ao salvar meta");
    } else {
      toast.success("Meta atualizada! 🎯");
    }
    setSaving(false);
  };

  return (
    <div className="px-6 pt-12 pb-6">
      <h1 className="font-display text-2xl font-bold mb-6">Ajustes ⚙️</h1>

      <div className="space-y-6">
        <div className="rounded-2xl bg-card p-5 border border-border space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Meta diária (kcal)</label>
            <Input
              type="number"
              placeholder="Ex: 2000"
              value={kcalTarget}
              onChange={(e) => setKcalTarget(e.target.value)}
              className="h-12 rounded-xl"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Ajuste sua meta manualmente ou atualize seu perfil para uma sugestão automática.
            </p>
          </div>
          <Button onClick={save} disabled={saving} className="w-full h-12 rounded-xl">
            {saving ? "Salvando..." : "Salvar meta 🎯"}
          </Button>
        </div>

        <div className="rounded-2xl bg-card p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Conta</p>
          <p className="text-sm font-medium text-foreground mb-4">{user.email}</p>
          <Button
            variant="outline"
            onClick={signOut}
            className="w-full h-12 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5"
          >
            <LogOut className="h-4 w-4 mr-2" /> Sair da conta
          </Button>
        </div>
      </div>
    </div>
  );
}
