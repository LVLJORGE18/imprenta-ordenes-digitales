import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Download, TrendingUp, User, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import StatsPanel from "./StatsPanel";

interface StatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MonthlyStats {
  month: string;
  totalOrders: number;
  totalRevenue: number;
  deliveredRevenue: number;
  workstationStats: {
    [key: string]: number;
  };
}

interface StationStats {
  user_name: string;
  station: string;
  total_orders: number;
  monthly_orders: number;
  user_id: string;
}

export default function StatsDialog({ open, onOpenChange }: StatsDialogProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [stationStats, setStationStats] = useState<StationStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateMonthlyReport = async () => {
    setIsLoading(true);
    try {
      const startDate = new Date(selectedMonth + '-01');
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      
      // Obtener órdenes del mes seleccionado
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      // Calcular estadísticas
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const deliveredRevenue = orders
        ?.filter(order => order.delivery_status === 'Entregado')
        .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Estadísticas por estación de trabajo (basado en work_type)
      const workstationStats: { [key: string]: number } = {};
      orders?.forEach(order => {
        const workType = order.work_type;
        workstationStats[workType] = (workstationStats[workType] || 0) + 1;
      });

      const stats: MonthlyStats = {
        month: selectedMonth,
        totalOrders,
        totalRevenue,
        deliveredRevenue,
        workstationStats
      };

      setMonthlyStats(stats);
      
      toast({
        title: "Reporte generado",
        description: "Las estadísticas mensuales se han calculado correctamente",
      });

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el reporte mensual",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStationStats = async () => {
    try {
      setIsLoading(true);
      // Obtener el primer día del mes actual
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayISO = firstDayOfMonth.toISOString();

      // Query para obtener estadísticas por estación
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, role')
        .in('role', ['estación 1', 'estación 3', 'estación 4']);

      if (profilesError) {
        throw profilesError;
      }

      // Para cada perfil de estación, obtener sus órdenes
      const statsPromises = profilesData.map(async (profile) => {
        // Total de órdenes creadas por este usuario
        const { count: totalCount, error: totalError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', profile.user_id);

        if (totalError) {
          console.error('Error fetching total orders:', totalError);
          return null;
        }

        // Órdenes creadas este mes
        const { count: monthlyCount, error: monthlyError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', profile.user_id)
          .gte('created_at', firstDayISO);

        if (monthlyError) {
          console.error('Error fetching monthly orders:', monthlyError);
          return null;
        }

        return {
          user_name: profile.name,
          station: profile.role,
          total_orders: totalCount || 0,
          monthly_orders: monthlyCount || 0,
          user_id: profile.user_id
        };
      });

      const resolvedStats = await Promise.all(statsPromises);
      const validStats = resolvedStats.filter(stat => stat !== null) as StationStats[];
      
      // Ordenar por estación
      validStats.sort((a, b) => a.station.localeCompare(b.station));
      
      setStationStats(validStats);
    } catch (error) {
      console.error('Error fetching station stats:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      generateMonthlyReport();
      fetchStationStats();
    }
  }, [selectedMonth, open]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getMonthName = (monthString: string) => {
    const date = new Date(monthString + '-01');
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  const getCurrentMonthName = () => {
    const now = new Date();
    return now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Estadísticas e Informes del Sistema
          </DialogTitle>
          <DialogDescription>
            Vista general del rendimiento, métricas y reportes mensuales
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="monthly" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monthly">Informes Mensuales</TabsTrigger>
            <TabsTrigger value="stations">Estaciones de Trabajo</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="space-y-6">
            {/* Controles de filtro */}
            <div className="flex items-center gap-4">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const monthValue = date.toISOString().slice(0, 7);
                    return (
                      <SelectItem key={monthValue} value={monthValue}>
                        {getMonthName(monthValue)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button onClick={generateMonthlyReport} disabled={isLoading} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                {isLoading ? "Generando..." : "Actualizar Reporte"}
              </Button>
            </div>

            {/* Estadísticas generales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatsPanel />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Métricas Adicionales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rendimiento promedio:</span>
                      <span className="font-medium">85%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tiempo promedio por orden:</span>
                      <span className="font-medium">2.5 días</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Satisfacción del cliente:</span>
                      <span className="font-medium">4.2/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reporte mensual */}
            {monthlyStats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Resumen del mes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen de {getMonthName(monthlyStats.month)}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-primary/5 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{monthlyStats.totalOrders}</div>
                        <div className="text-sm text-muted-foreground">Total de Pedidos</div>
                      </div>
                      <div className="text-center p-4 bg-success/5 rounded-lg">
                        <div className="text-2xl font-bold text-success">
                          {formatCurrency(monthlyStats.totalRevenue)}
                        </div>
                        <div className="text-sm text-muted-foreground">Ingresos Totales</div>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-accent/5 rounded-lg">
                      <div className="text-2xl font-bold text-accent">
                        {formatCurrency(monthlyStats.deliveredRevenue)}
                      </div>
                      <div className="text-sm text-muted-foreground">Ingresos de Pedidos Entregados</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rendimiento por estación */}
                <Card>
                  <CardHeader>
                    <CardTitle>Rendimiento por Estación de Trabajo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(monthlyStats.workstationStats).map(([workType, count]) => (
                        <div key={workType} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <span className="font-medium">{workType}</span>
                          <div className="text-right">
                            <div className="font-bold text-lg">{count}</div>
                            <div className="text-xs text-muted-foreground">trabajos</div>
                          </div>
                        </div>
                      ))}
                      {Object.keys(monthlyStats.workstationStats).length === 0 && (
                        <div className="text-center text-muted-foreground py-4">
                          No hay datos de estaciones para este mes
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stations" className="space-y-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold">Estadísticas por Estación de Trabajo</span>
              <Badge variant="outline" className="text-xs">
                {getCurrentMonthName()}
              </Badge>
            </div>

            {isLoading ? (
              <div className="text-center py-8">Cargando estadísticas...</div>
            ) : (
              <div className="space-y-6">
                {stationStats.length > 0 ? (
                  stationStats.map((station, index) => (
                    <div key={station.user_id} className="space-y-3">
                      <div className="flex items-start justify-between p-4 rounded-lg border border-border bg-card/50">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-foreground">
                                {station.user_name}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {station.station}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm text-muted-foreground">Total de órdenes</p>
                                <p className="text-2xl font-bold text-foreground">
                                  {station.total_orders}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm text-muted-foreground">Este mes</p>
                                <p className="text-2xl font-bold text-primary">
                                  {station.monthly_orders}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            Período: {getCurrentMonthName()} (se reinicia cada mes)
                          </div>
                        </div>
                      </div>
                      
                      {index < stationStats.length - 1 && (
                        <Separator className="my-4" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay estadísticas disponibles
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}