
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { groqApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ApiKeyDialog = ({ open, onOpenChange }: ApiKeyDialogProps) => {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter the Groq API key.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      groqApi.setApiKey(apiKey.trim());
      
      // Store in local storage for persistence
      localStorage.setItem("groqApiKey", apiKey.trim());
      
      toast({
        title: "Success",
        description: "API key saved successfully",
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Groq API Key</DialogTitle>
          <DialogDescription>
            Enter your Groq API key to use the transcription and summarization services.
            You'll need the API key for the Whisper-large-v3 model.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-y-2 py-4">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="apiKey" className="sr-only">
              API Key
            </Label>
            <Input
              id="apiKey"
              placeholder="Enter your Groq API key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save API Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyDialog;
