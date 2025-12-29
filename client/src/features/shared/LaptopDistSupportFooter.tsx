import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useGetUtilityFileMutation } from "./store/utilityFilesApiSlice";

const LaptopDistSupportFooter = ({ trouble }: { trouble: string }) => {
  const [getFile] = useGetUtilityFileMutation();

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
            +91 9811980043
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
            className="underline hover:text-primary"
            onClick={async () => {
              try {
                const file = await getFile("laptop_distribution_sop").unwrap();

                const blobUrl = URL.createObjectURL(
                  new Blob([file], { type: "application/pdf" })
                );

                window.open(blobUrl, "_blank");

                // Optional but recommended cleanup
                setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
              } catch (err) {
                const errMsg =
                  err?.data?.detail?.msg ??
                  err?.data?.detail ??
                  JSON.stringify(err);

                const errDesc = err?.data?.detail?.msg
                  ? err?.data?.detail?.err_stack
                  : "Failed to fetch beneficiary";
                toast.error(errMsg, { description: errDesc });
              }
            }}
          >
            📄 Laptop Distribution Help {"  "}|{" "}
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
