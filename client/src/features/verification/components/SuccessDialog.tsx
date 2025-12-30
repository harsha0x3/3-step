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

interface SuccessDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
const SuccessDialog: React.FC<SuccessDialogProps> = ({ open, setOpen }) => {
  const navigate = useNavigate();
  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        setOpen((prev) => !prev);
        navigate("/store/beneficiary");
      }}
    >
      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        className="bg-green-200"
      >
        <DialogHeader>
          <DialogTitle className="text-center">
            Laptop Data Recorded Sucessfully
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-end ">
          <Button
            onClick={() => {
              navigate("/store/beneficiary");
            }}
          >
            Ok
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuccessDialog;
