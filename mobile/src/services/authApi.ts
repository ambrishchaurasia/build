import apiClient from "./apiClient";

export interface ProfileData {
  careerGoal: string;
  semester: number;
  cgpa: number;
  targetPlacementYear: number;
  targetCompanyType: string;
}

export const authApi = {
  signup: async (data: any) => {
    const res = await apiClient.post("/api/auth/signup", data);
    return res.data;
  },

  login: async (data: any) => {
    const res = await apiClient.post("/api/auth/login", data);
    return res.data;
  },

  phoneRequest: async (phone: string) => {
    const res = await apiClient.post("/api/auth/phone-request", { phone });
    return res.data;
  },

  phoneVerify: async (phone: string, code: string) => {
    const res = await apiClient.post("/api/auth/phone-verify", { phone, code });
    return res.data;
  },

  googleLogin: async (data: { email: string; name: string; avatar?: string }) => {
    const res = await apiClient.post("/api/auth/google", data);
    return res.data;
  },

  logout: async () => {
    const res = await apiClient.post("/api/auth/logout");
    return res.data;
  },

  me: async () => {
    const res = await apiClient.get("/api/auth/me");
    return res.data;
  },

  updateProfile: async (profile: ProfileData) => {
    const res = await apiClient.put("/api/user/profile", profile);
    return res.data;
  }
};
