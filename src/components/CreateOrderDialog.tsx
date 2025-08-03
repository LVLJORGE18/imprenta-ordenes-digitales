import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  ImageIcon, 
  Printer, 
  Scissors, 
  PaintBucket,
  FileImage,
  Calendar,
  User,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated: (order: any) => void;
}

const WORK_TYPES = [
  { id: "impresion-lonas", name: "Impresión de Lonas", icon: ImageIcon, folder: "Lonas" },
  { id: "impresion-vinil", name: "Impresión de Vinil", icon: Printer, folder: "Vinil_Impresion" },
  { id: "vinil-corte", name: "Vinil de Corte", icon: Scissors, folder: "Vinil_Corte" },
  { id: "sublimacion", name: "Sublimación", icon: PaintBucket, folder: "Sublimacion" },
  { id: "ploteo", name: "Ploteo", icon: FileImage, folder: "Ploteo" }
];

const PRIORITIES = [
  { value: "baja", label: "Baja", color: "secondary" },
  { value: "media", label: "Media", color: "default" },
  { value: "alta", label: "Alta", color: "destructive" }
];

export default function CreateOrderDialog({ open, onOpenChange, onOrderCreated }: CreateOrderDialogProps) {
  const [formData, setFormData] = useState({
    client: "",
    phone: "",
    email: "",
    workType: "",
    priority: "media",
    dueDate: "",
    description: "",
    notes: "",
    totalAmount: "",
    advancePayment: ""
  });

  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File[] }>({});
  const { toast } = useToast();

  const generateFolio = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${year}${month}${day}-${random}`;
  };

  const handleFileUpload = (area: string, files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      setSelectedFiles(prev => ({
        ...prev,
        [area]: [...(prev[area] || []), ...fileArray]
      }));
    }
  };

  const removeFile = (area: string, index: number) => {
    setSelectedFiles(prev => ({
      ...prev,
      [area]: prev[area]?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async () => {
    if (!formData.client || !formData.workType || !formData.dueDate || !formData.totalAmount) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Usuario no autenticado",
          variant: "destructive"
        });
        return;
      }

      const folio = generateFolio();
      const workTypeName = WORK_TYPES.find(w => w.id === formData.workType)?.name || formData.workType;
      const priorityLabel = PRIORITIES.find(p => p.value === formData.priority)?.label || "Media";
      
      const totalAmount = parseFloat(formData.totalAmount) || 0;
      const advancePayment = parseFloat(formData.advancePayment) || 0;
      const remainingBalance = totalAmount - advancePayment;
      
      // Agregar información de pago a las notas si hay saldo pendiente
      let finalNotes = formData.notes || "";
      if (remainingBalance > 0) {
        const paymentInfo = `\n\n--- INFORMACIÓN DE PAGO ---\nTotal: $${totalAmount.toFixed(2)}\nAnticipo: $${advancePayment.toFixed(2)}\nSaldo pendiente: $${remainingBalance.toFixed(2)}`;
        finalNotes += paymentInfo;
      } else if (remainingBalance === 0 && advancePayment > 0) {
        finalNotes += `\n\n--- INFORMACIÓN DE PAGO ---\nTotal: $${totalAmount.toFixed(2)}\nPAGO COMPLETO RECIBIDO`;
      }

      // Subir archivos a Supabase Storage
      let uploadedFiles = [];
      for (const [area, files] of Object.entries(selectedFiles)) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${folio}/${area}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('order-files')
            .upload(fileName, file);
          
          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            throw uploadError;
          }
          
          uploadedFiles.push({
            name: file.name,
            path: uploadData.path,
            size: file.size,
            type: file.type,
            area: area
          });
        }
      }

      const { data, error } = await supabase
        .from('orders')
        .insert({
          folio: folio,
          client: formData.client,
          work_type: workTypeName,
          status: "Pendiente",
          priority: priorityLabel,
          description: formData.description || null,
          notes: finalNotes || null,
          files: uploadedFiles.length > 0 ? uploadedFiles : null,
          created_by: user.id,
          due_date: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
          total_amount: totalAmount,
          advance_payment: advancePayment
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        toast({
          title: "Error",
          description: "No se pudo crear la orden",
          variant: "destructive"
        });
        return;
      }

      onOrderCreated(data);
      onOpenChange(false);
      
      toast({
        title: "Orden creada exitosamente",
        description: `Folio: ${folio}`,
      });

      // Reset form
      setFormData({
        client: "",
        phone: "",
        email: "",
        workType: "",
        priority: "media",
        dueDate: "",
        description: "",
        notes: "",
        totalAmount: "",
        advancePayment: ""
      });
      setSelectedFiles({});
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Nueva Orden de Trabajo</span>
          </DialogTitle>
          <DialogDescription>
            Completa la información para crear una nueva orden de trabajo
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Información del Cliente</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="client">Cliente *</Label>
                <Input
                  id="client"
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  placeholder="Nombre del cliente o empresa"
                />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Número de contacto"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Detalles del Trabajo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Detalles del Trabajo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="workType">Tipo de Trabajo *</Label>
                <Select value={formData.workType} onValueChange={(value) => setFormData({ ...formData, workType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de trabajo" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center space-x-2">
                          <type.icon className="w-4 h-4" />
                          <span>{type.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div className="flex items-center space-x-2">
                          <Badge variant={priority.color as any}>{priority.label}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                 <Label htmlFor="dueDate">Fecha de Entrega *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Información de Pago */}
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <span>💰</span>
                <span>Información de Pago</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalAmount">Total del Trabajo *</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="advancePayment">Anticipo/Pago</Label>
                <Input
                  id="advancePayment"
                  type="number"
                  step="0.01"
                  min="0"
                  max={formData.totalAmount || undefined}
                  value={formData.advancePayment}
                  onChange={(e) => setFormData({ ...formData, advancePayment: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              {formData.totalAmount && formData.advancePayment && (
                <div className="col-span-1 md:col-span-2 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">
                    Saldo pendiente: ${(parseFloat(formData.totalAmount) - parseFloat(formData.advancePayment)).toFixed(2)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Descripción y Notas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Descripción del Trabajo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe los detalles del trabajo..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notas Adicionales</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas especiales, instrucciones adicionales..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Áreas de Producción y Archivos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Archivos por Área de Producción</CardTitle>
            <CardDescription>
              Sube los archivos correspondientes a cada área. Se organizarán automáticamente en las carpetas de producción.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {WORK_TYPES.map((area) => {
                const Icon = area.icon;
                const files = selectedFiles[area.id] || [];
                
                return (
                  <div key={area.id} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <div>
                        <h4 className="font-medium text-sm">{area.name}</h4>
                        <p className="text-xs text-muted-foreground">Carpeta: {area.folder}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`files-${area.id}`} className="cursor-pointer">
                        <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-lg p-3 text-center transition-colors">
                          <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            Click para subir archivos
                          </p>
                          <Input
                            id={`files-${area.id}`}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => handleFileUpload(area.id, e.target.files)}
                            accept=".jpg,.jpeg,.png,.pdf,.ai,.eps,.svg"
                          />
                        </div>
                      </Label>

                      {files.length > 0 && (
                        <div className="space-y-1">
                          {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between text-xs bg-muted/50 rounded p-2">
                              <span className="truncate flex-1">{file.name}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFile(area.id, index)}
                                className="h-6 w-6 p-0"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="bg-accent hover:bg-accent/90">
            Crear Orden
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}