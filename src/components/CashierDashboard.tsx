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
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const searchOrders = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      
      // Buscar por folio o cliente, excluyendo los pedidos entregados y cancelados
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`folio.ilike.%${searchTerm}%,client.ilike.%${searchTerm}%`)
        .not('delivery_status', 'in', '(Entregado,Cancelado)')
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

  const deliverOrder = async (order: Order) => {
    // Validar que no tenga saldo pendiente
    if (order.remaining_balance && order.remaining_balance > 0) {
      toast({
        title: "Error",
        description: "Este trabajo presenta un saldo pendiente.",
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

      const { error } = await supabase
        .from('orders')
        .update({
          delivery_status: 'Entregado',
          delivered_at: new Date().toISOString(),
          delivered_by: profileData?.id
        })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: "Pedido entregado",
        description: "El pedido ha sido marcado como entregado exitosamente"
      });

      if (searchTerm) {
        searchOrders();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Error al marcar el pedido como entregado",
        variant: "destructive"
      });
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_status: 'Cancelado' })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Pedido cancelado",
        description: "El pedido ha sido cancelado exitosamente"
      });

      if (searchTerm) {
        searchOrders();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Error al cancelar el pedido",
        variant: "destructive"
      });
    }
  };

  const registerPayment = async () => {
    if (!selectedOrder || !paymentMethod) {
      toast({
        title: "Campos requeridos",
        description: "Completa todos los campos",
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

      const paymentAmountNum = parseFloat(paymentAmount) || 0;
      const newAdvancePayment = selectedOrder.advance_payment + paymentAmountNum;
      
      const updates: any = {
        advance_payment: newAdvancePayment,
        payment_method: paymentMethod
      };

      // Si el pago cubre el total, marcar como entregado
      if (newAdvancePayment >= (selectedOrder.total_amount || 0)) {
        updates.delivery_status = 'Entregado';
        updates.delivered_at = new Date().toISOString();
        updates.delivered_by = profileData?.id;
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast({
        title: "Pago registrado",
        description: updates.delivery_status === 'Entregado' 
          ? "Pago completado y pedido entregado"
          : "Pago parcial registrado exitosamente"
      });

      setSelectedOrder(null);
      setPaymentMethod("");
      setPaymentAmount("");
      setShowPaymentDialog(false);
      
      if (searchTerm) {
        searchOrders();
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Error al registrar el pago",
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

                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderDetails(true);
                      }}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                    
                    <div className="flex space-x-2">
                      {order.delivery_status !== 'Entregado' && order.delivery_status !== 'Cancelado' && (
                        <>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => cancelOrder(order.id)}
                          >
                            Cancelar Pedido
                          </Button>
                          <Button
                            onClick={() => deliverOrder(order)}
                            disabled={order.status !== 'Completado'}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Marcar como Entregado
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
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
      
      {/* Dialog para ver detalles de orden */}
      {selectedOrder && showOrderDetails && (
        <Dialog open={showOrderDetails} onOpenChange={() => {
          setShowOrderDetails(false);
          setSelectedOrder(null);
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles del Pedido {selectedOrder.folio}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Cliente:</label>
                  <p>{selectedOrder.client}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo de trabajo:</label>
                  <p>{selectedOrder.work_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Estado:</label>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Prioridad:</label>
                  <Badge className={getPriorityColor(selectedOrder.priority)}>
                    {selectedOrder.priority}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Total:</label>
                  <p className="font-semibold">{formatCurrency(selectedOrder.total_amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Anticipo:</label>
                  <p>{formatCurrency(selectedOrder.advance_payment)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Saldo pendiente:</label>
                  <p className={selectedOrder.remaining_balance && selectedOrder.remaining_balance > 0 ? "text-red-600 font-semibold" : "text-green-600"}>
                    {formatCurrency(selectedOrder.remaining_balance)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Estado de entrega:</label>
                  <Badge variant={selectedOrder.delivery_status === 'Entregado' ? 'default' : 'outline'}>
                    {selectedOrder.delivery_status}
                  </Badge>
                </div>
              </div>
              
              {selectedOrder.description && (
                <div>
                  <label className="text-sm font-medium">Descripción:</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{selectedOrder.description}</p>
                </div>
              )}
              
              {selectedOrder.notes && (
                <div>
                  <label className="text-sm font-medium">Notas:</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                {selectedOrder.remaining_balance && selectedOrder.remaining_balance > 0 && (
                  <Button onClick={() => {
                    setShowOrderDetails(false);
                    setShowPaymentDialog(true);
                  }}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Registrar Pago
                  </Button>
                )}
                <Button variant="outline" onClick={() => {
                  setShowOrderDetails(false);
                  setSelectedOrder(null);
                }}>
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para registrar pago */}
      {selectedOrder && showPaymentDialog && (
        <Dialog open={showPaymentDialog} onOpenChange={() => {
          setShowPaymentDialog(false);
          setSelectedOrder(null);
          setPaymentMethod("");
          setPaymentAmount("");
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pago - {selectedOrder.folio}</DialogTitle>
              <DialogDescription>
                Registra el pago para completar la entrega
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Total del pedido:</label>
                  <p className="font-semibold">{formatCurrency(selectedOrder.total_amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Ya pagado:</label>
                  <p>{formatCurrency(selectedOrder.advance_payment)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Saldo pendiente:</label>
                  <p className="font-semibold text-red-600">{formatCurrency(selectedOrder.remaining_balance)}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Monto a pagar:</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  min="0"
                  max={selectedOrder.remaining_balance || 0}
                  step="0.01"
                />
              </div>
              
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
                <Button variant="outline" onClick={() => {
                  setShowPaymentDialog(false);
                  setSelectedOrder(null);
                  setPaymentMethod("");
                  setPaymentAmount("");
                }}>
                  Cancelar
                </Button>
                <Button onClick={registerPayment}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Registrar Pago
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