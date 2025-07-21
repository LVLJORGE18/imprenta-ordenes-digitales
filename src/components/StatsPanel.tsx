import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, User, CalendarDays, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StationStats {
  user_name: string;
  station: string;
  total_orders: number;
  monthly_orders: number;
  user_id: string;
}

export default function StatsPanel() {
  const [stationStats, setStationStats] = useState<StationStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStationStats();
  }, []);

  const fetchStationStats = async () => {
    try {
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

  const getCurrentMonthName = () => {
    const now = new Date();
    return now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando estadísticas...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <CardTitle>Estadísticas por Estación de Trabajo</CardTitle>
        </div>
        <CardDescription>
          Rendimiento mensual de las estaciones - {getCurrentMonthName()}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
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
      </CardContent>
    </Card>
  );
}