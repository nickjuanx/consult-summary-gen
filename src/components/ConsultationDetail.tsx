
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsultationRecord } from "@/types";
import { Download, Clipboard, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

interface ConsultationDetailProps {
  consultation: ConsultationRecord;
  onBack: () => void;
}

const ConsultationDetail = ({ consultation, onBack }: ConsultationDetailProps) => {
  const [copied, setCopied] = useState<'transcription' | 'summary' | null>(null);
  const { toast } = useToast();
  
  const copyToClipboard = async (text: string, type: 'transcription' | 'summary') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      
      toast({
        title: "Copied to clipboard",
        description: `The ${type} has been copied to clipboard`,
      });
      
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };
  
  const downloadAudio = () => {
    if (consultation.audioUrl) {
      const a = document.createElement('a');
      a.href = consultation.audioUrl;
      a.download = `consultation_${consultation.patientName.replace(/\s+/g, '_')}_${format(new Date(consultation.dateTime), 'yyyy-MM-dd')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
  
  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-2">
        ← Back to all consultations
      </Button>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl text-medical-800">Patient: {consultation.patientName}</CardTitle>
          <CardDescription>
            Consultation on {format(new Date(consultation.dateTime), 'PPPP')} at {format(new Date(consultation.dateTime), 'p')}
          </CardDescription>
        </CardHeader>
        {consultation.audioUrl && (
          <CardContent>
            <div className="my-2">
              <audio controls className="w-full">
                <source src={consultation.audioUrl} type="audio/webm" />
                Your browser does not support the audio element.
              </audio>
            </div>
            <Button variant="outline" onClick={downloadAudio} className="mt-2">
              <Download className="mr-2 h-4 w-4" />
              Download Audio
            </Button>
          </CardContent>
        )}
      </Card>
      
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="transcription">Full Transcription</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-medical-800 flex justify-between items-center">
                <span>Consultation Summary</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copyToClipboard(consultation.summary || '', 'summary')}
                >
                  {copied === 'summary' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clipboard className="h-4 w-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-line">{consultation.summary}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transcription">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-medical-800 flex justify-between items-center">
                <span>Full Transcription</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copyToClipboard(consultation.transcription || '', 'transcription')}
                >
                  {copied === 'transcription' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clipboard className="h-4 w-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-line">{consultation.transcription}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsultationDetail;
