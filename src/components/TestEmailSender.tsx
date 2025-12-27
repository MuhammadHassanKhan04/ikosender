import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FlaskConical, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TestEmailSenderProps {
  subject: string;
  body: string;
  senderName: string;
  senderEmail: string;
  smtpEmail: string;
  appPassword: string;
}

const TestEmailSender = ({ subject, body, senderName, senderEmail, smtpEmail, appPassword }: TestEmailSenderProps) => {
  const [open, setOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim() || !body.trim()) {
      toast({
        title: "Error",
        description: "Please fill in subject and body first",
        variant: "destructive",
      });
      return;
    }

    if (!smtpEmail || !appPassword) {
      toast({
        title: "Error",
        description: "Please configure SMTP credentials first",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    setSent(false);

    try {
      const { data, error } = await supabase.functions.invoke("send-bulk-email", {
        body: {
          smtpEmail,
          appPassword,
          senderName: senderName || "Test Sender",
          senderEmail: senderEmail || smtpEmail,
          recipients: [testEmail],
          subject: `[TEST] ${subject}`,
          body,
        },
      });

      if (error) throw error;

      const results = data.results || [];
      const success = results.some((r: any) => r.status === "success");

      if (success) {
        setSent(true);
        toast({
          title: "Test Email Sent!",
          description: `Check ${testEmail} for your test email`,
        });
      } else {
        throw new Error("Failed to send test email");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSent(false); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FlaskConical className="h-4 w-4 mr-2" />
          Send Test
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Send Test Email
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Send a test email to yourself before sending to all recipients.
          </p>
          
          <div className="space-y-2">
            <Label>Your Email Address</Label>
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={isSending}
            />
          </div>
          
          {sent ? (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-success/10 text-success">
              <CheckCircle2 className="h-5 w-5" />
              <span>Test email sent successfully!</span>
            </div>
          ) : (
            <Button onClick={handleSendTest} disabled={isSending} className="w-full">
              {isSending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                <><FlaskConical className="h-4 w-4 mr-2" /> Send Test Email</>
              )}
            </Button>
          )}
          
          <p className="text-xs text-muted-foreground">
            Subject will be prefixed with [TEST] to identify it easily.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TestEmailSender;
