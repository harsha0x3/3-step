import React, { useState } from "react";
import OfflineReportsUpload from "../components/OfflineReportsUpload";
import { History, Upload } from "lucide-react";
import { useSelector } from "react-redux";
import { selectAuth } from "@/features/auth/store/authSlice";

const OfflineReportsPage: React.FC = () => {
  const currentUserInfo = useSelector(selectAuth);
  const [activeTab, setActiveTab] = useState<string>(
    currentUserInfo.role === "store_agent" ? "upload" : "history"
  );
  return (
    <div className="min-h-screen p-6">
      {currentUserInfo.role === "store_agent" && (
        <div className="pb-2">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">
                Offline Issuance Upload
              </h1>
              <p className="text-slate-600">
                Upload offline laptop issuance records when technical issues
                prevent real-time processing
              </p>
            </div>
          </div>

          {/* Tab Navigation */}

          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "upload"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Upload Records
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "history"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History className="w-4 h-4 inline mr-2" />
              Upload History
            </button>
          </div>
        </div>
      )}
      {activeTab === "upload" && <OfflineReportsUpload />}
    </div>
  );
};

export default OfflineReportsPage;
