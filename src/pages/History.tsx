import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Utensils, Cookie, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface MealRecord {
  id: string;
  description: string;
  kcal_total: number;
  created_at: string;
  items: any[];
}

interface SnackRecord {
  id: string;
  name: string;
  grams: number;
  kcal: number;
  created_at: string;
}

type Record = (MealRecord & { type: "meal" }) | (SnackRecord & { type: "snack" });

export default function History() {
  const { user, loading } = useAuth();
  const [records, setRecords] = useState<Record[]>([]);
  const [fetching, setFetching] = useState(true);

  const fetchData = async () => {
    if (!user) return;

    const [mealsRes, snacksRes] = await Promise.all([
      supabase.from("meals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("snacks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]);

    const meals: Record[] = (mealsRes.data || []).map((m) => ({ ...m, type: "meal" as const, items: (m.items as any[]) || [] }));
    const snacks: Record[] = (snacksRes.data || []).map((s) => ({ ...s, type: "snack" as const }));

    const all = [...meals, ...snacks].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setRecords(all);
    setFetching(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const deleteRecord = async (record: Record) => {
    const table = record.type === "meal" ? "meals" : "snacks";
    const { error } = await supabase.from(table).delete().eq("id", record.id);
    if (error) {
      toast.error("Erro ao deletar");
      return;
    }
    toast.success("Registro removido 🗑️");
    fetchData();
  };

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  // Group by date
  const grouped: { [date: string]: Record[] } = {};
  records.forEach((r) => {
    const day = format(new Date(r.created_at), "yyyy-MM-dd");
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(r);
  });

  return (
    <div className="px-6 pt-12 pb-4">
      <h1 className="font-display text-2xl font-bold mb-6">Histórico 📋</h1>

      {fetching ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : records.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum registro ainda.</p>
          <p className="text-sm text-muted-foreground mt-1">Registre sua primeira refeição! 🍽️</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <p className="text-sm font-medium text-muted-foreground mb-2 capitalize">
                {format(new Date(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
              <div className="space-y-2">
                {items.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center gap-3 rounded-2xl bg-card p-4 border border-border"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                      {record.type === "meal" ? (
                        <Utensils className="h-4 w-4 text-primary" />
                      ) : (
                        <Cookie className="h-4 w-4 text-accent" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {record.type === "meal" ? record.description : record.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(record.created_at), "HH:mm")}
                        {record.type === "snack" && ` · ${record.grams}g`}
                      </p>
                    </div>
                    <span className="font-display font-bold text-sm text-foreground shrink-0">
                      {record.type === "meal" ? record.kcal_total : record.kcal} kcal
                    </span>
                    <button onClick={() => deleteRecord(record)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
