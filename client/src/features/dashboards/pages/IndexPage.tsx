import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useGetRoleBasedStatsQuery } from "@/features/dashboards/store/dashboardApiSlice";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function IndexPage() {
  const { data, isLoading, isError } = useGetRoleBasedStatsQuery(undefined);
  const currentUserInfo = useSelector(selectAuth);
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState<string>("");
  const stats = useMemo(() => {
    if (!isLoading && !isError) return data.data.summary;
  }, [data, isLoading, isError]);
  const storeStats = useMemo(() => {
    if (!isLoading && !isError) return data.data.store_statistics || [];
  }, [data, isLoading, isError]);
  const upgradeStats = useMemo(() => {
    if (!isLoading && !isError) return data.data.upgrade_statistics;
  }, [data, isLoading, isError]);

  const filteredStores = useMemo(() => {
    if (storeStats)
      return storeStats.filter((s) =>
        s.city.toLowerCase().includes(selectedCity.toLowerCase())
      );
  }, [selectedCity, storeStats]);

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError || !data) return <div className="p-6">Failed to load stats</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-md flex flex-col">
          <CardContent className="px-4 py-2">
            <p className="text-sm text-gray-500">Beneficiaries Registered</p>
            <p className="text-2xl font-bold">
              {currentUserInfo.role !== "store_agent"
                ? stats.total_candidates
                : stats.verified_candidates}
            </p>
          </CardContent>
          <CardFooter className="mt-auto flex justify-end">
            {currentUserInfo.role !== "store_agent" && (
              <Button
                variant={"link"}
                className="text-right"
                onClick={() =>
                  navigate("/beneficiary/all", { state: { from: "dashboard" } })
                }
              >
                View Details
              </Button>
            )}
            {currentUserInfo.role === "store_agent" && (
              <Button
                variant={"link"}
                className="text-right"
                onClick={() =>
                  navigate("/dashboard/store/beneficiary/all", {
                    state: { from: "dashboard" },
                  })
                }
              >
                View Details
              </Button>
            )}
          </CardFooter>
        </Card>

        {currentUserInfo.role !== "store_agent" && (
          <Card className="shadow-md flex flex-col">
            <CardContent className="px-4 py-2">
              <p className="text-sm text-gray-500">Vouchers Issued</p>
              <p className="text-2xl font-bold">{stats.verified_candidates}</p>
            </CardContent>
            <CardFooter className="mt-auto flex justify-end">
              {currentUserInfo.role !== "store_agent" && (
                <Button
                  variant={"link"}
                  className="text-right"
                  onClick={() =>
                    navigate("/beneficiary/all?is_verified=true", {
                      state: { from: "dashboard" },
                    })
                  }
                >
                  View Details
                </Button>
              )}
              {currentUserInfo.role === "store_agent" && (
                <Button
                  variant={"link"}
                  className="text-right"
                  onClick={() =>
                    navigate(
                      "/dashboard/store/beneficiary/all?is_verified=true",
                      {
                        state: { from: "dashboard" },
                      }
                    )
                  }
                >
                  View Details
                </Button>
              )}
            </CardFooter>
          </Card>
        )}

        {stats.issued_laptops !== undefined &&
          stats.issued_laptops !== null && (
            <Card className="shadow-md flex flex-col">
              <CardContent className="px-4 py-2">
                <p className="text-sm text-gray-500">Laptops Issued</p>
                <p className="text-2xl font-bold">{stats.issued_laptops}</p>
              </CardContent>
              <CardFooter className="mt-auto flex justify-end">
                {currentUserInfo.role !== "store_agent" && (
                  <Button
                    variant={"link"}
                    className="text-right"
                    onClick={() =>
                      navigate("/beneficiary/all?is_issued=true", {
                        state: { from: "dashboard" },
                      })
                    }
                  >
                    View Details
                  </Button>
                )}
                {currentUserInfo.role === "store_agent" && (
                  <Button
                    variant={"link"}
                    className="text-right"
                    onClick={() =>
                      navigate(
                        "/dashboard/store/beneficiary/all?is_issued=true",
                        {
                          state: { from: "dashboard" },
                        }
                      )
                    }
                  >
                    View Details
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}
        {["super_admin", "admin", "store_agent"].includes(
          currentUserInfo.role
        ) &&
          upgradeStats !== undefined &&
          upgradeStats !== null && (
            <Card className="shadow-md flex flex-col">
              <CardContent className="px-4 py-2">
                <p className="text-sm text-gray-500">Upgrade Requests</p>
                <p className="text-2xl font-bold">
                  {upgradeStats?.upgrade_requests ?? 0}
                </p>
              </CardContent>
              <CardFooter className="mt-auto flex justify-end">
                {currentUserInfo.role !== "store_agent" && (
                  <Button
                    variant={"link"}
                    className="text-right"
                    onClick={() =>
                      navigate("/beneficiary/all?upgrade_request=false", {
                        state: { from: "dashboard" },
                      })
                    }
                  >
                    View Details
                  </Button>
                )}
                {currentUserInfo.role === "store_agent" && (
                  <Button
                    variant={"link"}
                    className="text-right"
                    onClick={() =>
                      navigate("/store/upgrades/all", {
                        state: { from: "dashboard" },
                      })
                    }
                  >
                    View Details
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}
        {["super_admin", "admin", "store_agent"].includes(
          currentUserInfo.role
        ) &&
          upgradeStats !== undefined &&
          upgradeStats !== null && (
            <Card className="shadow-md flex flex-col">
              <CardContent className="px-4 py-2">
                <p className="text-sm text-gray-500">Upgrades Completed</p>
                <p className="text-2xl font-bold">
                  {upgradeStats?.upgrades_completed ?? 0}
                </p>
              </CardContent>
              <CardFooter className="mt-auto flex justify-end">
                {currentUserInfo.role !== "store_agent" && (
                  <Button
                    variant={"link"}
                    className="text-right"
                    onClick={() =>
                      navigate("/beneficiary/all?upgrade_request=true", {
                        state: { from: "dashboard" },
                      })
                    }
                  >
                    View Details
                  </Button>
                )}
                {currentUserInfo.role === "store_agent" && (
                  <Button
                    variant={"link"}
                    className="text-right"
                    onClick={() =>
                      navigate(
                        "/dashboard/store/beneficiary/all?upgrade_request=true",
                        {
                          state: { from: "dashboard" },
                        }
                      )
                    }
                  >
                    View Details
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}

        {/* {stats.pending_verifications !== undefined &&
          stats.pending_verifications !== null && (
            <Card className="shadow-md flex flex-col">
              <CardContent className="px-4 py-2">
                <p className="text-sm text-gray-500">
                  Pending Voucher Isssuance
                </p>
                <p className="text-2xl font-bold">
                  {stats.pending_verifications}
                </p>
              </CardContent>
              <CardFooter className="mt-auto flex justify-end">
                {currentUserInfo.role !== "store_agent" && (
                  <Button
                    variant={"link"}
                    className="text-right"
                    onClick={() =>
                      navigate("/beneficiary/all?is_verified=false")
                    }
                  >
                    View Details
                  </Button>
                )}
                {currentUserInfo.role === "store_agent" && (
                  <Button
                    variant={"link"}
                    className="text-right"
                    onClick={() =>
                      navigate("/store/beneficiary/all?is_verified=false")
                    }
                  >
                    View Details
                  </Button>
                )}
              </CardFooter>
            </Card>
          )} */}
        {/* New Dynamic Summary Cards */}
        {stats.total_stores !== undefined && stats.total_stores !== null && (
          <Card className="shadow-md flex flex-col">
            <CardContent className="px-4 py-2">
              <p className="text-sm text-gray-500">Total Stores</p>
              <p className="text-2xl font-bold">{stats.total_stores}</p>
            </CardContent>
            <CardFooter className="mt-auto flex justify-end">
              {currentUserInfo.role !== "store_agent" && (
                <Button
                  variant={"link"}
                  className="text-right"
                  onClick={() =>
                    navigate("/stores", { state: { from: "dashboard" } })
                  }
                >
                  View Details
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
      </div>

      {/* Store Stats (Only Admin) */}
      {filteredStores.length > 0 && (
        <div className="border rounded-lg h-[500px] p-2 overflow-hidden flex flex-col bg-card shadow-sm ">
          <div className="border-b">
            <h2 className="text-xl font-semibold mb-2">Store Wise Issuance</h2>
            <div className="flex items-center gap-2 py-3">
              <Label>Search By City:</Label>
              <Input
                value={selectedCity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSelectedCity(e.target.value)
                }
                type="text"
                className="w-64"
                placeholder="Enter a city name"
              />
            </div>
          </div>
          <div className="h-full flex-1 overflow-auto py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStores.map((s) => (
                <Card key={s.store_id} className="shadow-md">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">{s.store_name}</p>
                      <Button
                        variant={"link"}
                        onClick={() =>
                          navigate(`/stores?storeSearchTerm=${s.city}`, {
                            state: { from: "dashboard" },
                          })
                        }
                        size={"sm"}
                      >
                        View details
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">City: {s.city}</p>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="font-bold">{s.total_candidates}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Aadhar Failed</p>
                        <p className="font-bold">{s.aadhar_failed}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Facial Failed</p>
                        <p className="font-bold">{s.facial_failed}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Issued</p>
                        <p className="font-bold">{s.laptops_issued}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload (Store Agent) */}
      {data.data.recent_issuances && (
        <div>
          <h2 className="text-xl font-semibold mb-2">
            Details of Laptops Issued (Last 5)
          </h2>
          <div className="space-y-3">
            {data.data.recent_issuances.map((i) => (
              <Card key={i.candidate_id} className="shadow-md">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{i.full_name}</p>
                    <p className="text-sm text-gray-500">{i.mobile_number}</p>
                  </div>
                  <p className="text-sm">{i.issued_at?.split("T")[0]}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
