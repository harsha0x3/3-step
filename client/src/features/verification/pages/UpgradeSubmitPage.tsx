import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { UpgradeRequestPayload } from "../types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useConfirmUpgradeMutation } from "../store/verificationApiSlice";
import { toast } from "sonner";

const UpgradeSubmitPage: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const upgradeOptions = [
    { key: "ram", label: "RAM", from: "Existing RAM", to: "Upgrade RAM" },
    {
      key: "storage",
      label: "Storage",
      from: "Existing Storage",
      to: "Upgrade Storage",
    },
    {
      key: "processor",
      label: "Processor",
      from: "Existing Processor",
      to: "Upgrade Processor",
    },
  ];

  const [selectedUpgrades, setSelectedUpgrades] = useState<
    Record<string, { from: string; to: string }>
  >({});
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const updateUpgradeInfo = (
    updates: Record<string, { from: string; to: string }>
  ) => {
    const lines = Object.entries(updates).map(
      ([key, val]) =>
        `Upgrading ${key.toUpperCase()} from ${val.from} to ${val.to}`
    );

    setFormData((prev) => ({
      ...prev,
      upgrade_product_info: lines.join("\n"),
    }));
  };

  const [formData, setFormData] = useState<UpgradeRequestPayload>({
    upgrade_product_info: "",
    new_laptop_serial: "",
    existing_laptop_serial: "",
    cost_of_upgrade: 0,

    upgrade_reason: "",
    upgrade_product_type: "",
  });
  const [confirmUpgrade, { isLoading: isConfirming }] =
    useConfirmUpgradeMutation();

  useEffect(() => {
    if (location?.state?.existing_laptop_serial) {
      setFormData((prev) => ({
        ...prev,
        existing_laptop_serial: location?.state?.existing_laptop_serial,
      }));
    }
  }, [location]);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log(formData);
      await confirmUpgrade({
        candidateId: candidateId,
        payload: formData,
      }).unwrap();
      setShowConfirm(false);
      setShowSuccess(true);
    } catch (err) {
      console.log(err);
      const errMsg =
        err?.data?.detail?.msg ??
        err?.data?.detail ??
        "Uunexpected error in confirming upgrade. try again";
      toast.error(errMsg);
    }
  };

  return (
    <div className="flex justify-center py-10 px-4">
      <Card className="w-full max-w-3xl shadow-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Upgrading Product Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[120px_1fr]">
              <Label>Laptop Serial</Label>
              <Input
                id="existing_laptop_serial"
                value={formData.existing_laptop_serial}
                onChange={handleChange}
                readOnly={formData.existing_laptop_serial.trim() !== ""}
              />
            </div>
            {/* === Upgrade Options Section === */}
            <div>
              <Label className="font-medium">Select Upgrade Options</Label>

              <div className="space-y-2 mt-2">
                {upgradeOptions.map((opt) => (
                  <div key={opt.key} className="border p-3 rounded-md">
                    {/* Checkbox */}
                    <div className="flex gap-2 items-center">
                      <Input
                        id={opt.key}
                        type="checkbox"
                        checked={!!selectedUpgrades[opt.key]}
                        className="w-7 h-7"
                        onChange={(e) => {
                          const checked = e.target.checked;

                          setSelectedUpgrades((prev) => {
                            const updated = { ...prev };

                            if (!checked) {
                              delete updated[opt.key];
                              updateUpgradeInfo(updated);
                              return updated;
                            }

                            updated[opt.key] = { from: "", to: "" };
                            updateUpgradeInfo(updated);
                            return updated;
                          });
                        }}
                      />
                      <Label className="" htmlFor={opt.key}>
                        {opt.label}
                      </Label>
                    </div>

                    {/* Show input fields when checked */}
                    {selectedUpgrades[opt.key] && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        <div className="">
                          <Label>From:</Label>
                          <Input
                            placeholder={opt.from}
                            value={selectedUpgrades[opt.key].from}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedUpgrades((prev) => {
                                const updated = {
                                  ...prev,
                                  [opt.key]: { ...prev[opt.key], from: val },
                                };
                                updateUpgradeInfo(updated);
                                return updated;
                              });
                            }}
                          />
                        </div>
                        <div className="">
                          <Label>To:</Label>
                          <Input
                            placeholder={opt.to}
                            value={selectedUpgrades[opt.key].to}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedUpgrades((prev) => {
                                const updated = {
                                  ...prev,
                                  [opt.key]: { ...prev[opt.key], to: val },
                                };
                                updateUpgradeInfo(updated);
                                return updated;
                              });
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
              <Label className="font-medium">
                Cost of Upgrade
                <span className="text-red-600"> *</span>
              </Label>
              <Input
                name="cost_of_upgrade"
                type="number"
                placeholder="Enter the difference of the price between old and upgrading product"
                value={formData.cost_of_upgrade}
                onChange={handleChange}
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="button" onClick={() => setShowConfirm(true)}>
            Submit
          </Button>
        </CardFooter>
      </Card>
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Please confirm the following upgrade details:
              <br />
              <strong>Upgrades:</strong>
              <pre className="mt-2 whitespace-pre-wrap">
                {formData.upgrade_product_info || "No upgrades selected"}
              </pre>
              <strong>Cost of Upgrade:</strong> ₹{formData.cost_of_upgrade}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Laptop Upgraded Successfully</AlertDialogTitle>
            <AlertDialogDescription></AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                navigate("/store/beneficiary");
              }}
            >
              Ok
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UpgradeSubmitPage;
