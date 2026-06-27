import apiClient from "./apiClient";

export interface GoalData {
  category: "CODING" | "PROJECT" | "FITNESS_MIND" | "HABIT";
  title: string;
  description?: string;
  frequency: "DAILY" | "WEEKLY";
}

export const dashboardApi = {
  getDashboard: async () => {
    const res = await apiClient.get("/api/dashboard");
    return res.data;
  },

  syncMetrics: async (data: { githubUsername?: string; leetcodeUsername?: string }) => {
    const res = await apiClient.post("/api/dashboard/sync", data);
    return res.data;
  },

  syncGoogleFit: async (data: { accessToken?: string; steps?: number; workoutMinutes?: number }) => {
    const res = await apiClient.post("/api/dashboard/sync/googlefit", data);
    return res.data;
  },

  disconnectGithub: async () => {
    const res = await apiClient.post("/api/auth/github/disconnect");
    return res.data;
  },

  createGoal: async (goal: GoalData) => {
    const res = await apiClient.post("/api/dashboard/goals", goal);
    return res.data;
  },

  onToggleGoalCallback: null as ((res: any) => void) | null,

  toggleGoal: async (goalId: string) => {
    const res = await apiClient.post(`/api/dashboard/goals/${goalId}/toggle`);
    if (dashboardApi.onToggleGoalCallback) {
      dashboardApi.onToggleGoalCallback(res.data);
    }
    return res.data;
  },

  deleteGoal: async (goalId: string) => {
    const res = await apiClient.delete(`/api/dashboard/goals/${goalId}`);
    return res.data;
  }
};
