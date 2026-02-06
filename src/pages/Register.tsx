import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { searchFood, calculateKcal, TacoFood } from "@/data/taco";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Utensils, Cookie, ChevronRight, X } from "lucide-react";

interface FoodItem {
  food: TacoFood;
  grams: number;
  kcal: number;
}

export default function Register() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"meal" | "snack">("meal");

  // Meal state
  const [mealDesc, setMealDesc] = useState("");
  const [foundFoods, setFoundFoods] = useState<{ food: TacoFood; grams: string }[]>([]);
  const [mealItems, setMealItems] = useState<FoodItem[]>([]);
  const [step, setStep] = useState<"describe" | "quantity" | "done">("describe");

  // Snack state
  const [snackQuery, setSnackQuery] = useState("");
  const [snackResult, setSnackResult] = useState<TacoFood | null>(null);
  const [snackGrams, setSnackGrams] = useState("");

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const analyzeMeal = () => {
    if (!mealDesc.trim()) {
      toast.error("Descreva o que você comeu 🍽️");
      return;
    }

    const words = mealDesc.toLowerCase().split(/[,\s]+/).filter(Boolean);
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
      items.push({ food: f.food, grams: g, kcal: calculateKcal(f.food, g) });
    }

    const totalKcal = items.reduce((s, i) => s + i.kcal, 0);

    const { error } = await supabase.from("meals").insert({
      user_id: user.id,
      description: mealDesc,
      items: items.map((i) => ({ name: i.food.name, grams: i.grams, kcal: i.kcal })),
      kcal_total: totalKcal,
    });

    if (error) {
      toast.error("Erro ao salvar refeição");
      return;
    }

    toast.success(`Refeição salva! ${totalKcal} kcal 🎉`);
    setMealDesc("");
    setFoundFoods([]);
    setMealItems([]);
    setStep("describe");
  };

  const saveSnack = async () => {
    if (!snackResult) return;
    const g = parseFloat(snackGrams);
    if (!g || g <= 0) {
      toast.error("Informe a quantidade em gramas");
      return;
    }

    const kcal = calculateKcal(snackResult, g);

    const { error } = await supabase.from("snacks").insert({
      user_id: user.id,
      name: snackResult.name,
      grams: g,
      kcal,
    });

    if (error) {
      toast.error("Erro ao salvar belisco");
      return;
    }

    toast.success(`Belisco salvo! ${kcal} kcal 🍪`);
    setSnackQuery("");
    setSnackResult(null);
    setSnackGrams("");
  };

  const searchSnack = () => {
    const results = searchFood(snackQuery);
    if (results.length > 0) {
      setSnackResult(results[0]);
    } else {
      toast.error("Não encontrei esse alimento 😕 Tente outro nome.");
    }
  };

  return (
    <div className="px-6 pt-12">
      <h1 className="font-display text-2xl font-bold mb-6">Registrar</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("meal")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "meal"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          <Utensils className="h-4 w-4" /> Refeição
        </button>
        <button
          onClick={() => setActiveTab("snack")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "snack"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          <Cookie className="h-4 w-4" /> Belisco
        </button>
      </div>

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
                      <p className="text-xs text-muted-foreground">{f.food.kcal} kcal/100g</p>
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
        </div>
      )}

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
                  <p className="text-xs text-muted-foreground">{snackResult.kcal} kcal/100g</p>
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
              {snackGrams && parseFloat(snackGrams) > 0 && (
                <p className="text-sm font-medium text-primary">
                  = {calculateKcal(snackResult, parseFloat(snackGrams))} kcal
                </p>
              )}
              <Button onClick={saveSnack} className="w-full h-12 rounded-xl">
                Salvar belisco ✅
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
