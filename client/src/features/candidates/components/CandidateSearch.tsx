import React, { useEffect, useState } from "react";
import { useLazyGetAllCandidatesQuery } from "../store/candidatesApiSlice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import type { CandidateItemWithStore } from "../types";
import Hint from "@/components/ui/hint";
import { Loader } from "lucide-react";

const CandidateSearch: React.FC = () => {
  const [fetchCandidates, { data: candidatesData, isFetching }] =
    useLazyGetAllCandidatesQuery();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchBy, setSearchBy] = useState<string>("id");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
    //   setSelectedCandidate(candidate);
    // setOpenForm(true);
    navigate(`/verifier/candidates/${candidate.id}`);
  };
  const candidates = candidatesData?.data?.candidates || [];

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setShowDropdown(false);
    }
  }, [searchTerm]);

  return (
    <div className="flex flex-col">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 md:flex-row items-center"
      >
        <Input
          type="text"
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchTerm(e.target.value)
          }
          placeholder={`Search by ${
            searchBy === "id" ? "Employee ID" : "Employee Name"
          }`}
          className="w-64"
        />
        <div className="px-3 flex gap-2 items-center">
          <p>Search By: </p>
          <Select
            value={String(searchBy)}
            aria-label="Select page"
            onValueChange={(value) => setSearchBy(value)}
          >
            <Hint label="Select the search method">
              <SelectTrigger
                id="select-page"
                className="whitespace-nowrap w-32 hover:bg-accent hover:text-accent-foreground hover:cursor-pointer"
                aria-label="Select page"
              >
                <SelectValue placeholder="Search by" />
              </SelectTrigger>
            </Hint>
            <SelectContent className="">
              <SelectItem value="full_name">Full Name</SelectItem>
              <SelectItem value="id">Employee Id</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Hint
          label={
            searchTerm.trim() === ""
              ? "Button disabled Search Box is empty"
              : "Click to search employees"
          }
        >
          <span
            className={`inline-block ${
              searchTerm.trim() === "" ? "hover:cursor-not-allowed" : ""
            }`}
          >
            <Button
              type="submit"
              disabled={searchTerm.trim() === ""}
              className="w-30"
            >
              Search
            </Button>
          </span>
        </Hint>
      </form>

      {showDropdown && candidates.length > 0 && (
        <div className="w-full border rounded-md shadow-md mt-1 z-20 max-h-64 overflow-y-auto">
          {candidates.map((c: any) => (
            <div
              key={c.id}
              onClick={() => handleSelect(c)}
              className="px-4 pt-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
            >
              <p className="font-medium">{c.full_name}</p>
              <p className="text-sm text-muted-foreground">
                Employee ID: {c.id} • Mobile Number: {c.mobile_number}
              </p>
              <DropdownMenuSeparator />
            </div>
          ))}
        </div>
      )}

      {showDropdown && candidates.length === 0 && !isFetching && (
        <div className="w-full bg-white border rounded-md shadow-md mt-1 px-4 py-3 text-gray-500">
          No candidates found
        </div>
      )}

      {isFetching && !candidates && (
        <div className="w-full border rounded-md shadow-md mt-1 z-20 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-center">
            <Loader className="w-7 h-7 animate-spin" />
            <p>Loading Employees</p>
          </div>
        </div>
      )}
      <ol className="pt-6 mb-3 text-sm text-muted-foreground list-decimal list-inside">
        <li>Select a search method.</li>
        <li>Type an employee name or ID based on the selected method.</li>
        <li>
          Click <b>Search</b>. The dropdown will display matching employees.
        </li>
        <li>Select the correct employee to proceed to the next steps.</li>
      </ol>
    </div>
  );
};

export default CandidateSearch;
