import { useEffect, useState } from "react";
import { CalorieRing } from "@/components/CalorieRing";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Flame, Utensils, Cookie } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DaySummary {
  mealKcal: number;
  snackKcal: number;
  mealCount: number;
  snackCount: number;
}

export default function Index() {
  const { user, loading } = useAuth();
  const [target, setTarget] = useState(2000);
  const [summary, setSummary] = useState<DaySummary>({ mealKcal: 0, snackKcal: 0, mealCount: 0, snackCount: 0 });

  useEffect(() => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");

    const fetchData = async () => {
      const [targetRes, mealsRes, snacksRes] = await Promise.all([
        supabase.from("daily_targets").select("kcal_target").eq("user_id", user.id).maybeSingle(),
        supabase.from("meals").select("kcal_total").eq("user_id", user.id).gte("created_at", `${today}T00:00:00`).lte("created_at", `${today}T23:59:59`),
        supabase.from("snacks").select("kcal").eq("user_id", user.id).gte("created_at", `${today}T00:00:00`).lte("created_at", `${today}T23:59:59`),
      ]);

      if (targetRes.data) setTarget(targetRes.data.kcal_target);

      const mealKcal = (mealsRes.data || []).reduce((sum, m) => sum + Number(m.kcal_total), 0);
      const snackKcal = (snacksRes.data || []).reduce((sum, s) => sum + Number(s.kcal), 0);
      setSummary({
        mealKcal,
        snackKcal,
        mealCount: mealsRes.data?.length || 0,
        snackCount: snacksRes.data?.length || 0,
      });
    };

    fetchData();
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const totalConsumed = summary.mealKcal + summary.snackKcal;
  const todayStr = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div className="px-6 pt-12">
      <div className="mb-2">
        <p className="text-sm text-muted-foreground capitalize">{todayStr}</p>
        <h1 className="font-display text-2xl font-bold">Olá! 👋</h1>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <CalorieRing consumed={totalConsumed} target={target} size={220} />

        <div className="mt-6 flex w-full max-w-xs justify-around">
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-display font-bold text-foreground">{totalConsumed}</span>
            <span className="text-xs text-muted-foreground">consumido</span>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-display font-bold text-foreground">{target}</span>
            <span className="text-xs text-muted-foreground">meta</span>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm border border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Utensils className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Refeições</p>
            <p className="text-sm text-muted-foreground">{summary.mealCount} registros hoje</p>
          </div>
          <span className="font-display font-bold text-foreground">{summary.mealKcal} kcal</span>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm border border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <Cookie className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Beliscos</p>
            <p className="text-sm text-muted-foreground">{summary.snackCount} registros hoje</p>
          </div>
          <span className="font-display font-bold text-foreground">{summary.snackKcal} kcal</span>
        </div>
      </div>
    </div>
  );
}
