import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { UserItem } from "@/features/auth/types";

type MfaQrButtonProps = {
  user: UserItem | null;
};

const MfaQrButton: React.FC<MfaQrButtonProps> = ({ user }) => {
  if (!user || !user.mfa_secret) {
    return <span className="text-muted-foreground text-sm">No MFA</span>;
  }

  // ✅ mfa_secret is already a valid otpauth:// URI (from backend)
  const otpUri = user.mfa_secret;
  console.log("MFA_SEC", otpUri);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          Show MFA QR
        </Button>
      </DialogTrigger>

      <DialogContent className="flex flex-col items-center justify-center space-y-4">
        <DialogHeader>
          <DialogTitle>MFA QR Code for {user.username}</DialogTitle>
        </DialogHeader>

        <QRCodeCanvas value={otpUri} size={200} />

        <p className="text-xs text-muted-foreground text-center break-all">
          {otpUri}
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default MfaQrButton;
