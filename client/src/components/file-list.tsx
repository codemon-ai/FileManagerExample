import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Download } from "lucide-react";
import type { File } from "@shared/schema";

function formatBytes(bytes: string) {
  const size = parseInt(bytes);
  if (size < 1024) return size + " B";
  const kb = size / 1024;
  if (kb < 1024) return kb.toFixed(1) + " KB";
  const mb = kb / 1024;
  return mb.toFixed(1) + " MB";
}

export default function FileList() {
  const { toast } = useToast();

  const { data: files, isLoading } = useQuery<File[]>({
    queryKey: ["/api/files"],
  });

  const downloadMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await apiRequest("GET", `/api/files/${fileId}/download`);
      const { url } = await response.json();
      window.open(url, "_blank");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading files...</div>;
  }

  if (!files?.length) {
    return <div className="text-center py-4">No files uploaded yet</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Filename</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => (
          <TableRow key={file.id}>
            <TableCell>{file.filename}</TableCell>
            <TableCell>{formatBytes(file.size)}</TableCell>
            <TableCell>
              {new Date(file.uploadedAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadMutation.mutate(file.id)}
                disabled={downloadMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
