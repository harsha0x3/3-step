import "./index.css";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./features/auth/pages/LoginPage";
import ProtectedLayout from "./layouts/ProtectedLayout";
import {
  selectAuth,
  selectError,
  setError,
} from "./features/auth/store/authSlice";
import { useDispatch, useSelector } from "react-redux";
import type { AuthState } from "./features/auth/types";
import { Toaster } from "./components/ui/sonner";
import { useGetCurrentUserQuery } from "./features/auth/store/authApiSlice";

import { lazy, Suspense, useEffect } from "react";
import { Loader } from "lucide-react";
import CandidateVoucherDistribution from "./features/candidates/components/CandidateVoucherDistribution";
import { toast } from "sonner";
import UpgradeRequestPage from "./features/verification/pages/UpgradeRequestPage";
import UpgradeSubmitPage from "./features/verification/pages/UpgradeSubmitPage";

function App() {
  const dispatch = useDispatch();
  const IndexPage = lazy(() => import("./features/dashboards/pages/IndexPage"));
  const AllStores = lazy(
    () => import("./features/product_stores/pages/AllStores")
  );
  const AllCandidates = lazy(
    () => import("./features/candidates/pages/AllCandidates")
  );
  // const CandidateVerification = lazy(
  //   () => import("./features/verification/pages/CandidateVerification")
  // );
  const ConsolidateVerification = lazy(
    () => import("./features/verification/pages/ConsolidateVerification")
  );

  const AllVendors = lazy(() => import("./features/vendors/pages/AllVendors"));
  const AllVendorSpoc = lazy(
    () => import("./features/vendors/pages/AllVendorSpoc")
  );
  const CandidatesSearch = lazy(
    () => import("./features/candidates/components/CandidateSearch")
  );
  const UserManagement = lazy(
    () => import("./features/auth/pages/UserManagement")
  );
  const PasswordResetRequest = lazy(
    () => import("./features/auth/pages/PasswordResetRequest")
  );
  const PasswordResetVerify = lazy(
    () => import("./features/auth/pages/PasswordResetVerify")
  );
  const NewCandidate = lazy(
    () => import("./features/candidates/pages/NewCandidate")
  );
  const NewStore = lazy(
    () => import("./features/product_stores/pages/NewStore")
  );
  const NewVendorSpoc = lazy(
    () => import("./features/vendors/pages/NewVendorSpoc")
  );
  const NewVendor = lazy(() => import("./features/vendors/pages/NewVendor"));
  const OtpVerification = lazy(
    () => import("./features/verification/pages/OtpVerification")
  );
  const LaptopIssuancePage = lazy(
    () => import("./features/verification/pages/LaptopIssuancePage")
  );
  const LaptopIssuanceSuccessPage = lazy(
    () => import("./features/verification/pages/LaptopIssuanceSuccessPage")
  );
  const StoreCandidates = lazy(
    () => import("./features/candidates/pages/StoreCandidates")
  );
  const OfflineReportsPage = lazy(
    () => import("./features/product_stores/pages/OfflineReportsPage")
  );

  const RootLayout = lazy(() => import("@/layouts/RootLayout"));
  const currentAuthState: AuthState = useSelector(selectAuth);
  const { data: _currentUser } = useGetCurrentUserQuery(undefined, {
    skip: currentAuthState.isAuthenticated,
  });

  const isAuthenticated = currentAuthState.isAuthenticated;

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(setError(null));
    }
  }, [isAuthenticated, dispatch]);

  const loginError = useSelector(selectError);

  useEffect(() => {
    if (loginError) {
      toast.error(loginError);
    }
  });

  return (
    <div className="min-h-screen w-full overflow-hidden">
      <Toaster
        duration={10000}
        position="top-right"
        richColors
        toastOptions={{
          closeButton: true,
        }}
        className="z-9999 pointer-events-auto"
      />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/password-reset/request"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <PasswordResetRequest />
            </Suspense>
          }
        />
        <Route
          path="/password-reset/verify"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <PasswordResetVerify />
            </Suspense>
          }
        />

        <Route path="/" element={<ProtectedLayout />}>
          <Route index element={<Navigate to={`dashboard`} replace />} />

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
              path="admin/users"
              element={
                <Suspense fallback={<div>Loading users...</div>}>
                  <UserManagement />
                </Suspense>
              }
            />
            <Route
              path="admin/stores/new"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading new stores page...</p>
                    </div>
                  }
                >
                  <NewStore />
                </Suspense>
              }
            />
            <Route
              path="beneficiary/all"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading beneficiaries page...</p>
                    </div>
                  }
                >
                  <AllCandidates />
                </Suspense>
              }
            />
            <Route
              path="dashboard"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading Index dashboard page...</p>
                    </div>
                  }
                >
                  <IndexPage />
                </Suspense>
              }
            />
            <Route
              path="admin/beneficiary/new"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading Index dashboard page...</p>
                    </div>
                  }
                >
                  <NewCandidate />
                </Suspense>
              }
            />
            <Route
              path="registration_officer/beneficiary/verify"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading befificairy verification page...</p>
                    </div>
                  }
                >
                  <CandidatesSearch />
                </Suspense>
              }
            />
            <Route
              path="/registration_officer/beneficiary/verify/:candidateId"
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
              path="stores"
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
              path="store/beneficiary"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading beneficiaries verification page...</p>
                    </div>
                  }
                >
                  <ConsolidateVerification />
                </Suspense>
              }
            />
            <Route
              path="store/beneficiary/all"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading beneficiaries data page...</p>
                    </div>
                  }
                >
                  <StoreCandidates />
                </Suspense>
              }
            />
            <Route
              path="/store/beneficiary/:candidateId/verify/otp"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading beneficiaries verification page...</p>
                    </div>
                  }
                >
                  <OtpVerification />
                </Suspense>
              }
            />
            <Route
              path="/store/beneficiary/:candidateId/issuance"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading beneficiaries verification page...</p>
                    </div>
                  }
                >
                  <LaptopIssuancePage />
                </Suspense>
              }
            />
            <Route
              path="/store/upgrade"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading beneficiaries verification page...</p>
                    </div>
                  }
                >
                  <UpgradeRequestPage />
                </Suspense>
              }
            />
            <Route
              path="/store/upgrade/beneficiary/:candidateId"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading beneficiaries verification page...</p>
                    </div>
                  }
                >
                  <UpgradeSubmitPage />
                </Suspense>
              }
            />
            <Route
              path="/store/beneficiary/:candidateId/issuance/success"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading beneficiaries verification page...</p>
                    </div>
                  }
                >
                  <LaptopIssuanceSuccessPage />
                </Suspense>
              }
            />
            <Route
              path="/store/offline-reports"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading offline reports page...</p>
                    </div>
                  }
                >
                  <OfflineReportsPage />
                </Suspense>
              }
            />

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
              path="vendors/new"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading vendors page...</p>
                    </div>
                  }
                >
                  <NewVendor />
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
                      <p>Loading vendors page...</p>
                    </div>
                  }
                >
                  <AllVendorSpoc />
                </Suspense>
              }
            />
            <Route
              path="vendor_spoc/new"
              element={
                <Suspense
                  fallback={
                    <div className="flex flex-col justify-center items-center">
                      <Loader className="animate-spin w-10 h-10 text-amber-600" />
                      <p>Loading new vendor contact person adding page...</p>
                    </div>
                  }
                >
                  <NewVendorSpoc />
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
