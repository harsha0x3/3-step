import { useLocation, useNavigate } from "react-router-dom";
import StoreFormDialog from "../components/StoreFormDialog";

export default function NewStore() {
  const location = useLocation();
  const navigate = useNavigate();
  const openAddDialog = location.pathname === "/admin/stores/new";

  const onOpenChange = () => {
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-background/30 backdrop-blur-sm z-50">
      <StoreFormDialog defOpen={openAddDialog} onOpenChange={onOpenChange} />
    </div>
  );
}
