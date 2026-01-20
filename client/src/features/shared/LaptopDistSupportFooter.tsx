import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useGetUtilityFileMutation,
  useGetUtilityFilePathMutation,
} from "./store/utilityFilesApiSlice";
import { FileIcon, Loader, VideoIcon } from "lucide-react";
import { useState } from "react";
import { secureFileUrl } from "@/utils/secureFile";

const LaptopDistSupportFooter = ({ trouble }: { trouble: string }) => {
  const [getFile] = useGetUtilityFileMutation();
  const [getFilePath] = useGetUtilityFilePathMutation();
  const [loadingKey, setLoadingKey] = useState<null | string>(null);

  return (
    <footer className="w-full mt-auto pb-6 text-center text-sm text-muted-foreground">
      <div className="flex flex-col gap-2 items-center justify-center">
        <p className="font-medium text-accent-foreground">
          Having trouble {trouble}?
        </p>
        <p>Contact Support</p>

        {/* <p>
          <span className=" text-black font-medium ">
            Regional Helpdesk: {"{Contact person}"} -{" "}
          </span>
          <a href="tel:+911234567890" className="underline hover:text-primary">
            +91 9998889990
          </a>{" "}
          |{" "}
          <a
            href="mailto:sminu@titan.co.in"
            className="underline hover:text-primary"
          >
            helpdesk@titan.co.in
          </a>
        </p> */}

        {/* Support Contact */}
        <p>
          <span className=" text-black font-medium ">Admin: Sminu - </span>
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

                const file = await getFile("laptop_distribution_sop").unwrap();

                const blobUrl = URL.createObjectURL(
                  new Blob([file], { type: "application/pdf" })
                );

                window.open(blobUrl, "_blank");
                setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
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
                <FileIcon /> Laptop Distribution Help
              </span>
            )}
          </Button>

          <Button
            variant="link"
            disabled={loadingKey === "normal_video"}
            className="underline hover:text-primary flex items-center gap-2"
            onClick={async () => {
              try {
                setLoadingKey("normal_video");

                // const file = await getFile(
                //   "laptop_distribution_normal_video"
                // ).unwrap();
                const filePath = await getFilePath(
                  "laptop_distribution_normal_video"
                ).unwrap();

                // const blobUrl = URL.createObjectURL(
                //   new Blob([file], { type: "video/mp4" })
                // );

                window.open(secureFileUrl(filePath), "_blank");
                // window.open(blobUrl, "_blank");
                // setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
              } catch (err) {
                toast.error("Failed to load video");
              } finally {
                setLoadingKey(null);
              }
            }}
          >
            {loadingKey === "normal_video" ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <VideoIcon className="h-4 w-4" />
                Laptop Issuance Video Demo
              </>
            )}
          </Button>

          {/* <a
            href="https://your-video-demo-link.com"
            target="_blank"
            className="underline hover:text-primary"
          >
            🎥 Video Demo – Laptop Distribution
          </a> */}
        </div>
      </div>
    </footer>
  );
};

export default LaptopDistSupportFooter;
