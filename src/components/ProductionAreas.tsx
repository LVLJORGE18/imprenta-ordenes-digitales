import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Printer, Scissors } from "lucide-react";

interface Order {
  id: string;
  work_type: string;
  status: string;
}

export default function ProductionAreas() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders();
    
    // Configurar suscripción en tiempo real
    const channel = supabase
      .channel('production-areas-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, work_type, status')
        .in('status', ['En Proceso', 'Pendiente']);

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getWorksByType = (workType: string) => {
    return orders.filter(order => order.work_type === workType).length;
  };

  const areas = [
    {
      name: "Impresión Lonas",
      icon: ImageIcon,
      workType: "Impresión de Lonas",
      count: getWorksByType("Impresión de Lonas")
    },
    {
      name: "Impresión Vinil",
      icon: Printer,
      workType: "Impresión en Vinil",
      count: getWorksByType("Impresión en Vinil")
    },
    {
      name: "Vinil de Corte",
      icon: Scissors,
      workType: "Vinil de Corte",
      count: getWorksByType("Vinil de Corte")
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Áreas de Producción</CardTitle>
        <CardDescription>Estado de las áreas (tiempo real)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {areas.map((area, index) => {
          const IconComponent = area.icon;
          return (
            <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/50">
              <div className="flex items-center space-x-2">
                <IconComponent className="w-4 h-4 text-primary" />
                <span className="text-sm">{area.name}</span>
              </div>
              <Badge variant={area.count > 0 ? "default" : "outline"}>
                {area.count} trabajo{area.count !== 1 ? 's' : ''}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}