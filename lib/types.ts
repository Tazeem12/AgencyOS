export type ViewType = 'dashboard' | 'clients' | 'projects' | 'kanban' | 'activity' | 'trash';

export type AuthStep = 'email' | 'otp' | 'loading';

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  userId: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'planning' | 'active' | 'completed';
  clientId: string;
  clientName: string;
  clientCompany?: string;
  userId: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  projectId: string;
  projectTitle?: string;
  clientName?: string;
  userId: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardStats {
  clients: { total: number };
  projects: {
    total: number;
    completed: number;
    active: number;
    planning: number;
  };
  tasks: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    byPriority: { high: number; medium: number; low: number };
  };
}

export interface StoreState {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  activityLogs: ActivityLog[];
  stats: DashboardStats | null;
  currentView: ViewType;
  editingClient: Client | null;
  editingProject: Project | null;
  editingTask: Task | null;
  showClientModal: boolean;
  showProjectModal: boolean;
  showTaskModal: boolean;
  selectedProjectId: string | null;
  loading: boolean;
  error: string | null;
  /** Clients list search (trimmed when sent to API) */
  clientSearchQuery: string;
  /** Projects list search (trimmed when sent to API) */
  projectSearchQuery: string;
  statusFilter: string;
  priorityFilter: string;
  /** Task title search (Kanban / task lists; not mixed with client/project search) */
  taskSearchQuery: string;
  setCurrentView: (view: ViewType) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setClientSearchQuery: (query: string) => void;
  setProjectSearchQuery: (query: string) => void;
  setStatusFilter: (status: string) => void;
  setPriorityFilter: (priority: string) => void;
  setTaskSearchQuery: (query: string) => void;
  setClients: (clients: Client[]) => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  removeClient: (id: string) => void;
  setEditingClient: (client: Client | null) => void;
  setShowClientModal: (show: boolean) => void;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  removeProject: (id: string) => void;
  setEditingProject: (project: Project | null) => void;
  setShowProjectModal: (show: boolean) => void;
  setSelectedProjectId: (id: string | null) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  removeTask: (id: string) => void;
  setEditingTask: (task: Task | null) => void;
  setShowTaskModal: (show: boolean) => void;
  setActivityLogs: (logs: ActivityLog[]) => void;
  setStats: (stats: DashboardStats) => void;
  fetchClients: (includeDeleted?: boolean, opts?: { ignoreSearch?: boolean }) => Promise<void>;
  fetchProjects: (includeDeleted?: boolean) => Promise<void>;
  fetchTasks: (includeDeleted?: boolean) => Promise<void>;
  fetchActivityLogs: () => Promise<void>;
  fetchStats: () => Promise<void>;
}
