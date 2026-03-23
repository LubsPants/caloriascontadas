import { useEffect, useState } from "react";
import { CalorieRing } from "@/components/CalorieRing";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Utensils, Cookie } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DaySummary {
  meal: Macros;
  snack: Macros;
  mealCount: number;
  snackCount: number;
}

const EMPTY_MACROS: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

function MacroBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-sm font-bold ${color}`}>{value}g</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm border border-border animate-pulse">
      <div className="h-10 w-10 rounded-xl bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-3 w-16 rounded bg-muted" />
      </div>
      <div className="h-4 w-16 rounded bg-muted" />
    </div>
  );
}

export default function Index() {
  const { user, loading } = useAuth();
  const [target, setTarget] = useState(2000);
  const [summary, setSummary] = useState<DaySummary | null>(null); // null = carregando
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setFetchError(false);

      // Usa datas locais corretamente para evitar bug de fuso horário
      const now = new Date();
      const dayStart = startOfDay(now).toISOString();
      const dayEnd = endOfDay(now).toISOString();

      const [targetRes, mealsRes, snacksRes] = await Promise.all([
        supabase
          .from("daily_targets")
          .select("kcal_target")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("meals")
          .select("kcal_total, protein_total, carbs_total, fat_total")
          .eq("user_id", user.id)
          .gte("created_at", dayStart)
          .lte("created_at", dayEnd),
        supabase
          .from("snacks")
          .select("kcal, protein, carbs, fat")
          .eq("user_id", user.id)
          .gte("created_at", dayStart)
          .lte("created_at", dayEnd),
      ]);

      if (targetRes.error || mealsRes.error || snacksRes.error) {
        setFetchError(true);
        return;
      }

      if (targetRes.data) setTarget(targetRes.data.kcal_target);

      const meals = mealsRes.data || [];
      const snacks = snacksRes.data || [];

      setSummary({
        meal: {
          kcal:    meals.reduce((s, m) => s + Number(m.kcal_total),    0),
          protein: Math.round(meals.reduce((s, m) => s + Number(m.protein_total ?? 0), 0) * 10) / 10,
          carbs:   Math.round(meals.reduce((s, m) => s + Number(m.carbs_total   ?? 0), 0) * 10) / 10,
          fat:     Math.round(meals.reduce((s, m) => s + Number(m.fat_total     ?? 0), 0) * 10) / 10,
        },
        snack: {
          kcal:    snacks.reduce((s, x) => s + Number(x.kcal),             0),
          protein: Math.round(snacks.reduce((s, x) => s + Number(x.protein ?? 0), 0) * 10) / 10,
          carbs:   Math.round(snacks.reduce((s, x) => s + Number(x.carbs   ?? 0), 0) * 10) / 10,
          fat:     Math.round(snacks.reduce((s, x) => s + Number(x.fat     ?? 0), 0) * 10) / 10,
        },
        mealCount:  meals.length,
        snackCount: snacks.length,
      });
    };

    fetchData();
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const total: Macros = summary
    ? {
        kcal:    summary.meal.kcal    + summary.snack.kcal,
        protein: Math.round((summary.meal.protein + summary.snack.protein) * 10) / 10,
        carbs:   Math.round((summary.meal.carbs   + summary.snack.carbs)   * 10) / 10,
        fat:     Math.round((summary.meal.fat     + summary.snack.fat)     * 10) / 10,
      }
    : EMPTY_MACROS;

  const todayStr = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div className="px-6 pt-12">
      <div className="mb-2">
        <p className="text-sm text-muted-foreground capitalize">{todayStr}</p>
        <h1 className="font-display text-2xl font-bold">Olá! 👋</h1>
      </div>

      {fetchError && (
        <div className="mt-4 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive text-center">
          Erro ao carregar dados. Verifique sua conexão e recarregue a página.
        </div>
      )}

      {/* Anel de calorias */}
      <div className="mt-8 flex flex-col items-center">
        <CalorieRing
          consumed={total.kcal}
          target={target}
          size={220}
          loading={summary === null}
        />

        <div className="mt-6 flex w-full max-w-xs justify-around">
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-display font-bold text-foreground">
              {summary === null ? "—" : total.kcal}
            </span>
            <span className="text-xs text-muted-foreground">consumido</span>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-display font-bold text-foreground">{target}</span>
            <span className="text-xs text-muted-foreground">meta</span>
          </div>
        </div>
      </div>

      {/* Macros do dia */}
      <div className="mt-6 flex justify-around rounded-2xl bg-card border border-border p-4 shadow-sm">
        {summary === null ? (
          <div className="flex w-full justify-around animate-pulse">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="h-4 w-10 rounded bg-muted" />
                <div className="h-3 w-14 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <MacroBadge label="Proteína" value={total.protein} color="text-blue-500" />
            <div className="w-px bg-border" />
            <MacroBadge label="Carboidrato" value={total.carbs} color="text-amber-500" />
            <div className="w-px bg-border" />
            <MacroBadge label="Gordura" value={total.fat} color="text-rose-400" />
          </>
        )}
      </div>

      {/* Cards de refeição e belisco */}
      <div className="mt-4 space-y-3">
        {summary === null ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm border border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Utensils className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Refeições</p>
                <p className="text-xs text-muted-foreground">
                  {summary.mealCount} {summary.mealCount === 1 ? "registro" : "registros"} hoje
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  P {summary.meal.protein}g · C {summary.meal.carbs}g · G {summary.meal.fat}g
                </p>
              </div>
              <span className="font-display font-bold text-foreground">{summary.meal.kcal} kcal</span>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm border border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <Cookie className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Beliscos</p>
                <p className="text-xs text-muted-foreground">
                  {summary.snackCount} {summary.snackCount === 1 ? "registro" : "registros"} hoje
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  P {summary.snack.protein}g · C {summary.snack.carbs}g · G {summary.snack.fat}g
                </p>
              </div>
              <span className="font-display font-bold text-foreground">{summary.snack.kcal} kcal</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
