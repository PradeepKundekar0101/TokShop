import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ScanForm {
  manifest_id: string;
  scan_form_url?: string;
  status?: string;
  created_at?: string;
  shipment_count?: number;
  carrier?: string;
}

interface ScanFormViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanForms: ScanForm[];
  isLoading?: boolean;
}

export function ScanFormViewerDialog({
  open,
  onOpenChange,
  scanForms,
  isLoading = false,
}: ScanFormViewerDialogProps) {
  const handleOpenScanForm = (url: string) => {
    window.open(url, '_blank');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>USPS SCAN Forms</DialogTitle>
          <DialogDescription>
            View and download your USPS SCAN forms for batch shipments
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading scan forms...</div>
          </div>
        ) : scanForms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No scan forms found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Generate shipping labels and create a SCAN form to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {scanForms.map((form, index) => (
              <Card key={form.manifest_id || index}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        USPS SCAN Form {scanForms.length > 1 ? `${index + 1}` : ''}
                      </CardTitle>
                      {form.created_at && (
                        <p className="text-sm text-muted-foreground">
                          Created: {formatDate(form.created_at)}
                        </p>
                      )}
                    </div>
                    {form.status && (
                      <Badge variant={form.status === 'success' ? 'default' : 'secondary'}>
                        {form.status}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {form.carrier && (
                      <div>
                        <span className="text-muted-foreground">Carrier:</span>
                        <span className="ml-2 font-medium">{form.carrier}</span>
                      </div>
                    )}
                    {form.shipment_count !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Shipments:</span>
                        <span className="ml-2 font-medium">{form.shipment_count}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="gap-2 flex-wrap">
                  {form.scan_form_url ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleOpenScanForm(form.scan_form_url!)}
                        data-testid={`button-view-form-${index}`}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Form
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = form.scan_form_url!;
                          link.download = `scan-form-${form.manifest_id}.pdf`;
                          link.click();
                        }}
                        data-testid={`button-download-form-${index}`}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Scan form URL not available
                    </p>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
