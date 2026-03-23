import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { searchFood, calculateMacros, calculateKcal, sumMacros, TacoFood } from "@/data/taco";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Utensils, Cookie, ChevronRight, X, Trash2, Pencil, Check } from "lucide-react";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface FoodItem {
  food: TacoFood;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface SavedMeal {
  id: string;
  description: string;
  kcal_total: number;
  protein_total: number;
  carbs_total: number;
  fat_total: number;
  created_at: string;
  items: { name: string; grams: number; kcal: number }[];
}

interface SavedSnack {
  id: string;
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function Register() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"meal" | "snack">("meal");

  // Meal state
  const [mealDesc, setMealDesc] = useState("");
  const [foundFoods, setFoundFoods] = useState<{ food: TacoFood; grams: string }[]>([]);
  const [step, setStep] = useState<"describe" | "quantity">("describe");

  // Snack state
  const [snackQuery, setSnackQuery] = useState("");
  const [snackResult, setSnackResult] = useState<TacoFood | null>(null);
  const [snackGrams, setSnackGrams] = useState("");

  // Registros salvos do dia
  const [meals, setMeals] = useState<SavedMeal[]>([]);
  const [snacks, setSnacks] = useState<SavedSnack[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  // Edição inline de snack
  const [editingSnackId, setEditingSnackId] = useState<string | null>(null);
  const [editingSnackGrams, setEditingSnackGrams] = useState("");

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  // ── Carrega registros do dia ────────────────────────────────────────────────

  const loadTodayRecords = async () => {
    setLoadingRecords(true);
    const today = new Date();
    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const dayEnd   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

    const [mealsRes, snacksRes] = await Promise.all([
      supabase
        .from("meals")
        .select("id, description, kcal_total, protein_total, carbs_total, fat_total, created_at, items")
        .eq("user_id", user.id)
        .gte("created_at", dayStart)
        .lte("created_at", dayEnd)
        .order("created_at", { ascending: false }),
      supabase
        .from("snacks")
        .select("id, name, grams, kcal, protein, carbs, fat, created_at")
        .eq("user_id", user.id)
        .gte("created_at", dayStart)
        .lte("created_at", dayEnd)
        .order("created_at", { ascending: false }),
    ]);

    setMeals((mealsRes.data as SavedMeal[]) || []);
    setSnacks((snacksRes.data as SavedSnack[]) || []);
    setLoadingRecords(false);
  };

  useEffect(() => { loadTodayRecords(); }, [user]);

  // ── Refeição ───────────────────────────────────────────────────────────────

  const analyzeMeal = () => {
    if (!mealDesc.trim()) {
      toast.error("Descreva o que você comeu 🍽️");
      return;
    }

    // Filtra stopwords simples para não gerar buscas inúteis
    const stopwords = new Set(["e", "com", "de", "da", "do", "um", "uma", "no", "na"]);
    const words = mealDesc
      .toLowerCase()
      .split(/[,\s]+/)
      .filter((w) => w.length > 1 && !stopwords.has(w));

    const found: { food: TacoFood; grams: string }[] = [];
    const seen = new Set<string>();

    for (const word of words) {
      const results = searchFood(word);
      for (const r of results) {
        if (!seen.has(r.name)) {
          seen.add(r.name);
          found.push({ food: r, grams: "" });
        }
      }
    }

    if (found.length === 0) {
      toast.error("Não encontrei esses alimentos 😕 Tente outros nomes.");
      return;
    }

    setFoundFoods(found);
    setStep("quantity");
  };

  const confirmMeal = async () => {
    const items: FoodItem[] = [];
    for (const f of foundFoods) {
      const g = parseFloat(f.grams);
      if (!g || g <= 0) {
        toast.error(`Informe os gramas de ${f.food.name}`);
        return;
      }
      const macros = calculateMacros(f.food, g);
      items.push({ food: f.food, grams: g, ...macros });
    }

    const totals = sumMacros(items.map((i) => ({ kcal: i.kcal, protein: i.protein, carbs: i.carbs, fat: i.fat })));

    const { error } = await supabase.from("meals").insert({
      user_id:       user.id,
      description:   mealDesc,
      items:         items.map((i) => ({ name: i.food.name, grams: i.grams, kcal: i.kcal })),
      kcal_total:    totals.kcal,
      protein_total: totals.protein,
      carbs_total:   totals.carbs,
      fat_total:     totals.fat,
    });

    if (error) { toast.error("Erro ao salvar refeição"); return; }

    toast.success(`Refeição salva! ${totals.kcal} kcal 🎉`);
    setMealDesc("");
    setFoundFoods([]);
    setStep("describe");
    loadTodayRecords();
  };

  const deleteMeal = async (id: string) => {
    const { error } = await supabase.from("meals").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir refeição"); return; }
    toast.success("Refeição removida");
    setMeals((prev) => prev.filter((m) => m.id !== id));
  };

  // ── Belisco ────────────────────────────────────────────────────────────────

  const searchSnack = () => {
    const results = searchFood(snackQuery);
    if (results.length > 0) {
      setSnackResult(results[0]);
    } else {
      toast.error("Não encontrei esse alimento 😕 Tente outro nome.");
    }
  };

  const saveSnack = async () => {
    if (!snackResult) return;
    const g = parseFloat(snackGrams);
    if (!g || g <= 0) { toast.error("Informe a quantidade em gramas"); return; }

    const macros = calculateMacros(snackResult, g);

    const { error } = await supabase.from("snacks").insert({
      user_id: user.id,
      name:    snackResult.name,
      grams:   g,
      kcal:    macros.kcal,
      protein: macros.protein,
      carbs:   macros.carbs,
      fat:     macros.fat,
    });

    if (error) { toast.error("Erro ao salvar belisco"); return; }

    toast.success(`Belisco salvo! ${macros.kcal} kcal 🍪`);
    setSnackQuery("");
    setSnackResult(null);
    setSnackGrams("");
    loadTodayRecords();
  };

  const deleteSnack = async (id: string) => {
    const { error } = await supabase.from("snacks").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir belisco"); return; }
    toast.success("Belisco removido");
    setSnacks((prev) => prev.filter((s) => s.id !== id));
  };

  const startEditSnack = (snack: SavedSnack) => {
    setEditingSnackId(snack.id);
    setEditingSnackGrams(String(snack.grams));
  };

  const saveEditSnack = async (snack: SavedSnack) => {
    const g = parseFloat(editingSnackGrams);
    if (!g || g <= 0) { toast.error("Quantidade inválida"); return; }

    // Busca o alimento original para recalcular
    const foods = searchFood(snack.name);
    const food = foods[0];
    if (!food) { toast.error("Não foi possível recalcular as calorias"); return; }

    const macros = calculateMacros(food, g);

    const { error } = await supabase
      .from("snacks")
      .update({ grams: g, kcal: macros.kcal, protein: macros.protein, carbs: macros.carbs, fat: macros.fat })
      .eq("id", snack.id);

    if (error) { toast.error("Erro ao atualizar belisco"); return; }

    toast.success("Belisco atualizado!");
    setEditingSnackId(null);
    loadTodayRecords();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="px-6 pt-12 pb-6">
      <h1 className="font-display text-2xl font-bold mb-6">Registrar</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("meal")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "meal" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          <Utensils className="h-4 w-4" /> Refeição
        </button>
        <button
          onClick={() => setActiveTab("snack")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "snack" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          <Cookie className="h-4 w-4" /> Belisco
        </button>
      </div>

      {/* ── ABA REFEIÇÃO ── */}
      {activeTab === "meal" && (
        <div className="space-y-4">
          {step === "describe" && (
            <>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  O que você comeu? 🍽️
                </label>
                <Textarea
                  placeholder="Ex: arroz, feijão e frango"
                  value={mealDesc}
                  onChange={(e) => setMealDesc(e.target.value)}
                  className="min-h-[100px] rounded-xl"
                />
              </div>
              <Button onClick={analyzeMeal} className="w-full h-12 rounded-xl">
                Identificar alimentos <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          )}

          {step === "quantity" && (
            <>
              <p className="text-sm text-muted-foreground">
                Encontrei esses alimentos! Informe a quantidade em gramas: 🥄
              </p>
              <div className="space-y-3">
                {foundFoods.map((f, i) => (
                  <div key={f.food.name} className="flex items-center gap-3 rounded-xl bg-card p-3 border border-border">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">{f.food.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.food.kcal} kcal · P{f.food.protein}g · C{f.food.carbs}g · G{f.food.fat}g /100g
                      </p>
                    </div>
                    <Input
                      type="number"
                      placeholder="g"
                      value={f.grams}
                      onChange={(e) => {
                        const updated = [...foundFoods];
                        updated[i].grams = e.target.value;
                        setFoundFoods(updated);
                      }}
                      className="w-20 h-10 rounded-lg text-center"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => { setStep("describe"); setFoundFoods([]); }}
                  className="flex-1 h-12 rounded-xl"
                >
                  Voltar
                </Button>
                <Button onClick={confirmMeal} className="flex-1 h-12 rounded-xl">
                  Salvar refeição ✅
                </Button>
              </div>
            </>
          )}

          {/* Lista de refeições do dia */}
          {meals.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-muted-foreground mb-3">Refeições de hoje</p>
              <div className="space-y-2">
                {meals.map((meal) => (
                  <div key={meal.id} className="rounded-xl bg-card border border-border p-3 flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{meal.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {meal.kcal_total} kcal · P {meal.protein_total}g · C {meal.carbs_total}g · G {meal.fat_total}g
                      </p>
                    </div>
                    <button
                      onClick={() => deleteMeal(meal.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors mt-0.5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ABA BELISCO ── */}
      {activeTab === "snack" && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Qual foi o belisco? 🍪
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: biscoito wafer"
                value={snackQuery}
                onChange={(e) => setSnackQuery(e.target.value)}
                className="h-12 rounded-xl"
                onKeyDown={(e) => e.key === "Enter" && searchSnack()}
              />
              <Button onClick={searchSnack} className="h-12 rounded-xl px-4">
                Buscar
              </Button>
            </div>
          </div>

          {snackResult && (
            <div className="rounded-xl bg-card p-4 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{snackResult.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {snackResult.kcal} kcal · P{snackResult.protein}g · C{snackResult.carbs}g · G{snackResult.fat}g /100g
                  </p>
                </div>
                <button onClick={() => setSnackResult(null)}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Quantos gramas você comeu? 🥄
                </label>
                <Input
                  type="number"
                  placeholder="Ex: 30"
                  value={snackGrams}
                  onChange={(e) => setSnackGrams(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              {snackGrams && parseFloat(snackGrams) > 0 && (() => {
                const m = calculateMacros(snackResult, parseFloat(snackGrams));
                return (
                  <p className="text-sm font-medium text-primary">
                    = {m.kcal} kcal · P {m.protein}g · C {m.carbs}g · G {m.fat}g
                  </p>
                );
              })()}
              <Button onClick={saveSnack} className="w-full h-12 rounded-xl">
                Salvar belisco ✅
              </Button>
            </div>
          )}

          {/* Lista de beliscos do dia */}
          {snacks.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Beliscos de hoje</p>
              <div className="space-y-2">
                {snacks.map((snack) => (
                  <div key={snack.id} className="rounded-xl bg-card border border-border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{snack.name}</p>
                        {editingSnackId === snack.id ? (
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              type="number"
                              value={editingSnackGrams}
                              onChange={(e) => setEditingSnackGrams(e.target.value)}
                              className="h-8 w-20 rounded-lg text-center text-sm"
                              autoFocus
                            />
                            <span className="text-xs text-muted-foreground">g</span>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {snack.grams}g · {snack.kcal} kcal · P {snack.protein}g · C {snack.carbs}g · G {snack.fat}g
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {editingSnackId === snack.id ? (
                          <button
                            onClick={() => saveEditSnack(snack)}
                            className="text-primary hover:text-primary/80 transition-colors"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => startEditSnack(snack)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteSnack(snack.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
