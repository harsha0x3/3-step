import React, { useState } from "react";
import { useIssueLaptopMutation } from "../store/verificationApiSlice";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface LaptopIssuanceFormProps {
  candidateId: string;
}

const LaptopIssuanceForm: React.FC<LaptopIssuanceFormProps> = ({
  candidateId,
}) => {
  const [laptopSerial, setLaptopSerial] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [issueLaptop, { isLoading }] = useIssueLaptopMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo || !laptopSerial) {
      alert("Please provide both the laptop serial and photo.");
      return;
    }

    const formData = new FormData();
    formData.append("photo", photo);
    formData.append("laptop_serial", laptopSerial);

    try {
      await issueLaptop({ candidateId, formData }).unwrap();
      toast.success("Laptop issuance recorded successfully!");
      setLaptopSerial("");
      setPhoto(null);
    } catch (err) {
      const errMsg: string =
        err?.data?.detail?.msg ?? err?.data?.detail ?? "Error verifying face";

      const errDesc = err?.data?.detail?.msg
        ? err?.data?.detail?.err_stack
        : "";
      toast.error(errMsg, { description: errDesc });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "auto" }}>
      <h3>Laptop Issuance</h3>

      <div style={{ marginBottom: "1rem" }}>
        <Label htmlFor="laptopSerial">Laptop Serial:</Label>
        <Input
          type="text"
          id="laptopSerial"
          value={laptopSerial}
          onChange={(e) => setLaptopSerial(e.target.value)}
          required
          style={{ display: "block", width: "100%", padding: "0.5rem" }}
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <Label htmlFor="photo">Upload Laptop Photo:</Label>
        <Input
          type="file"
          id="photo"
          accept="image/*"
          onChange={handleFileChange}
          required
          style={{ display: "block", width: "100%" }}
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
};

export default LaptopIssuanceForm;
