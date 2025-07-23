import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, FileText, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import ProductionOrderDialog from "./ProductionOrderDialog";

interface Order {
  id: string;
  folio: string;
  client: string;
  work_type: string;
  description: string;
  status: string;
  priority: string;
  production_status: string;
  created_at: string;
  due_date: string;
  files: any;
  notes: string;
  created_by: string;
  updated_at: string;
  total_amount: number;
  advance_payment: number;
  remaining_balance: number;
  delivery_status: string;
  payment_method: string;
  delivered_at: string;
  delivered_by: string;
  completed_at: string;
  completed_by: string;
}

const ProductionDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Obtener usuario actual
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        setUser(profile);
      }
    };
    getUser();
  }, []);

  // Cargar órdenes
  useEffect(() => {
    loadOrders();
  }, []);

  // Filtrar órdenes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order =>
        order.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.work_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      
      // Cargar órdenes que no estén entregadas ni canceladas y que estén en producción
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .not('delivery_status', 'in', '(Entregado,Cancelado)')
        .eq('status', 'En Proceso')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading orders:', error);
        toast.error('Error al cargar las órdenes');
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las órdenes');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsCompleted = async (orderId: string) => {
    if (!user) {
      toast.error('Usuario no identificado');
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          production_status: 'Completado',
          completed_at: new Date().toISOString(),
          completed_by: user.id,
          status: 'Listo para Entrega'
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error marking as completed:', error);
        toast.error('Error al marcar como completado');
        return;
      }

      toast.success('Trabajo marcado como completado');
      loadOrders();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al marcar como completado');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'destructive';
      case 'Media': return 'default';
      case 'Baja': return 'secondary';
      default: return 'default';
    }
  };

  const getProductionStatusColor = (status: string) => {
    switch (status) {
      case 'Pendiente': return 'secondary';
      case 'En Proceso': return 'default';
      case 'Completado': return 'default';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Panel de Producción
          </h1>
          <p className="text-muted-foreground">
            Gestiona y completa las órdenes de trabajo
          </p>
        </div>

        {/* Búsqueda */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por folio, cliente o tipo de trabajo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de órdenes */}
        {isLoading ? (
          <div className="text-center">Cargando órdenes...</div>
        ) : (
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    {orders.length === 0 
                      ? "No hay órdenes de trabajo disponibles"
                      : "No se encontraron órdenes que coincidan con la búsqueda"
                    }
                  </CardContent>
                </Card>
              ) : (
                filteredOrders.map((order) => (
                  <Card 
                    key={order.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow duration-200"
                    onClick={() => handleOrderClick(order)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Folio: {order.folio}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Cliente: {order.client}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge variant={getPriorityColor(order.priority)}>
                            {order.priority}
                          </Badge>
                          <Badge variant={getProductionStatusColor(order.production_status)}>
                            {order.production_status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium text-sm">{order.work_type}</p>
                          {order.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {order.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Creado: {formatDate(order.created_at)}</span>
                          </div>
                          {order.due_date && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Entrega: {formatDate(order.due_date)}</span>
                            </div>
                          )}
                        </div>

                        {order.production_status === 'Pendiente' && (
                          <div className="pt-2">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsCompleted(order.id);
                              }}
                              className="w-full"
                              variant="default"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Marcar como Completado
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        {/* Dialog de detalles */}
        {selectedOrder && (
          <ProductionOrderDialog
            order={selectedOrder}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onCompleteOrder={() => markAsCompleted(selectedOrder.id)}
          />
        )}
      </div>
    </div>
  );
};

export default ProductionDashboard;