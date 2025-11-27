import { useNavigate, useParams } from "react-router-dom";
import { useGetCandidateByIdQuery } from "@/features/candidates/store/candidatesApiSlice";
import CandidateFormDialog from "@/features/candidates/components/CandidateFormDialog";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";

const CandidateVoucherDistribution = () => {
  const { candidateId } = useParams();
  const { data, isLoading } = useGetCandidateByIdQuery(candidateId);
  const [openForm, setOpenForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Open dialog automatically when candidate is loaded
    if (data?.data?.candidate) setOpenForm(true);
  }, [data]);

  if (isLoading || !data?.data?.candidate)
    return (
      <div className="flex justify-center items-center py-10">
        <Loader className="w-6 h-6 animate-spin" />
      </div>
    );

  const handleDialogChange = (isOpen: boolean) => {
    setOpenForm(isOpen);
    if (!isOpen) {
      navigate("/registration_officer/beneficiary/verify"); // redirect when closed
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-background/30 backdrop-blur-sm z-50">
      <CandidateFormDialog
        candidate={data.data.candidate}
        toVerify={true}
        viewOnly={false}
        defOpen={openForm}
        onOpenChange={handleDialogChange}
      />
    </div>
  );
};

export default CandidateVoucherDistribution;
