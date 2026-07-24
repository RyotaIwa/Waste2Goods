// Core Types for Waste2Goods Platform (aligned with ER diagram)

// Platform Types
export type Platform = "mobile" | "admin" | "kiosk";

// New Models from ER Diagram
export interface Role {
  roleId: number; // Primary Key
  roleName: string; // Unique
  description?: string;
}

export interface Barangay {
  barangayId: number; // Primary Key
  barangayName: string;
  street?: string;
  province?: string;
  city?: string;
  contactNumber?: string;
}

export interface Administrator {
  adminId: string; // Primary Key, Foreign Key to User
  adminIdentifier: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  createdAt: string;
  barangayId: number; // Foreign Key to Barangay
}

export interface UserRecyclingTask {
  userTaskId: number; // Primary Key
  userId: string; // Foreign Key to User
  taskId: number; // Foreign Key to RecyclingTask
  progress?: number;
  completedAt?: string;
}

// Updated User/Resident Types
export interface User {
  userId: string; // Primary Key
  firstName: string;
  lastName: string;
  email: string; // Unique
  passwordHash: string;
  barangayId: number; // Foreign Key to Barangay
  pointsBalance: number;
  totalSubmissions: number;
  createdAt: string;
  collectionCoords?: string;
  status: "active" | "inactive";
}

export interface LeaderboardUser {
  rank: number;
  name: string; // First + Last
  barangay: string;
  points: number;
  avatar: string;
  streak: number;
  isMe?: boolean;
}

// Waste/Submission Types (RecyclableMaterial, RecyclingTransaction)
export interface RecyclableMaterial {
  materialId: number; // Primary Key
  materialName: string;
  pointsPerKg: number;
  description?: string;
}

export interface RecyclingTransaction {
  transactionId: string; // Primary Key
  userId: string; // Foreign Key to User
  materialId: number; // Foreign Key to RecyclableMaterial
  weightKg: number;
  pointsEarned: number;
  kioskId: string; // Foreign Key to Kiosk
  timestamp: string;
}

// Keep original Submission/WasteType for compatibility
export interface WasteType {
  name: string;
  value: number;
  color: string;
}

export interface Submission {
  id: string;
  userId: string;
  kioskId: string;
  type: string;
  weightKg: number;
  pointsAwarded: number;
  timestamp: string;
}

// Updated Reward Types (Reward, RewardRedemption)
export interface Reward {
  rewardId: number; // Primary Key
  rewardName: string;
  description?: string;
  pointsCost: number;
  stockQuantity: number;
  createdAt: string;
  // Keep original fields for compatibility
  category?: string;
  icon?: string;
  seasonal?: boolean;
}

export interface RewardRedemption {
  redemptionId: number; // Primary Key
  userId: string; // Foreign Key to User
  rewardId: number; // Foreign Key to Reward
  quantityRedeemed: number;
  pointsUsed: number;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string; // Foreign Key to Administrator (optional)
  redemptionAt: string;
}

// Keep original Redemption for compatibility
export interface Redemption {
  id: string;
  userId: string;
  rewardId: number;
  pointsSpent: number;
  timestamp: string;
}

// Transaction Types (keep original for compatibility)
export interface Transaction {
  id: string;
  date: string;
  type: "earn" | "redeem" | "bonus";
  desc: string;
  pts: number;
}

// Kiosk/IoT Types (keep original for compatibility)
export interface Kiosk {
  kioskId: string; // Primary Key (align with ER)
  location: string;
  status: "online" | "offline" | "maintenance";
  weight: string;
  submissions: number;
  battery: number;
  lastPing: string;
  temp: string;
  // Keep original id field for compatibility
  id?: string;
}

// Updated Task/Gamification Types (RecyclingTask)
export interface RecyclingTask {
  taskId: number; // Primary Key
  taskName: string;
  description?: string;
  bonusPoints: number;
  startDate?: string;
  endDate?: string;
  status: "active" | "inactive";
}

// Keep original Task for compatibility
export interface Task {
  id: number;
  title: string;
  reward: number;
  progress: number;
  goal: number;
  unit: string;
  type: "daily" | "weekly" | "special";
  done: boolean;
}

// Analytics Types (keep original for compatibility)
export interface WeeklyData {
  day: string;
  kg: number;
}

export interface MonthlyData {
  month: string;
  collected: number;
  users: number;
  redeemed: number;
}

export interface PointRate {
  type: string;
  pointsPerKg: number;
  color: string;
}

export const rewardCategories = ["All", "Education", "Grocery", "Lifestyle", "Garden", "Wellness"];

// Auth Types (keep original for compatibility)
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "resident" | "kiosk";
  barangay?: string;
  points?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
}
