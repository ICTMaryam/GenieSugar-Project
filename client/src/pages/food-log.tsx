import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/language-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertFoodLogSchema, type InsertFoodLog, type FoodLog, bahrainiFood, calculateGlycemicLoad, isDangerousForDiabetes } from "@shared/schema";
import { Utensils, Plus, Loader2, Trash2, Coffee, Sun, Moon, Cookie, AlertTriangle, Flame, Search } from "lucide-react";
import { format, isToday, isWithinInterval, subDays, startOfDay, endOfDay } from "date-fns";
import { z } from "zod";

const formSchema = insertFoodLogSchema.extend({
  userId: z.string().optional(),
  foodId: z.string().optional(),
});

const mealIcons = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

const mealColors = {
  breakfast: "bg-chart-3/10 text-chart-3",
  lunch: "bg-chart-2/10 text-chart-2",
  dinner: "bg-chart-4/10 text-chart-4",
  snack: "bg-chart-5/10 text-chart-5",
};

export default function FoodLogPage() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState("today");
  const [selectedFood, setSelectedFood] = useState<typeof bahrainiFood[number] | null>(null);
  const [foodSearchQuery, setFoodSearchQuery] = useState("");
  const [customFood, setCustomFood] = useState(false);

  const form = useForm<InsertFoodLog>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mealType: "breakfast",
      foodName: "",
      portion: "",
      notes: "",
      calories: undefined,
      carbs: undefined,
      protein: undefined,
      fat: undefined,
      fiber: undefined,
      glycemicIndex: undefined,
      glycemicLoad: undefined,
      isDangerous: false,
      timestamp: new Date().toISOString().slice(0, 16),
    },
  });

  const filteredFoodList = useMemo(() => {
    if (!foodSearchQuery) return bahrainiFood;
    const query = foodSearchQuery.toLowerCase();
    return bahrainiFood.filter(food => 
      food.name.toLowerCase().includes(query) || 
      food.nameAr.includes(query) ||
      food.category.toLowerCase().includes(query)
    );
  }, [foodSearchQuery]);

  const { data: logs, isLoading } = useQuery<FoodLog[]>({
    queryKey: ["/api/food"],
  });

  const addMutation = useMutation({
    mutationFn: async (data: InsertFoodLog) => {
      const response = await apiRequest("POST", "/api/food", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food"] });
      toast({ title: "Success", description: "Food log added" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to add food log",
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/food/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food"] });
      toast({ title: "Deleted", description: "Food log removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    },
  });

  const resetForm = () => {
    form.reset({
      mealType: "breakfast",
      foodName: "",
      portion: "",
      notes: "",
      calories: undefined,
      carbs: undefined,
      protein: undefined,
      fat: undefined,
      fiber: undefined,
      glycemicIndex: undefined,
      glycemicLoad: undefined,
      isDangerous: false,
      timestamp: new Date().toISOString().slice(0, 16),
    });
    setSelectedFood(null);
    setFoodSearchQuery("");
    setCustomFood(false);
  };

  const selectBahrainiFood = (food: typeof bahrainiFood[number]) => {
    setSelectedFood(food);
    const gl = calculateGlycemicLoad(food.gi, food.carbs, food.fiber);
    const dangerous = isDangerousForDiabetes(food.gi, gl);
    
    form.setValue("foodName", language === 'ar' ? `${food.nameAr} (${food.name})` : food.name);
    form.setValue("portion", food.serving);
    form.setValue("calories", food.calories);
    form.setValue("carbs", food.carbs);
    form.setValue("protein", food.protein);
    form.setValue("fat", food.fat);
    form.setValue("fiber", food.fiber);
    form.setValue("glycemicIndex", food.gi);
    form.setValue("glycemicLoad", gl);
    form.setValue("isDangerous", dangerous);
    setCustomFood(false);
  };

  const onSubmit = (data: InsertFoodLog) => {
    addMutation.mutate(data);
  };

  const filteredLogs = logs?.filter(log => {
    const logDate = new Date(log.timestamp);
    if (filter === "today") return isToday(logDate);
    if (filter === "week") return isWithinInterval(logDate, { start: subDays(new Date(), 7), end: new Date() });
    return true;
  });

  const todayLogs = logs?.filter(log => isToday(new Date(log.timestamp))) || [];
  
  const dailyTotals = useMemo(() => {
    return todayLogs.reduce((acc, log) => ({
      calories: acc.calories + (log.calories || 0),
      carbs: acc.carbs + (log.carbs || 0),
      protein: acc.protein + (log.protein || 0),
      fat: acc.fat + (log.fat || 0),
      avgGL: acc.avgGL + (log.glycemicLoad || 0),
      dangerousCount: acc.dangerousCount + (log.isDangerous ? 1 : 0),
    }), { calories: 0, carbs: 0, protein: 0, fat: 0, avgGL: 0, dangerousCount: 0 });
  }, [todayLogs]);

  return (
    <DashboardLayout 
      title={language === 'ar' ? "سجل الطعام" : "Food Log"}
      actions={
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-food">
              <Plus className="h-4 w-4 mr-2" />
              {language === 'ar' ? "تسجيل وجبة" : "Log Meal"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? "تسجيل الطعام" : "Log Food"}</DialogTitle>
            </DialogHeader>
            
            {!customFood && !selectedFood && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === 'ar' ? "ابحث عن الطعام البحريني..." : "Search Bahraini food..."}
                    value={foodSearchQuery}
                    onChange={(e) => setFoodSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-food"
                  />
                </div>
                
                <ScrollArea className="h-[300px] rounded-lg border border-border">
                  <div className="p-2 space-y-1">
                    {filteredFoodList.map((food) => {
                      const gl = calculateGlycemicLoad(food.gi, food.carbs, food.fiber);
                      const dangerous = isDangerousForDiabetes(food.gi, gl);
                      
                      return (
                        <button
                          key={food.id}
                          type="button"
                          onClick={() => selectBahrainiFood(food)}
                          className="w-full text-left p-3 rounded-lg hover-elevate transition-colors flex items-start justify-between gap-2"
                          data-testid={`food-item-${food.id}`}
                        >
                          <div>
                            <div className="font-medium flex items-center gap-2 flex-wrap">
                              {language === 'ar' ? food.nameAr : food.name}
                              {dangerous && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {language === 'ar' ? "عالي" : "High GI"}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {food.serving} - {food.calories} kcal
                            </div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <div>GI: {food.gi}</div>
                            <div>GL: {gl}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setCustomFood(true)}
                  data-testid="button-custom-food"
                >
                  {language === 'ar' ? "إدخال طعام مخصص" : "Enter Custom Food"}
                </Button>
              </div>
            )}

            {(selectedFood || customFood) && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {selectedFood && (
                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-semibold">
                          {language === 'ar' ? selectedFood.nameAr : selectedFood.name}
                        </span>
                        {form.watch("isDangerous") && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {language === 'ar' ? "تحذير: مرتفع السكر" : "Warning: High Impact"}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div className="text-center p-2 rounded bg-background">
                          <div className="font-medium">{selectedFood.calories}</div>
                          <div className="text-xs text-muted-foreground">kcal</div>
                        </div>
                        <div className="text-center p-2 rounded bg-background">
                          <div className="font-medium">{selectedFood.carbs}g</div>
                          <div className="text-xs text-muted-foreground">{language === 'ar' ? "كربوهيدرات" : "Carbs"}</div>
                        </div>
                        <div className="text-center p-2 rounded bg-background">
                          <div className="font-medium">{selectedFood.protein}g</div>
                          <div className="text-xs text-muted-foreground">{language === 'ar' ? "بروتين" : "Protein"}</div>
                        </div>
                        <div className="text-center p-2 rounded bg-background">
                          <div className="font-medium">{selectedFood.fat}g</div>
                          <div className="text-xs text-muted-foreground">{language === 'ar' ? "دهون" : "Fat"}</div>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-border">
                        <span>GI: <strong>{selectedFood.gi}</strong></span>
                        <span>GL: <strong>{form.watch("glycemicLoad")}</strong></span>
                        <span>{language === 'ar' ? "ألياف" : "Fiber"}: <strong>{selectedFood.fiber}g</strong></span>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={resetForm}
                        className="w-full mt-2"
                      >
                        {language === 'ar' ? "اختر طعام آخر" : "Choose Different Food"}
                      </Button>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="mealType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? "نوع الوجبة" : "Meal Type"}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-meal-type">
                              <SelectValue placeholder="Select meal type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="breakfast">{language === 'ar' ? "إفطار" : "Breakfast"}</SelectItem>
                            <SelectItem value="lunch">{language === 'ar' ? "غداء" : "Lunch"}</SelectItem>
                            <SelectItem value="dinner">{language === 'ar' ? "عشاء" : "Dinner"}</SelectItem>
                            <SelectItem value="snack">{language === 'ar' ? "وجبة خفيفة" : "Snack"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {customFood && (
                    <FormField
                      control={form.control}
                      name="foodName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? "اسم الطعام" : "Food Name"}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={language === 'ar' ? "ماذا أكلت؟" : "What did you eat?"}
                              data-testid="input-food-name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="timestamp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? "التاريخ والوقت" : "Date & Time"}</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local"
                            data-testid="input-food-timestamp"
                            {...field}
                            value={typeof field.value === 'string' ? field.value : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? "ملاحظات (اختياري)" : "Notes (optional)"}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={language === 'ar' ? "أي تفاصيل إضافية..." : "Any additional details..."}
                            className="resize-none"
                            data-testid="input-food-notes"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={addMutation.isPending}
                    data-testid="button-submit-food"
                  >
                    {addMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {language === 'ar' ? "جاري الحفظ..." : "Saving..."}
                      </>
                    ) : (
                      language === 'ar' ? "حفظ سجل الطعام" : "Save Food Log"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-6">
        {todayLogs.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-card-border">
              <CardContent className="pt-4 text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Flame className="h-4 w-4" />
                  <span className="text-xs">{language === 'ar' ? "سعرات اليوم" : "Today's Calories"}</span>
                </div>
                <div className="text-2xl font-bold">{dailyTotals.calories}</div>
                <div className="text-xs text-muted-foreground">kcal</div>
              </CardContent>
            </Card>
            <Card className="border-card-border">
              <CardContent className="pt-4 text-center">
                <div className="text-xs text-muted-foreground mb-1">{language === 'ar' ? "كربوهيدرات" : "Carbs"}</div>
                <div className="text-2xl font-bold">{dailyTotals.carbs}g</div>
              </CardContent>
            </Card>
            <Card className="border-card-border">
              <CardContent className="pt-4 text-center">
                <div className="text-xs text-muted-foreground mb-1">{language === 'ar' ? "بروتين" : "Protein"}</div>
                <div className="text-2xl font-bold">{dailyTotals.protein}g</div>
              </CardContent>
            </Card>
            <Card className="border-card-border">
              <CardContent className="pt-4 text-center">
                <div className="text-xs text-muted-foreground mb-1">{language === 'ar' ? "إجمالي GL" : "Total GL"}</div>
                <div className={`text-2xl font-bold ${dailyTotals.avgGL > 100 ? 'text-destructive' : ''}`}>{dailyTotals.avgGL}</div>
              </CardContent>
            </Card>
            {dailyTotals.dangerousCount > 0 && (
              <Card className="border-destructive bg-destructive/10">
                <CardContent className="pt-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-destructive mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs">{language === 'ar' ? "أطعمة عالية GI" : "High GI Foods"}</span>
                  </div>
                  <div className="text-2xl font-bold text-destructive">{dailyTotals.dangerousCount}</div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="today" data-testid="tab-today">{language === 'ar' ? "اليوم" : "Today"}</TabsTrigger>
            <TabsTrigger value="week" data-testid="tab-week">{language === 'ar' ? "هذا الأسبوع" : "This Week"}</TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all">{language === 'ar' ? "الكل" : "All"}</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-chart-2" />
              {language === 'ar' ? "سجلات الطعام" : "Food Logs"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 animate-pulse bg-muted rounded-lg" />
                ))}
              </div>
            ) : filteredLogs && filteredLogs.length > 0 ? (
              <div className="space-y-3">
                {filteredLogs.map((log) => {
                  const MealIcon = mealIcons[log.mealType as keyof typeof mealIcons] || Utensils;
                  const mealColor = mealColors[log.mealType as keyof typeof mealColors] || "bg-muted";
                  
                  return (
                    <div 
                      key={log.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${log.isDangerous ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-card'}`}
                      data-testid={`food-log-${log.id}`}
                    >
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${mealColor}`}>
                        <MealIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{log.foodName}</span>
                          {log.isDangerous && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {language === 'ar' ? "عالي GI/GL" : "High GI/GL"}
                            </Badge>
                          )}
                          {log.portion && (
                            <Badge variant="secondary" className="text-xs">{log.portion}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <span className="capitalize">{log.mealType}</span> - {format(new Date(log.timestamp), "EEEE, MMMM d 'at' h:mm a")}
                        </p>
                        {(log.calories || log.glycemicIndex) && (
                          <div className="flex gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                            {log.calories && <span>{log.calories} kcal</span>}
                            {log.carbs && <span>{log.carbs}g carbs</span>}
                            {log.glycemicIndex !== null && <span>GI: {log.glycemicIndex}</span>}
                            {log.glycemicLoad !== null && <span>GL: {log.glycemicLoad}</span>}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(log.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-food-${log.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">{language === 'ar' ? "لا توجد سجلات طعام بعد" : "No food logs yet"}</p>
                <p className="text-sm mt-1">{language === 'ar' ? "سجل وجباتك لرؤية الأنماط" : "Track your meals to see patterns"}</p>
                <Button 
                  className="mt-4" 
                  onClick={() => setIsDialogOpen(true)}
                  data-testid="button-add-first-food"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {language === 'ar' ? "تسجيل وجبة" : "Log Meal"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
