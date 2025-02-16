import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Upload } from "lucide-react";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function FileUpload() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { register, handleSubmit, reset } = useForm();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      try {
        // Get signed URL
        // 캐싱하려는 것을 방지하기 위한 timestamp 추가
        const response = await apiRequest("POST", `/api/files/upload-url?timestamp=${Date.now()}`, {
          filename: file.name,
          key: `uploads/${Date.now()}-${file.name}`,
          size: file.size.toString(),
          contentType: file.type || 'application/octet-stream',
        });
        const data = await response.json();

        if (!data.url) {
          throw new Error("Failed to get upload URL");
        }

        console.log('Uploading file with content type:', file.type || 'application/octet-stream');

        // Upload to S3
        const uploadResponse = await fetch(data.url, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type || 'application/octet-stream',
          },
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('S3 Upload Error:', {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            errorBody: errorText,
            headers: Object.fromEntries(uploadResponse.headers.entries())
          });
          throw new Error(`Failed to upload file to S3: ${uploadResponse.status} ${errorText}`);
        }

        return data.file;
      } catch (error) {
        console.error("Upload error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
      reset();
      setSelectedFile(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      });
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({
        title: "Error",
        description: "File size exceeds 50MB limit",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(selectedFile);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex gap-4">
        <Input
          type="file"
          {...register("file")}
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="flex-1"
          accept="*/*"
        />
        <Button 
          type="submit" 
          disabled={!selectedFile || uploadMutation.isPending}
        >
          {uploadMutation.isPending ? (
            "Uploading..."
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </>
          )}
        </Button>
      </div>
      {uploadMutation.isPending && (
        <div className="text-sm text-muted-foreground">
          Uploading file, please wait...
        </div>
      )}
    </form>
  );
}