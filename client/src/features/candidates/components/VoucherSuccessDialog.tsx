import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React from "react";
import { useNavigate } from "react-router-dom";

interface VoucherSuccessDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenChange?: (isOpen: boolean) => void;
}
const VoucherSuccessDialog: React.FC<VoucherSuccessDialogProps> = ({
  open,
  setOpen,
}) => {
  const navigate = useNavigate();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        className="bg-green-200"
      >
        <DialogHeader>
          <DialogTitle className="text-center">
            Voucher Issuance data recorded successfully
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-end ">
          <Button
            onClick={() => {
              navigate("registration_officer/beneficiary/verify");
              setOpen(false);
            }}
          >
            Ok
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoucherSuccessDialog;
