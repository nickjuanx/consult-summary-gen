
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Patient } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getConsultationsByPatient } from "@/lib/storage";
import { getPatients } from "@/lib/patients";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface ConsultationsListProps {
  onConsultationSelect: (consultation: any) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const ConsultationsList = ({ onConsultationSelect }: ConsultationsListProps) => {
  const { user } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [symptomsData, setSymptomsData] = useState<any[]>([]);
  
  // Get patients list
  const { 
    data: patients = [],
    isLoading: isLoadingPatients
  } = useQuery({
    queryKey: ['patients', user?.id],
    queryFn: getPatients,
    enabled: !!user,
  });

  // Get consultations for selected patient
  const { 
    data: consultations = [],
    isLoading: isLoadingConsultations,
    error,
    refetch 
  } = useQuery({
    queryKey: ['consultationsByPatient', selectedPatientId],
    queryFn: () => selectedPatientId ? getConsultationsByPatient(selectedPatientId) : Promise.resolve([]),
    enabled: !!selectedPatientId,
  });

  // Process consultation data for charts when consultations change
  useEffect(() => {
    if (consultations && consultations.length > 0) {
      // Process monthly consultations data
      const consultationsByMonth: Record<number, number> = {};
      const currentYear = new Date().getFullYear();
      
      // Initialize all months with zero
      for (let i = 0; i < 12; i++) {
        consultationsByMonth[i] = 0;
      }
      
      // Count consultations by month for current year
      consultations.forEach(consultation => {
        const date = new Date(consultation.dateTime);
        if (date.getFullYear() === currentYear) {
          const month = date.getMonth();
          consultationsByMonth[month] = (consultationsByMonth[month] || 0) + 1;
        }
      });
      
      // Transform to chart format
      const monthlyData = Object.keys(consultationsByMonth).map(month => ({
        month: MONTHS[parseInt(month)],
        consultas: consultationsByMonth[parseInt(month)],
      }));
      
      setChartData(monthlyData);
      
      // Extract symptoms data from summaries for pie chart
      const symptomsMap: Record<string, number> = {};
      const keySymptoms = [
        "fiebre", "dolor", "tos", "náuseas", "vómitos", "diarrea", 
        "fatiga", "mareos", "dolor de cabeza", "dolor abdominal"
      ];
      
      consultations.forEach(consultation => {
        if (consultation.summary) {
          const lowerSummary = consultation.summary.toLowerCase();
          keySymptoms.forEach(symptom => {
            if (lowerSummary.includes(symptom)) {
              symptomsMap[symptom] = (symptomsMap[symptom] || 0) + 1;
            }
          });
        }
      });
      
      // Transform symptoms to chart data
      const symptomsChartData = Object.keys(symptomsMap)
        .map(symptom => ({
          name: symptom.charAt(0).toUpperCase() + symptom.slice(1),
          value: symptomsMap[symptom]
        }))
        .sort((a, b) => b.value - a.value) // Sort by frequency
        .slice(0, 5); // Get top 5 symptoms
      
      setSymptomsData(symptomsChartData);
    } else {
      setChartData([]);
      setSymptomsData([]);
    }
  }, [consultations]);

  const handlePatientChange = (value: string) => {
    setSelectedPatientId(value);
  };

  if (isLoadingPatients) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas de Paciente</CardTitle>
          <CardDescription>Cargando pacientes...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estadísticas de Paciente</CardTitle>
        <CardDescription>
          Seleccione un paciente para ver sus estadísticas de consultas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="patient-select">Seleccionar Paciente</Label>
            <Select
              value={selectedPatientId || ""}
              onValueChange={handlePatientChange}
            >
              <SelectTrigger id="patient-select">
                <SelectValue placeholder="Seleccionar paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient: Patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoadingConsultations && <div className="text-center py-4">Cargando datos...</div>}

          {error && (
            <div className="text-red-500 text-center py-4">
              Error al cargar los datos. Por favor, intente de nuevo.
            </div>
          )}

          {selectedPatientId && !isLoadingConsultations && consultations.length === 0 && (
            <div className="text-center py-4">
              No hay consultas registradas para este paciente.
            </div>
          )}

          {consultations.length > 0 && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium mb-4">Consultas por Mes (Año Actual)</h3>
                <div className="h-80">
                  <ChartContainer
                    config={{
                      consultas: {
                        label: "Consultas",
                        color: "#2563eb"
                      }
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="consultas" fill="#2563eb" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </div>

              {symptomsData.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Síntomas Frecuentes</h3>
                  <div className="h-80">
                    <ChartContainer
                      config={{
                        value: {
                          label: "Frecuencia"
                        }
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={symptomsData}
                            cx="50%"
                            cy="50%"
                            labelLine
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {symptomsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-medium mb-2">Resumen</h3>
                <p>Total de consultas: <strong>{consultations.length}</strong></p>
                <p>Última consulta: <strong>{
                  format(
                    new Date(consultations[0].dateTime), 
                    "PPpp", 
                    { locale: es }
                  )
                }</strong></p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsultationsList;
