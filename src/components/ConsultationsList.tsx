
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ConsultationRecord } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getConsultations } from "@/lib/storage";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

interface ConsultationsListProps {
  onConsultationSelect: (consultation: ConsultationRecord) => void;
}

const ConsultationsList = ({ onConsultationSelect }: ConsultationsListProps) => {
  const { user } = useAuth();
  
  const { 
    data: consultations = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['consultations', user?.id],
    queryFn: getConsultations,
    enabled: !!user,
  });

  // Refrescar la lista cuando cambie el usuario
  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [user, refetch]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Consultas Anteriores</CardTitle>
          <CardDescription>Cargando consultas...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Consultas Anteriores</CardTitle>
          <CardDescription className="text-red-500">
            Error al cargar las consultas. Por favor, intenta de nuevo.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (consultations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Consultas Anteriores</CardTitle>
          <CardDescription>No hay consultas guardadas todavía</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formatDate = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return format(date, "PPpp", { locale: es });
    } catch (e) {
      return dateTimeStr;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consultas Anteriores</CardTitle>
        <CardDescription>
          {consultations.length} consulta{consultations.length !== 1 ? 's' : ''} guardada{consultations.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {consultations.map((consultation) => (
            <div
              key={consultation.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onConsultationSelect(consultation)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{consultation.patientName}</h3>
                  <p className="text-sm text-gray-500">{formatDate(consultation.dateTime)}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConsultationSelect(consultation);
                  }}
                >
                  Ver
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsultationsList;
