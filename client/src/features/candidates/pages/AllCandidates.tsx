import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";
import { useNavigate } from "react-router-dom";
import {
  useGetAllCandidatesQuery,
  useGetCandidatesOfStoreQuery,
} from "../store/candidatesApiSlice";
import CandidatesTable from "../components/CandidatesTable";
import CandidateFormDialog from "../components/CandidateFormDialog";

const AllCandidates: React.FC = () => {
  const currentUserInfo = useSelector(selectAuth);

  const {
    data: candidatesData,
    isLoading: isFetchingCandidates,
    error: candidatesFetchError,
  } = useGetAllCandidatesQuery(undefined, {
    skip:
      currentUserInfo.role !== "admin" && currentUserInfo.role !== "verifier",
  });

  useEffect(() => {
    console.log("❌❌❌❌CANDIDATES FRTCH ERR", candidatesFetchError);
  }, [candidatesFetchError]);

  const candidatesDataList = candidatesData?.data?.candidates;

  if (currentUserInfo.role === "store_personnel") {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <div />
        <CandidateFormDialog />
      </div>
      <div className="flex-1">
        <CandidatesTable
          candidates={candidatesDataList}
          isLoading={isFetchingCandidates}
          error={
            candidatesFetchError
              ? candidatesFetchError?.data?.detail ??
                "An Error Occured while fetching candidates"
              : ""
          }
        />
      </div>
    </div>
  );
};

export default AllCandidates;
