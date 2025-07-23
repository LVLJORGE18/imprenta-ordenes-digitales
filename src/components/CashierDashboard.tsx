import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Package, DollarSign, CheckCircle, Settings, LogOut, Moon, Sun, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Order {
  id: string;
  folio: string;
  client: string;
  work_type: string;
  status: string;
  priority: string;
  description: string | null;
  notes: string | null;
  total_amount: number | null;
  advance_payment: number;
  remaining_balance: number | null;
  delivery_status: string;
  payment_method: string | null;
  delivered_at: string | null;
  created_at: string;
  due_date: string | null;
}

const PAYMENT_METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "transferencia", label: "Transferencia Bancaria" }
];

export default function CashierDashboard({ onLogout }: { onLogout?: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const searchOrders = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      
      // Buscar por folio o cliente
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`folio.ilike.%${searchTerm}%,client.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setSearchResults(data || []);
    } catch (error: any) {
      console.error('Error searching orders:', error);
      toast({
        title: "Error",
        description: "Error al buscar pedidos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsDelivered = async () => {
    if (!selectedOrder || !paymentMethod) {
      toast({
        title: "Campos requeridos",
        description: "Selecciona un método de pago",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const updates: any = {
        delivery_status: 'Entregado',
        payment_method: paymentMethod,
        delivered_at: new Date().toISOString(),
        delivered_by: profileData?.id
      };

      // Si hay saldo pendiente y se está pagando, actualizar el saldo
      if (selectedOrder.remaining_balance && selectedOrder.remaining_balance > 0) {
        updates.advance_payment = selectedOrder.total_amount || selectedOrder.advance_payment;
        updates.remaining_balance = 0;
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', selectedOrder.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Pedido entregado",
        description: `El pedido ${selectedOrder.folio} ha sido marcado como entregado`
      });

      setSelectedOrder(null);
      setPaymentMethod("");
      
      // Actualizar resultados de búsqueda
      if (searchTerm) {
        searchOrders();
      }

    } catch (error: any) {
      console.error('Error marking as delivered:', error);
      toast({
        title: "Error",
        description: "Error al marcar como entregado",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "$0.00";
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'En Proceso': 'bg-blue-100 text-blue-800',
      'Completado': 'bg-green-100 text-green-800',
      'Entregado': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'Alta': 'bg-red-100 text-red-800',
      'Media': 'bg-orange-100 text-orange-800',
      'Baja': 'bg-green-100 text-green-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Printer className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">ORTEGA</h1>
              <p className="text-sm text-muted-foreground">Gestión de Caja</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Configuración</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <div className="px-2 py-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode" className="text-sm flex items-center space-x-2">
                      {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      <span>Modo Oscuro</span>
                    </Label>
                    <Switch
                      id="dark-mode"
                      checked={theme === 'dark'}
                      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    />
                  </div>
                </div>
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">

      {/* Barra de búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Buscar Pedidos</span>
          </CardTitle>
          <CardDescription>
            Busca pedidos por número de folio o nombre del cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Ingresa número de folio o nombre del cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchOrders()}
            />
            <Button onClick={searchOrders} disabled={isLoading}>
              <Search className="w-4 h-4 mr-2" />
              {isLoading ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados de búsqueda */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de Búsqueda</CardTitle>
            <CardDescription>
              Se encontraron {searchResults.length} pedido(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Package className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-semibold">{order.folio}</h3>
                        <p className="text-sm text-muted-foreground">{order.client}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <Badge className={getPriorityColor(order.priority)}>
                        {order.priority}
                      </Badge>
                      <Badge variant={order.delivery_status === 'Entregado' ? 'default' : 'outline'}>
                        {order.delivery_status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Tipo:</span>
                      <p>{order.work_type}</p>
                    </div>
                    <div>
                      <span className="font-medium">Total:</span>
                      <p>{formatCurrency(order.total_amount)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Anticipo:</span>
                      <p>{formatCurrency(order.advance_payment)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Saldo:</span>
                      <p className={order.remaining_balance && order.remaining_balance > 0 ? "text-red-600 font-semibold" : ""}>
                        {formatCurrency(order.remaining_balance)}
                      </p>
                    </div>
                  </div>

                  {order.delivery_status !== 'Entregado' && (
                    <div className="flex justify-end">
                      <Button
                        onClick={() => setSelectedOrder(order)}
                        disabled={order.status !== 'Completado'}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marcar como Entregado
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {searchTerm && searchResults.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No se encontraron pedidos con ese criterio de búsqueda</p>
          </CardContent>
        </Card>
      )}
      
      {/* Dialog para confirmar entrega */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Entregar Pedido</DialogTitle>
              <DialogDescription>
                Confirma la entrega del pedido {selectedOrder.folio}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cliente:</label>
                <p>{selectedOrder.client}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Total del pedido:</label>
                <p>{formatCurrency(selectedOrder.total_amount)}</p>
              </div>
              {selectedOrder.remaining_balance && selectedOrder.remaining_balance > 0 && (
                <div className="space-y-2 p-3 bg-yellow-50 rounded-lg">
                  <label className="text-sm font-medium text-yellow-800">Saldo pendiente:</label>
                  <p className="font-semibold text-yellow-800">{formatCurrency(selectedOrder.remaining_balance)}</p>
                  <p className="text-xs text-yellow-700">
                    El cliente debe pagar el saldo pendiente para completar la entrega
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Método de pago:</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Cancelar
                </Button>
                <Button onClick={markAsDelivered}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Confirmar Entrega
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </div>
  );
}