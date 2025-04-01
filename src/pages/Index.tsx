
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import AudioRecorder from "@/components/AudioRecorder";
import ConsultationsList from "@/components/ConsultationsList";
import ConsultationDetail from "@/components/ConsultationDetail";
import { ConsultationRecord } from "@/types";
import { groqApi } from "@/lib/api";

const Index = () => {
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRecord | null>(null);
  const [newConsultation, setNewConsultation] = useState<ConsultationRecord | null>(null);
  const [showNewConsultation, setShowNewConsultation] = useState(false);

  useEffect(() => {
    // Try to load API key from localStorage on component mount
    const storedApiKey = localStorage.getItem("groqApiKey");
    if (storedApiKey) {
      groqApi.setApiKey(storedApiKey);
    }
  }, []);

  const handleRecordingComplete = (consultation: ConsultationRecord) => {
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
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
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
