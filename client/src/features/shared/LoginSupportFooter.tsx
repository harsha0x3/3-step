import { Button } from "@/components/ui/button";
import {
  useGetUtilityFileMutation,
  useGetUtilityFilePathMutation,
} from "./store/utilityFilesApiSlice";
import { toast } from "sonner";
import { useState } from "react";
import { FileIcon, Loader, VideoIcon } from "lucide-react";
import { secureFileUrl } from "@/utils/secureFile";

const LoginSupportFooter = () => {
  const [getFile] = useGetUtilityFileMutation();
  const [getFilePath] = useGetUtilityFilePathMutation();
  const [loadingKey, setLoadingKey] = useState<null | string>(null);

  return (
    <footer className="w-full mt-auto pb-6 text-center text-sm text-muted-foreground">
      <div className="flex flex-col gap-2 items-center justify-center">
        <p className="font-medium text-accent-foreground">
          Need help logging in?
        </p>

        {/* Support Contact */}
        <p>
          Contact Support:{" "}
          <span className=" text-black font-medium ">Sminu - </span>
          <a href="tel:+911234567890" className="underline hover:text-primary">
            +91 9811980042
          </a>{" "}
          |{" "}
          <a
            href="mailto:sminu@titan.co.in"
            className="underline hover:text-primary"
          >
            sminu@titan.co.in
          </a>
        </p>

        {/* Useful Links */}
        <div className="flex flex-col sm:flex-row sm:gap-3 items-center gap-1 mt-2">
          <Button
            variant="link"
            disabled={loadingKey === "pdf"}
            className="underline hover:text-primary flex items-center gap-2"
            onClick={async () => {
              try {
                setLoadingKey("pdf");

                const file = await getFile("login_sop").unwrap();

                const blobUrl = URL.createObjectURL(
                  new Blob([file], { type: "application/pdf" })
                );

                const link = document.createElement("a");
                link.href = blobUrl;
                link.download = "login_sop.pdf";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
              } catch (err) {
                toast.error("Failed to download document");
              } finally {
                setLoadingKey(null);
              }
            }}
          >
            {loadingKey === "pdf" ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-1">
                <FileIcon /> Login Help
              </span>
            )}
          </Button>
          <Button
            variant="link"
            disabled={loadingKey === "login_video"}
            className="underline hover:text-primary flex items-center gap-2"
            onClick={async () => {
              try {
                setLoadingKey("login_video");

                const file = await getFile("login_video").unwrap();

                const blobUrl = URL.createObjectURL(
                  new Blob([file], { type: "video/mp4" })
                );

                const link = document.createElement("a");
                link.href = blobUrl;
                link.download = "login_video.mp4";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
              } catch (err) {
                toast.error("Failed to download video");
              } finally {
                setLoadingKey(null);
              }
            }}
          >
            {loadingKey === "login_video" ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <VideoIcon className="h-4 w-4" />
                Login Video Demo
              </>
            )}
          </Button>

          {/* <a
            href="https://your-video-demo-link.com"
            target="_blank"
            className="underline hover:text-primary"
          >
            🎥 Video Demo – First-time Login
          </a> */}
        </div>
      </div>
    </footer>
  );
};

export default LoginSupportFooter;
