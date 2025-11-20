import "./index.css";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import ProtectedLayout from "./layouts/ProtectedLayout";
import { selectAuth } from "./features/auth/store/authSlice";
import { useSelector } from "react-redux";
import type { AuthState } from "./features/auth/types";
import { Toaster } from "./components/ui/sonner";
import { useGetCurrentUserQuery } from "./features/auth/store/authApiSlice";

import { lazy, Suspense } from "react";
import { Loader } from "lucide-react";

function App() {
  const AllStores = lazy(
    () => import("./features/product_stores/pages/AllStores")
  );
  const AllCandidates = lazy(
    () => import("./features/candidates/pages/AllCandidates")
  );
  const CandidateVerification = lazy(
    () => import("./features/verification/pages/CandidateVerification")
  );
  const AllVendors = lazy(() => import("./features/vendors/pages/AllVendors"));
  const AllVendorSpoc = lazy(
    () => import("./features/vendors/pages/AllVendorSpoc")
  );
  const CandidatesSearch = lazy(
    () => import("./features/candidates/components/CandidateSearch")
  );
  const CandidateVoucherDistribution = lazy(
    () =>
      import("./features/candidates/components/CandidateVoucherDistribution")
  );
  const RootLayout = lazy(() => import("@/layouts/RootLayout"));
  const currentAuthState: AuthState = useSelector(selectAuth);
  const { data: _currentUser } = useGetCurrentUserQuery(undefined, {
    skip: currentAuthState.isAuthenticated,
  });

  return (
    <div className="min-h-screen w-full">
      <Toaster
        duration={10000}
        position="top-right"
        richColors
        toastOptions={{
          closeButton: true,
        }}
      />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedLayout />}>
          <Route
            path="/"
            element={
              <Suspense
                fallback={
                  <div className="flex flex-col justify-center items-center">
                    <Loader className="animate-spin w-10 h-10 text-amber-600" />
                    <p>Loading page...</p>
                  </div>
                }
              >
                <RootLayout />
              </Suspense>
            }
          >
            <Route
              path="admin/stores"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading stores page...</p>
                    </div>
                  }
                >
                  <AllStores />
                </Suspense>
              }
            />
            <Route
              path="admin/candidates"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading candidates page...</p>
                    </div>
                  }
                >
                  <AllCandidates />
                </Suspense>
              }
            />
            <Route path="admin/dashboard" element={<div>admin dash</div>} />
            <Route
              path="verifier/candidates"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading candidates page...</p>
                    </div>
                  }
                >
                  <CandidatesSearch />
                </Suspense>
              }
            />
            <Route
              path="verifier/candidates/:candidateId"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading candidates page...</p>
                    </div>
                  }
                >
                  <CandidateVoucherDistribution />
                </Suspense>
              }
            />
            <Route
              path="store/candidates"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading candidates verification page...</p>
                    </div>
                  }
                >
                  <CandidateVerification />
                </Suspense>
              }
            />
            <Route path="store/dashboard" element={<div>store dash</div>} />
            <Route
              path="vendors"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading vendors page...</p>
                    </div>
                  }
                >
                  <AllVendors />
                </Suspense>
              }
            />
            <Route
              path="vendor_spoc"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading vendors SPOC page...</p>
                    </div>
                  }
                >
                  <AllVendorSpoc />
                </Suspense>
              }
            />
          </Route>
        </Route>
        <Route
          path="*"
          element={
            <div className="flex flex-col justify-center items-center min-h-screen">
              <h1 className="text-2xl font-bold text-red-500">
                404 - Page Not Found
              </h1>
              <p className="text-gray-500">
                The page you’re looking for doesn’t exist.
              </p>
              <p className="mt-2 text-gray-600">
                Go back to{" "}
                <a href="/" className="text-blue-600 underline">
                  home
                </a>
              </p>
            </div>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
