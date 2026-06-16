"use client";

import { Loader2, Plus, Trash2, Pencil } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  useQuestCampaignDetail,
  useUpdateQuestCampaign,
  useDeleteQuestCampaign,
  useAddQuestTask,
  useUpdateQuestTask,
  useDeleteQuestTask,
  type QuestTask,
} from "@/features/admin/hooks/use-admin-quest-campaigns";

const TASK_TYPES = [
  "X_FOLLOW", "X_RETWEET", "X_COMMENT", "BROWSE", "ONCHAIN",
  "AGENT_CHAT", "TELEGRAM_JOIN", "DISCORD_JOIN", "VOLUME_SWAP",
];
const CATEGORIES = ["BLEND", "SOROSWAP", "AQUARIUS"];

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#F5F8FC",
  fontSize: 13,
  width: "100%",
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  background: "linear-gradient(135deg, #00BFFF, #0080FF)",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 13,
};

interface CampaignFormState {
  title: string;
  protocol: string;
  category: string;
  description: string;
  isActive: boolean;
  startAt: string;
  endAt: string;
}

interface TaskFormState {
  title: string;
  description: string;
  type: string;
  pointReward: number;
  order: number;
  isActive: boolean;
  metadata: string;
}

const defaultTaskForm: TaskFormState = {
  title: "",
  description: "",
  type: "ONCHAIN",
  pointReward: 100,
  order: 0,
  isActive: true,
  metadata: "{}",
};

function TaskForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial: TaskFormState;
  onSave: (data: TaskFormState) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof TaskFormState, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 8,
        border: "1px solid rgba(0,191,255,0.2)",
        background: "rgba(0,191,255,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <input
        placeholder="Title *"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        style={inputStyle}
      />
      <input
        placeholder="Description"
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
        style={inputStyle}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <select
          value={form.type}
          onChange={(e) => set("type", e.target.value)}
          style={inputStyle}
          aria-label="Task type"
        >
          {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          type="number"
          placeholder="Points"
          value={form.pointReward}
          onChange={(e) => set("pointReward", Number(e.target.value))}
          style={inputStyle}
        />
        <input
          type="number"
          placeholder="Order"
          value={form.order}
          onChange={(e) => set("order", Number(e.target.value))}
          style={inputStyle}
        />
      </div>
      <div>
        <label style={{ fontSize: 12, color: "rgba(245,248,252,0.5)", display: "block", marginBottom: 4 }}>
          Metadata (JSON)
        </label>
        <textarea
          value={form.metadata}
          onChange={(e) => set("metadata", e.target.value)}
          rows={2}
          style={{ ...inputStyle, resize: "none", fontFamily: "monospace", fontSize: 11 }}
        />
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
        />
        Active
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={isPending || !form.title.trim()}
          style={primaryBtnStyle}
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "8px 12px", borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent", color: "rgba(245,248,252,0.6)",
            cursor: "pointer", fontSize: 13,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function QuestCampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { data: campaign, isLoading, isError } = useQuestCampaignDetail(id);
  const updateCampaign = useUpdateQuestCampaign(id);
  const deleteCampaign = useDeleteQuestCampaign();
  const addTask = useAddQuestTask(id);
  const updateTask = useUpdateQuestTask(id);
  const deleteTask = useDeleteQuestTask(id);

  const [campaignForm, setCampaignForm] = useState<CampaignFormState | null>(null);
  const [addingTask, setAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div style={{ padding: 40, display: "flex", justifyContent: "center" }}>
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (isError || !campaign) {
    return <div style={{ color: "#FB7185", padding: 20 }}>Campaign not found</div>;
  }

  const form: CampaignFormState = campaignForm ?? {
    title: campaign.title,
    protocol: campaign.protocol,
    category: campaign.category,
    description: campaign.description ?? "",
    isActive: campaign.isActive,
    startAt: campaign.startAt ? campaign.startAt.slice(0, 10) : "",
    endAt: campaign.endAt ? campaign.endAt.slice(0, 10) : "",
  };

  async function handleSaveCampaign() {
    if (!campaignForm) return;
    await updateCampaign.mutateAsync(campaignForm);
    setCampaignForm(null);
  }

  async function handleDeleteCampaign() {
    if (!confirm("Delete this campaign?")) return;
    await deleteCampaign.mutateAsync(id);
  }

  async function handleAddTask(data: TaskFormState) {
    let metadata: Record<string, unknown> | undefined;
    try {
      metadata = JSON.parse(data.metadata);
    } catch {
      metadata = undefined;
    }
    await addTask.mutateAsync({ ...data, metadata });
    setAddingTask(false);
  }

  async function handleUpdateTask(taskId: string, data: TaskFormState) {
    let metadata: Record<string, unknown> | undefined;
    try {
      metadata = JSON.parse(data.metadata);
    } catch {
      metadata = undefined;
    }
    await updateTask.mutateAsync({ taskId, data: { ...data, metadata } });
    setEditingTaskId(null);
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm("Delete this task?")) return;
    await deleteTask.mutateAsync(taskId);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          onClick={() => router.push("/admin/quest-campaigns")}
          style={{ background: "none", border: "none", color: "rgba(245,248,252,0.5)", cursor: "pointer", fontSize: 13 }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>{campaign.title}</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        {/* Left panel: campaign form */}
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Campaign Info</h2>
          {(
            [
              { label: "Title", key: "title" as const, type: "text" },
              { label: "Protocol", key: "protocol" as const, type: "text" },
              { label: "Description", key: "description" as const, type: "text" },
              { label: "Start Date", key: "startAt" as const, type: "date" },
              { label: "End Date", key: "endAt" as const, type: "date" },
            ] satisfies { label: string; key: keyof CampaignFormState; type: string }[]
          ).map(({ label, key, type }) => (
            <div key={key}>
              <label style={{ fontSize: 11, color: "rgba(245,248,252,0.4)", display: "block", marginBottom: 4 }}>
                {label}
              </label>
              <input
                type={type}
                value={(form[key] as string) ?? ""}
                onChange={(e) => setCampaignForm({ ...form, [key]: e.target.value })}
                style={inputStyle}
              />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 11, color: "rgba(245,248,252,0.4)", display: "block", marginBottom: 4 }}>
              Category
            </label>
            <select
              value={(form.category as string) ?? "BLEND"}
              onChange={(e) => setCampaignForm({ ...form, category: e.target.value })}
              style={inputStyle}
              aria-label="Category"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={(form.isActive as boolean) ?? true}
              onChange={(e) => setCampaignForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={handleSaveCampaign}
              disabled={updateCampaign.isPending || !campaignForm}
              style={primaryBtnStyle}
            >
              {updateCampaign.isPending ? <Loader2 size={14} className="animate-spin" /> : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleDeleteCampaign}
              disabled={deleteCampaign.isPending}
              style={{
                padding: "8px 16px", borderRadius: 8,
                border: "1px solid rgba(251,113,133,0.3)",
                background: "rgba(251,113,133,0.08)",
                color: "#FB7185", cursor: "pointer", fontSize: 13,
              }}
            >
              Delete Campaign
            </button>
          </div>
        </div>

        {/* Right panel: tasks */}
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>Tasks ({campaign.tasks.length})</h2>
            <button
              type="button"
              onClick={() => setAddingTask(true)}
              disabled={addingTask}
              style={{ ...primaryBtnStyle, display: "flex", alignItems: "center", gap: 6, padding: "6px 12px" }}
            >
              <Plus size={14} /> Add Task
            </button>
          </div>

          {addingTask && (
            <TaskForm
              initial={defaultTaskForm}
              onSave={handleAddTask}
              onCancel={() => setAddingTask(false)}
              isPending={addTask.isPending}
            />
          )}

          {campaign.tasks.length === 0 && !addingTask && (
            <div style={{ color: "rgba(245,248,252,0.3)", fontSize: 13, textAlign: "center", padding: 20 }}>
              No tasks yet
            </div>
          )}

          {campaign.tasks.map((task: QuestTask, idx: number) => (
            <div key={task.id}>
              {editingTaskId === task.id ? (
                <TaskForm
                  initial={{
                    title: task.title,
                    description: task.description ?? "",
                    type: task.type,
                    pointReward: task.pointReward,
                    order: task.order,
                    isActive: task.isActive,
                    metadata: task.metadata ? JSON.stringify(task.metadata, null, 2) : "{}",
                  }}
                  onSave={(data) => handleUpdateTask(task.id, data)}
                  onCancel={() => setEditingTaskId(null)}
                  isPending={updateTask.isPending}
                />
              ) : (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ color: "rgba(245,248,252,0.3)", fontSize: 12, minWidth: 20 }}>{idx + 1}.</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{task.title}</div>
                    <div style={{ fontSize: 11, color: "rgba(245,248,252,0.4)" }}>
                      {task.type} · {task.pointReward} pts
                      {!task.isActive && <span style={{ color: "#FB7185", marginLeft: 6 }}>(inactive)</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingTaskId(task.id)}
                    style={{ background: "none", border: "none", color: "rgba(245,248,252,0.4)", cursor: "pointer" }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    style={{ background: "none", border: "none", color: "rgba(251,113,133,0.6)", cursor: "pointer" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
