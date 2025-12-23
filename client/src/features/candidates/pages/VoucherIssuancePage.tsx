import React from "react";
import CandidateSearch from "../components/CandidateSearch";
import VoucherIssuanceSupportFooter from "@/features/shared/VoucherIssuanceSupportFooter";

const VoucherIssuancePage: React.FC = () => {
  return (
    <div className="w-full h-[calc(100vh-71px)] overflow-auto flex flex-col">
      <div className="flex-1">
        <CandidateSearch />
      </div>
      <VoucherIssuanceSupportFooter />
    </div>
  );
};

export default VoucherIssuancePage;
