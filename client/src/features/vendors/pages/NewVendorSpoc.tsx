import { useLocation, useNavigate } from "react-router-dom";
import VendorSpocFormDialog from "../components/VendorSpocFormDialog";

export default function NewVendorSpoc() {
  const location = useLocation();
  const navigate = useNavigate();
  const openAddDialog = location.pathname === "/vendor_spoc/new";
  const onOpenChange = () => {
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-background/30 backdrop-blur-sm z-50">
      <VendorSpocFormDialog
        defOpen={openAddDialog}
        onOpenChange={onOpenChange}
      />
    </div>
  );
}
