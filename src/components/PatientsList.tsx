
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Patient } from "@/types";
import { getPatients, deletePatient } from "@/lib/patients";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, Search, Trash2, Phone, Mail, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { savePatient } from "@/lib/patients";

const PatientsList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const { toast } = useToast();

  const { 
    data: patients = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['patients'],
    queryFn: getPatients,
  });

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(
        patient => 
          patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (patient.dni && patient.dni.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);

  const handleDeletePatient = async () => {
    if (patientToDelete) {
      const error = await deletePatient(patientToDelete);
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Paciente Eliminado",
          description: "El paciente ha sido eliminado correctamente",
        });
        refetch();
      }
      
      setPatientToDelete(null);
    }
  };

  const handleSavePatient = async () => {
    if (!editingPatient || !editingPatient.name.trim()) {
      toast({
        title: "Nombre Requerido",
        description: "Por favor ingrese el nombre del paciente",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await savePatient(editingPatient);
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Paciente Guardado",
        description: "Los datos del paciente han sido guardados correctamente",
      });
      
      setShowNewPatientDialog(false);
      setEditingPatient(null);
      refetch();
    } catch (error) {
      console.error("Error al guardar paciente:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el paciente",
        variant: "destructive",
      });
    }
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setShowNewPatientDialog(true);
  };

  const handleNewPatient = () => {
    setEditingPatient({
      id: "",
      name: "",
      dni: "",
      phone: "",
      age: "",
      email: "",
      notes: ""
    });
    setShowNewPatientDialog(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pacientes</CardTitle>
          <CardDescription>Cargando pacientes...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pacientes</CardTitle>
          <CardDescription className="text-red-500">
            Error al cargar los pacientes. Por favor, intenta de nuevo.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Pacientes</CardTitle>
          <CardDescription>
            {patients.length} paciente{patients.length !== 1 ? 's' : ''} registrado{patients.length !== 1 ? 's' : ''}
          </CardDescription>
        </div>
        <Button onClick={handleNewPatient}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Paciente
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar paciente por nombre o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="space-y-2">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No se encontraron pacientes con el criterio de búsqueda.
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{patient.name}</h3>
                      {patient.dni && <p className="text-sm text-gray-600">DNI: {patient.dni}</p>}
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                        {patient.phone && (
                          <div className="flex items-center">
                            <Phone className="h-3.5 w-3.5 mr-1" />
                            {patient.phone}
                          </div>
                        )}
                        {patient.email && (
                          <div className="flex items-center">
                            <Mail className="h-3.5 w-3.5 mr-1" />
                            {patient.email}
                          </div>
                        )}
                        {patient.age && (
                          <div className="flex items-center">
                            Edad: {patient.age}
                          </div>
                        )}
                      </div>
                      {patient.notes && (
                        <div className="mt-2 flex items-start">
                          <FileText className="h-3.5 w-3.5 mr-1 mt-0.5" />
                          <span className="text-sm text-gray-600 line-clamp-2">{patient.notes}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditPatient(patient)}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPatientToDelete(patient.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>

      {/* Dialog para crear/editar paciente */}
      <Dialog open={showNewPatientDialog} onOpenChange={setShowNewPatientDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingPatient?.id ? "Editar Paciente" : "Crear Nuevo Paciente"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre Completo *</Label>
              <Input
                id="name"
                value={editingPatient?.name || ""}
                onChange={(e) => setEditingPatient(prev => prev ? {...prev, name: e.target.value} : null)}
                placeholder="Nombre y apellidos"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dni">DNI/Documento</Label>
              <Input
                id="dni"
                value={editingPatient?.dni || ""}
                onChange={(e) => setEditingPatient(prev => prev ? {...prev, dni: e.target.value} : null)}
                placeholder="Número de documento"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={editingPatient?.phone || ""}
                  onChange={(e) => setEditingPatient(prev => prev ? {...prev, phone: e.target.value} : null)}
                  placeholder="Número de teléfono"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age">Edad</Label>
                <Input
                  id="age"
                  value={editingPatient?.age || ""}
                  onChange={(e) => setEditingPatient(prev => prev ? {...prev, age: e.target.value} : null)}
                  placeholder="Edad"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editingPatient?.email || ""}
                onChange={(e) => setEditingPatient(prev => prev ? {...prev, email: e.target.value} : null)}
                placeholder="Correo electrónico"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={editingPatient?.notes || ""}
                onChange={(e) => setEditingPatient(prev => prev ? {...prev, notes: e.target.value} : null)}
                placeholder="Notas adicionales sobre el paciente"
                rows={3}
              />
            </div>
            <Button type="button" onClick={handleSavePatient}>
              Guardar Paciente
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert dialog para confirmar eliminación */}
      <AlertDialog open={!!patientToDelete} onOpenChange={(open) => !open && setPatientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el paciente seleccionado y todas sus consultas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePatient} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default PatientsList;
