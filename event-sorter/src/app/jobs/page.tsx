"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Job {
  id: string;
  company: string;
  position: string;
  status: "saved" | "applied" | "interview" | "offer" | "rejected";
  url?: string;
  notes?: string;
  dateAdded: string;
}

const STATUS_CONFIG = {
  saved: { label: "Saved", color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
  applied: { label: "Applied", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  interview: { label: "Interview", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  offer: { label: "Offer", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
};

export default function Jobs() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [filterStatus, setFilterStatus] = useState<Job["status"] | "all">("all");

  // Form state
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [jobStatus, setJobStatus] = useState<Job["status"]>("saved");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Load jobs from localStorage
  useEffect(() => {
    if (session?.user?.email) {
      const stored = localStorage.getItem(`jobs_${session.user.email}`);
      if (stored) {
        setJobs(JSON.parse(stored));
      }
    }
  }, [session]);

  // Save jobs to localStorage
  useEffect(() => {
    if (session?.user?.email && jobs.length > 0) {
      localStorage.setItem(`jobs_${session.user.email}`, JSON.stringify(jobs));
    }
  }, [jobs, session]);

  const resetForm = () => {
    setCompany("");
    setPosition("");
    setJobStatus("saved");
    setUrl("");
    setNotes("");
    setEditingJob(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !position.trim()) return;

    if (editingJob) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === editingJob.id
            ? { ...j, company: company.trim(), position: position.trim(), status: jobStatus, url: url.trim() || undefined, notes: notes.trim() || undefined }
            : j
        )
      );
    } else {
      const newJob: Job = {
        id: crypto.randomUUID(),
        company: company.trim(),
        position: position.trim(),
        status: jobStatus,
        url: url.trim() || undefined,
        notes: notes.trim() || undefined,
        dateAdded: new Date().toISOString(),
      };
      setJobs((prev) => [newJob, ...prev]);
    }

    resetForm();
  };

  const startEdit = (job: Job) => {
    setCompany(job.company);
    setPosition(job.position);
    setJobStatus(job.status);
    setUrl(job.url || "");
    setNotes(job.notes || "");
    setEditingJob(job);
    setShowForm(true);
  };

  const deleteJob = (id: string) => {
    if (!window.confirm("Delete this job?")) return;
    const updated = jobs.filter((j) => j.id !== id);
    setJobs(updated);
    if (session?.user?.email) {
      if (updated.length === 0) {
        localStorage.removeItem(`jobs_${session.user.email}`);
      } else {
        localStorage.setItem(`jobs_${session.user.email}`, JSON.stringify(updated));
      }
    }
  };

  const updateStatus = (id: string, newStatus: Job["status"]) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: newStatus } : j))
    );
  };

  const filteredJobs = filterStatus === "all" ? jobs : jobs.filter((j) => j.status === filterStatus);

  if (status === "loading") {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jobs</h1>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          + Add Job
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingJob ? "Edit Job" : "Add New Job"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company *
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g. Google"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Position *
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g. Software Engineer"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={jobStatus}
                  onChange={(e) => setJobStatus(e.target.value as Job["status"])}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Job URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                placeholder="Any notes about this job..."
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
              >
                {editingJob ? "Save Changes" : "Add Job"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      {jobs.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filterStatus === "all"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            All ({jobs.length})
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const count = jobs.filter((j) => j.status === key).length;
            if (count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setFilterStatus(key as Job["status"])}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  filterStatus === key
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {config.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Job List */}
      {jobs.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No jobs yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Start tracking your job applications
          </p>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Add Your First Job
          </button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No jobs with this status
          </h3>
          <button
            onClick={() => setFilterStatus("all")}
            className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Show All Jobs
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {job.position}
                    </h3>
                    <select
                      value={job.status}
                      onChange={(e) => updateStatus(job.id, e.target.value as Job["status"])}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${STATUS_CONFIG[job.status].color}`}
                    >
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{job.company}</p>
                  {job.notes && (
                    <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">{job.notes}</p>
                  )}
                  <p className="text-gray-400 dark:text-gray-600 text-xs mt-2">
                    Added {new Date(job.dateAdded).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition"
                      title="Open job listing"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                  <button
                    onClick={() => startEdit(job)}
                    className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition"
                    title="Edit"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteJob(job.id)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
