import { useLocation, useNavigate } from "react-router-dom";
import VendorFormDialog from "../components/VendorFormDialog";

export default function NewVendor() {
  const location = useLocation();
  const navigate = useNavigate();
  const openAddDialog = location.pathname === "/vendors/new";
  const onOpenChange = () => {
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-background/30 backdrop-blur-sm z-50">
      <VendorFormDialog defOpen={openAddDialog} onOpenChange={onOpenChange} />
    </div>
  );
}
