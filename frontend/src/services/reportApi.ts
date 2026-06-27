import apiClient from "./apiClient";

export const reportApi = {
  getWeeklyReports: async () => {
    const res = await apiClient.get("/api/reports");
    return res.data;
  },

  generateReport: async () => {
    const res = await apiClient.post("/api/reports/generate");
    return res.data;
  }
};
