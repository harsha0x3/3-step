import React, { useEffect, useState } from "react";
import { useLazyGetAllCandidatesQuery } from "../store/candidatesApiSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import type { CandidateItemWithStore } from "../types";
import Hint from "@/components/ui/hint";
import { Loader, SearchIcon, SearchSlash } from "lucide-react";

const CandidateSearch: React.FC = () => {
  const [fetchCandidates, { data: candidatesData, isFetching }] =
    useLazyGetAllCandidatesQuery();

  const [employeeId, setEmployeeId] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [searchBy, setSearchBy] = useState<"id" | "full_name" | "">("");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const searchTerm = searchBy === "id" ? employeeId : fullName;

    if (!searchTerm.trim()) {
      setShowDropdown(false);
      return;
    }
    try {
      const res = await fetchCandidates({
        search_term: searchTerm,
        search_by: searchBy,
      }).unwrap();
      setShowDropdown(true);
      console.log("RESULT OF FETCH", res);
    } catch (err) {
      const errMsg: string =
        err?.data?.detail?.msg ?? err?.data?.detail ?? JSON.stringify(err);

      const errDesc = err?.data?.detail?.msg
        ? err?.data?.detail?.err_stack
        : "";
      toast.error(errMsg, { description: errDesc });
    }
  };

  const handleSelect = (candidate: CandidateItemWithStore) => {
    setShowDropdown(false);
    navigate(`/registration_officer/beneficiary/verify/${candidate.id}`);
  };

  const candidates = candidatesData?.data?.candidates || [];

  // Auto-reset logic
  const handleIdChange = (val: string) => {
    setEmployeeId(val);
    if (val.trim()) {
      setFullName("");
      setSearchBy("id");
    } else setSearchBy("");
  };

  const handleNameChange = (val: string) => {
    setFullName(val);
    if (val.trim()) {
      setEmployeeId("");
      setSearchBy("full_name");
    } else setSearchBy("");
    if (showDropdown) {
      setShowDropdown(false);
    }
  };

  // Hide dropdown when no search term
  useEffect(() => {
    if (!employeeId.trim() && !fullName.trim()) setShowDropdown(false);
  }, [employeeId, fullName]);

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto">
      {/* SEARCH PANEL */}
      <div className="w-full border rounded-lg shadow-sm bg-card p-6 mt-3">
        <h2 className="text-lg font-semibold mb-1 text-center">
          Search Employee
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Enter Employee ID or Name
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* ID INPUT */}
          <Input
            type="text"
            value={employeeId}
            onChange={(e) => handleIdChange(e.target.value)}
            placeholder="🔎 Search by Employee ID"
            className="w-full"
          />

          {/* OR Divider */}
          <div className="flex items-center gap-2">
            <div className="h-[1px] flex-1 bg-muted" />
            <span className="text-muted-foreground text-xs font-medium">
              OR
            </span>
            <div className="h-[1px] flex-1 bg-muted" />
          </div>

          {/* NAME INPUT */}
          <Input
            type="text"
            value={fullName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="🔎 Search by Full Name"
            className="w-full"
          />

          <div className="flex justify-between">
            <div />
            <Button
              type="submit"
              disabled={!employeeId.trim() && !fullName.trim()}
              className="h-11 text-base font-semibold"
            >
              Search
            </Button>
          </div>
        </form>
      </div>

      {/* RESULTS */}
      {showDropdown && (
        <div className="w-full border rounded-lg shadow-md mt-3 bg-card max-h-64 overflow-y-auto animate-in fade-in duration-200">
          {isFetching && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader className="w-5 h-5 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          )}

          {!isFetching &&
            candidates.length > 0 &&
            candidates.map((c: any) => (
              <div
                key={c.id}
                onClick={() => handleSelect(c)}
                className="px-4 py-3 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <p className="font-medium">{c.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  Employee ID: {c.id} • Mobile: {c.mobile_number}
                </p>
                <DropdownMenuSeparator />
              </div>
            ))}

          {!isFetching && candidates.length === 0 && (
            <div className="px-4 py-4 text-center text-muted-foreground">
              No employees match the search
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CandidateSearch;
