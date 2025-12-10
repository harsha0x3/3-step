import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import type { UpgradeRequestPayload } from "../types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const UpgradeRequestPage: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const [formData, setFormData] = useState<UpgradeRequestPayload>({
    upgrade_product_type: "",
    upgrade_product_info: "",
    upgrade_reason: "",
    payment_difference: 0,
  });
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex justify-center py-10 px-4">
      <Card className="w-full max-w-3xl shadow-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Product Upgrade Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
              <Label className="font-medium">
                Product Type<span className="text-red-600"> *</span>
              </Label>
              <Input
                name="upgrade_product_type"
                placeholder="Enter the type of upgrading product"
                value={formData.upgrade_product_type}
                onChange={handleChange}
                className="w-74"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
              <Label className="font-medium">
                Product Info (Specs)<span className="text-red-600"> *</span>
              </Label>
              <Textarea
                name="upgrade_product_info"
                placeholder="Enter the description or specs of upgrading product"
                value={formData.upgrade_product_info}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
              <Label className="font-medium">
                Reason for Upgrade<span className="text-red-600"> *</span>
              </Label>
              <Textarea
                name="upgrade_reason"
                placeholder="Enter the reason for upgrading product"
                value={formData.upgrade_reason}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
              <Label className="font-medium">
                Payment Difference between new and old products
                <span className="text-red-600"> *</span>
              </Label>
              <Input
                name="payment_difference"
                type="number"
                placeholder="Enter the difference of the price between old and upgrading product"
                value={formData.payment_difference}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="btn-primary">
              Submit
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpgradeRequestPage;
