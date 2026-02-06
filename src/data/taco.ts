// Tabela TACO simplificada - kcal por 100g
export interface TacoFood {
  name: string;
  aliases: string[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const tacoDatabase: TacoFood[] = [
  { name: "Arroz branco cozido", aliases: ["arroz", "arroz branco"], kcal: 128, protein: 2.5, carbs: 28.1, fat: 0.2 },
  { name: "Feijão preto cozido", aliases: ["feijão", "feijão preto"], kcal: 77, protein: 4.5, carbs: 14.0, fat: 0.5 },
  { name: "Feijão carioca cozido", aliases: ["feijão carioca"], kcal: 76, protein: 4.8, carbs: 13.6, fat: 0.5 },
  { name: "Frango grelhado", aliases: ["frango", "peito de frango", "frango grelhado"], kcal: 159, protein: 32.0, carbs: 0, fat: 3.2 },
  { name: "Carne bovina (patinho)", aliases: ["carne", "carne bovina", "patinho", "bife"], kcal: 219, protein: 35.9, carbs: 0, fat: 7.3 },
  { name: "Carne de porco (lombo)", aliases: ["porco", "lombo", "carne de porco"], kcal: 210, protein: 30.2, carbs: 0, fat: 9.1 },
  { name: "Ovo cozido", aliases: ["ovo", "ovo cozido"], kcal: 146, protein: 13.3, carbs: 0.6, fat: 9.5 },
  { name: "Ovo frito", aliases: ["ovo frito"], kcal: 240, protein: 15.6, carbs: 0.6, fat: 19.5 },
  { name: "Pão francês", aliases: ["pão", "pão francês", "pãozinho"], kcal: 300, protein: 8.0, carbs: 58.6, fat: 3.1 },
  { name: "Pão integral", aliases: ["pão integral"], kcal: 253, protein: 9.4, carbs: 49.9, fat: 3.4 },
  { name: "Macarrão cozido", aliases: ["macarrão", "massa", "espaguete"], kcal: 102, protein: 3.4, carbs: 19.9, fat: 0.5 },
  { name: "Batata cozida", aliases: ["batata", "batata cozida"], kcal: 52, protein: 1.2, carbs: 11.9, fat: 0.1 },
  { name: "Batata frita", aliases: ["batata frita", "fritas"], kcal: 267, protein: 3.2, carbs: 36.0, fat: 12.7 },
  { name: "Batata doce cozida", aliases: ["batata doce"], kcal: 77, protein: 0.6, carbs: 18.4, fat: 0.1 },
  { name: "Mandioca cozida", aliases: ["mandioca", "aipim", "macaxeira"], kcal: 125, protein: 0.6, carbs: 30.1, fat: 0.3 },
  { name: "Alface", aliases: ["alface", "salada"], kcal: 11, protein: 1.3, carbs: 1.7, fat: 0.2 },
  { name: "Tomate", aliases: ["tomate"], kcal: 15, protein: 1.1, carbs: 3.1, fat: 0.2 },
  { name: "Cenoura cozida", aliases: ["cenoura"], kcal: 30, protein: 0.8, carbs: 6.7, fat: 0.2 },
  { name: "Brócolis cozido", aliases: ["brócolis"], kcal: 25, protein: 2.1, carbs: 4.4, fat: 0.3 },
  { name: "Banana", aliases: ["banana", "banana prata"], kcal: 98, protein: 1.3, carbs: 26.0, fat: 0.1 },
  { name: "Maçã", aliases: ["maçã"], kcal: 56, protein: 0.3, carbs: 15.2, fat: 0.0 },
  { name: "Laranja", aliases: ["laranja"], kcal: 37, protein: 1.0, carbs: 8.9, fat: 0.1 },
  { name: "Mamão", aliases: ["mamão"], kcal: 40, protein: 0.5, carbs: 10.4, fat: 0.1 },
  { name: "Leite integral", aliases: ["leite", "leite integral"], kcal: 58, protein: 3.0, carbs: 4.5, fat: 3.2 },
  { name: "Queijo mussarela", aliases: ["queijo", "mussarela"], kcal: 330, protein: 22.6, carbs: 3.0, fat: 25.2 },
  { name: "Iogurte natural", aliases: ["iogurte"], kcal: 51, protein: 4.1, carbs: 5.3, fat: 1.6 },
  { name: "Biscoito cream cracker", aliases: ["biscoito", "cream cracker", "bolacha"], kcal: 432, protein: 9.5, carbs: 68.7, fat: 14.6 },
  { name: "Biscoito wafer", aliases: ["wafer", "biscoito wafer"], kcal: 502, protein: 4.5, carbs: 64.0, fat: 25.5 },
  { name: "Chocolate ao leite", aliases: ["chocolate", "chocolate ao leite"], kcal: 540, protein: 7.0, carbs: 59.4, fat: 30.3 },
  { name: "Chocolate amargo", aliases: ["chocolate amargo", "chocolate 70"], kcal: 478, protein: 5.5, carbs: 46.0, fat: 30.0 },
  { name: "Açaí", aliases: ["açaí"], kcal: 58, protein: 0.8, carbs: 6.2, fat: 3.9 },
  { name: "Tapioca", aliases: ["tapioca"], kcal: 340, protein: 0.1, carbs: 83.5, fat: 0.1 },
  { name: "Cuscuz de milho", aliases: ["cuscuz"], kcal: 113, protein: 2.6, carbs: 24.7, fat: 0.6 },
  { name: "Farofa", aliases: ["farofa"], kcal: 403, protein: 1.9, carbs: 71.7, fat: 12.5 },
  { name: "Calabresa", aliases: ["calabresa", "linguiça"], kcal: 263, protein: 16.0, carbs: 1.5, fat: 21.8 },
  { name: "Presunto", aliases: ["presunto"], kcal: 100, protein: 14.0, carbs: 2.5, fat: 3.5 },
  { name: "Suco de laranja", aliases: ["suco", "suco de laranja"], kcal: 41, protein: 0.6, carbs: 10.0, fat: 0.1 },
  { name: "Refrigerante cola", aliases: ["refrigerante", "coca", "coca cola", "coca-cola"], kcal: 37, protein: 0, carbs: 9.4, fat: 0 },
  { name: "Cerveja", aliases: ["cerveja"], kcal: 40, protein: 0.3, carbs: 3.1, fat: 0 },
  { name: "Café com açúcar", aliases: ["café", "cafezinho"], kcal: 30, protein: 0.3, carbs: 7.3, fat: 0 },
  { name: "Pizza (mussarela)", aliases: ["pizza", "pizza mussarela"], kcal: 247, protein: 11.0, carbs: 28.0, fat: 10.0 },
  { name: "Hambúrguer (bovino)", aliases: ["hambúrguer", "hamburger"], kcal: 247, protein: 17.5, carbs: 0, fat: 19.6 },
  { name: "Salmão grelhado", aliases: ["salmão"], kcal: 170, protein: 22.0, carbs: 0, fat: 9.0 },
  { name: "Atum enlatado", aliases: ["atum"], kcal: 166, protein: 26.0, carbs: 0, fat: 6.8 },
  { name: "Abacate", aliases: ["abacate"], kcal: 96, protein: 1.2, carbs: 6.0, fat: 8.4 },
  { name: "Granola", aliases: ["granola"], kcal: 421, protein: 11.0, carbs: 71.0, fat: 12.3 },
  { name: "Aveia", aliases: ["aveia"], kcal: 394, protein: 14.0, carbs: 66.6, fat: 8.5 },
  { name: "Amendoim torrado", aliases: ["amendoim"], kcal: 544, protein: 27.2, carbs: 20.3, fat: 43.9 },
  { name: "Castanha-do-pará", aliases: ["castanha", "castanha do pará"], kcal: 643, protein: 14.5, carbs: 15.1, fat: 63.5 },
  { name: "Pipoca (sem óleo)", aliases: ["pipoca"], kcal: 375, protein: 11.5, carbs: 77.9, fat: 4.3 },
];

export function searchFood(query: string): TacoFood[] {
  const normalized = query.toLowerCase().trim();
  return tacoDatabase.filter(
    (food) =>
      food.name.toLowerCase().includes(normalized) ||
      food.aliases.some((alias) => alias.includes(normalized))
  );
}

export function calculateKcal(food: TacoFood, grams: number): number {
  return Math.round((food.kcal * grams) / 100);
}
