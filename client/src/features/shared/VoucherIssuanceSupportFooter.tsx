import { Button } from "@/components/ui/button";
import {
  useGetUtilityFileMutation,
  useGetUtilityFilePathMutation,
} from "./store/utilityFilesApiSlice";
import { toast } from "sonner";
import { useState } from "react";
import { FileIcon, Loader, VideoIcon } from "lucide-react";
import { secureFileUrl } from "@/utils/secureFile";

const VoucherIssuanceSupportFooter = () => {
  const [getFile] = useGetUtilityFileMutation();
  const [getFilePath] = useGetUtilityFilePathMutation();
  const [loadingKey, setLoadingKey] = useState<null | string>(null);

  return (
    <footer className="w-full mt-auto pb-6 text-center text-sm text-muted-foreground">
      <div className="flex flex-col gap-2 items-center justify-center">
        <p className="font-medium text-accent-foreground">
          Having trouble issuing a voucher?
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
                const file_path = await getFilePath(
                  "voucher_distribution_sop",
                ).unwrap();
                console.log("FILE PATH", file_path);
                // const file = await getFile("voucher_distribution_sop").unwrap();

                // const blobUrl = URL.createObjectURL(
                //   new Blob([file], { type: "application/pdf" })
                // );

                window.open(secureFileUrl(file_path), "_blank");
                // setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
              } catch (err) {
                toast.error("Failed to load document");
              } finally {
                setLoadingKey(null);
              }
            }}
          >
            {loadingKey === "pdf" ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-1">
                <FileIcon /> Voucher Issunace Help
              </span>
            )}
          </Button>
          <Button
            variant="link"
            disabled={loadingKey === "voucher_video"}
            className="underline hover:text-primary flex items-center gap-2"
            onClick={async () => {
              try {
                setLoadingKey("voucher_video");

                // const file = await getFile(
                //   "voucher_distribution_video"
                // ).unwrap();
                const filePath = await getFilePath(
                  "voucher_distribution_video",
                ).unwrap();

                // const blobUrl = URL.createObjectURL(
                //   new Blob([file], { type: "video/mp4" })
                // );

                // window.open(blobUrl, "_blank");
                window.open(secureFileUrl(filePath), "_blank");
                // setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
              } catch (err) {
                toast.error("Failed to load video");
              } finally {
                setLoadingKey(null);
              }
            }}
          >
            {loadingKey === "voucher_video" ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <VideoIcon className="h-4 w-4" />
                Voucher Distribution Video Demo
              </>
            )}
          </Button>

          {/* <a
            href="https://your-video-demo-link.com"
            target="_blank"
            className="underline hover:text-primary"
          >
            🎥 Video Demo – Voucher Issunace
          </a> */}
        </div>
        <p>Contact Support</p>

        {/* Support Contact */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2 text-sm">
          {/* Contact 1 */}
          <div className="flex flex-col sm:flex-row sm:gap-1 items-center">
            <span className="text-black font-medium">Sminu Thomas</span>
            <a
              href="tel:+919811980042"
              className="underline hover:text-primary"
            >
              +91 9811980042
            </a>
            <span className="hidden sm:inline">|</span>
            <a
              href="mailto:sminu@titan.co.in"
              className="underline hover:text-primary"
            >
              sminu@titan.co.in
            </a>
          </div>

          {/* Divider (desktop only) */}
          <span className="hidden sm:inline text-muted-foreground">•</span>

          {/* Contact 2 */}
          <div className="flex flex-col sm:flex-row sm:gap-1 items-center">
            <span className="text-black font-medium">C G Harsha Vardhan</span>
            <a
              href="tel:+919573525695"
              className="underline hover:text-primary"
            >
              +91 9573525695
            </a>
            <span className="hidden sm:inline">|</span>
            <a
              href="mailto:cgharshavardhan@titan.co.in"
              className="underline hover:text-primary"
            >
              cgharshavardhan@titan.co.in
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default VoucherIssuanceSupportFooter;
