import "./index.css";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import ProtectedLayout from "./layouts/ProtectedLayout";
import RootLayout from "./layouts/RootLayout";
import { selectAuth } from "./features/auth/store/authSlice";
import { useSelector } from "react-redux";
import type { AuthState } from "./features/auth/types";
import { Toaster } from "./components/ui/sonner";
import AllStores from "./features/product_stores/pages/AllStores";
import { useGetCurrentUserQuery } from "./features/auth/store/authApiSlice";
import AllCandidates from "./features/candidates/pages/AllCandidates";
import CandidateVerification from "./features/verification/pages/CandidateVerification";
import AllVendors from "./features/vendors/pages/AllVendors";
import AllVendorSpoc from "./features/vendors/pages/AllVendorSpoc";

function App() {
  const currentAuthState: AuthState = useSelector(selectAuth);
  const { data: _currentUser } = useGetCurrentUserQuery(undefined, {
    skip: currentAuthState.isAuthenticated,
  });

  return (
    <>
      <Toaster
        position="bottom-right"
        richColors
        toastOptions={{
          closeButton: true,
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedLayout />}>
          <Route path="/" element={<RootLayout />}>
            <Route path="admin/stores" element={<AllStores />} />
            <Route path="admin/candidates" element={<AllCandidates />} />
            <Route path="admin/dashboard" element={<div>admin dash</div>} />
            <Route path="verifier/candidates" element={<AllCandidates />} />
            <Route
              path="store/candidates"
              element={<CandidateVerification />}
            />
            <Route path="store/dashboard" element={<div>store dash</div>} />
            <Route path="vendors" element={<AllVendors />} />
            <Route path="vendor_spoc" element={<AllVendorSpoc />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
