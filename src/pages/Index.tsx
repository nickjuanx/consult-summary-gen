
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import AudioRecorder from "@/components/AudioRecorder";
import ConsultationsList from "@/components/ConsultationsList";
import ConsultationDetail from "@/components/ConsultationDetail";
import PatientsList from "@/components/PatientsList";
import { ConsultationRecord } from "@/types";
import { groqApi } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ensureConsultationAudiosBucket } from "@/lib/ensureStorageBucket";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRecord | null>(null);
  const [newConsultation, setNewConsultation] = useState<ConsultationRecord | null>(null);
  const [showNewConsultation, setShowNewConsultation] = useState(false);
  const [activeTab, setActiveTab] = useState("consultas");
  const { toast } = useToast();

  useEffect(() => {
    // Try to load API key from localStorage on component mount
    const storedApiKey = localStorage.getItem("groqApiKey");
    if (storedApiKey) {
      groqApi.setApiKey(storedApiKey);
    }
    
    // Ensure the storage bucket exists
    ensureConsultationAudiosBucket().then(() => {
      console.log("Storage bucket check completed");
    }).catch(error => {
      console.error("Error setting up storage bucket:", error);
      toast({
        title: "Error de configuración",
        description: "No se pudo inicializar el almacenamiento. Algunas funciones pueden no estar disponibles.",
        variant: "destructive",
      });
    });
  }, [toast]);

  const handleRecordingComplete = (consultation: ConsultationRecord) => {
    console.log("Recording complete, displaying consultation:", consultation.id);
    setNewConsultation(consultation);
    setShowNewConsultation(true);
  };

  const handleBack = () => {
    setSelectedConsultation(null);
    setShowNewConsultation(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container py-6 md:py-8">
          {selectedConsultation ? (
            <ConsultationDetail 
              consultation={selectedConsultation}
              onBack={handleBack}
            />
          ) : showNewConsultation && newConsultation ? (
            <ConsultationDetail 
              consultation={newConsultation}
              onBack={handleBack}
            />
          ) : (
            <div className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="consultas">Consultas</TabsTrigger>
                  <TabsTrigger value="pacientes">Pacientes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="consultas">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
                    <div className="md:col-span-5 space-y-6">
                      <div>
                        <h2 className="text-xl font-medium text-medical-900 mb-4">Nueva Consulta</h2>
                        <AudioRecorder onRecordingComplete={handleRecordingComplete} />
                      </div>
                    </div>
                    
                    <div className="md:col-span-7 space-y-6">
                      <ConsultationsList onConsultationSelect={setSelectedConsultation} />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="pacientes">
                  <div className="mt-6">
                    <PatientsList />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>
      
      <footer className="border-t py-4 md:py-6">
        <div className="container">
          <p className="text-center text-sm text-gray-500">
            ConsultSummary — Herramienta de Transcripción y Resumen Médico
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
