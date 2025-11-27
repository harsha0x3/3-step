import { useLocation, useNavigate } from "react-router-dom";
import CandidateFormDialog from "../components/CandidateFormDialog";

export default function NewCandidate() {
  const location = useLocation();
  const navigate = useNavigate();
  const openAddDialog = location.pathname === "/admin/beneficiary/new";
  const onOpenChange = () => {
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-background/30 backdrop-blur-sm z-50">
      <CandidateFormDialog
        defOpen={openAddDialog}
        onOpenChange={onOpenChange}
      />
    </div>
  );
}
