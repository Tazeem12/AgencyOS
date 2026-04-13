import { create } from 'zustand';
import { authFetch } from '@/lib/auth-fetch';
import type {
  ActivityLog,
  Client,
  DashboardStats,
  Project,
  StoreState,
  Task,
  AuthStep,
} from '@/lib/types';

// Auth store for OTP authentication flow
interface AuthStoreState {
  authStep: AuthStep;
  tempEmail: string;
  setAuthStep: (step: AuthStep) => void;
  setTempEmail: (email: string) => void;
  resetAuthState: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  authStep: 'email',
  tempEmail: '',
  setAuthStep: (step) => set({ authStep: step }),
  setTempEmail: (email) => set({ tempEmail: email }),
  resetAuthState: () => set({ authStep: 'email', tempEmail: '' }),
}));

export type { StoreState };

export const useStore = create<StoreState>((set, get) => ({
  clients: [],
  projects: [],
  tasks: [],
  activityLogs: [],
  stats: null,
  currentView: 'dashboard',
  editingClient: null,
  editingProject: null,
  editingTask: null,
  showClientModal: false,
  showProjectModal: false,
  showTaskModal: false,
  selectedProjectId: null,
  loading: false,
  error: null,
  clientSearchQuery: '',
  projectSearchQuery: '',
  statusFilter: '',
  priorityFilter: '',
  taskSearchQuery: '',

  setCurrentView: (view) => set({ currentView: view }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setClientSearchQuery: (query) => set({ clientSearchQuery: query }),
  setProjectSearchQuery: (query) => set({ projectSearchQuery: query }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setPriorityFilter: (priority) => set({ priorityFilter: priority }),
  setTaskSearchQuery: (query) => set({ taskSearchQuery: query }),

  setClients: (clients) => set({ clients }),
  addClient: (client) => {
    set((state) => ({
      clients: [client, ...state.clients],
    }));
  },
  updateClient: (client) => {
    set((state) => ({
      clients: state.clients.map((c) => (c.id === client.id ? client : c)),
    }));
  },
  removeClient: (id) => {
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id),
    }));
  },
  setEditingClient: (client) => set({ editingClient: client }),
  setShowClientModal: (show) => set({ showClientModal: show }),

  setProjects: (projects) => set({ projects }),
  addProject: (project) => {
    set((state) => ({
      projects: [project, ...state.projects],
    }));
  },
  updateProject: (project) => {
    set((state) => ({
      projects: state.projects.map((p) => (p.id === project.id ? project : p)),
    }));
  },
  removeProject: (id) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    }));
  },
  setEditingProject: (project) => set({ editingProject: project }),
  setShowProjectModal: (show) => set({ showProjectModal: show }),
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),

  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => {
    set((state) => ({
      tasks: [task, ...state.tasks],
    }));
  },
  updateTask: (task) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
    }));
  },
  removeTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
  },
  setEditingTask: (task) => set({ editingTask: task }),
  setShowTaskModal: (show) => set({ showTaskModal: show }),

  setActivityLogs: (logs) => set({ activityLogs: logs }),
  setStats: (stats) => set({ stats }),

  fetchClients: async (includeDeleted = false, opts?: { ignoreSearch?: boolean }) => {
    try {
      set({ loading: true });
      const params = new URLSearchParams();
      if (includeDeleted) params.set('includeDeleted', 'true');
      const q = opts?.ignoreSearch ? '' : get().clientSearchQuery.trim();
      if (q) params.set('search', q);
      const url = `/api/clients${params.toString() ? `?${params}` : ''}`;
      const response = await authFetch(url);
      if (!response.ok) throw new Error('Failed to fetch clients');
      const clients = (await response.json()) as Client[];
      set({ clients, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ loading: false, error: message });
    }
  },

  fetchProjects: async (includeDeleted = false) => {
    try {
      set({ loading: true });
      const params = new URLSearchParams();
      if (includeDeleted) params.set('includeDeleted', 'true');
      const { projectSearchQuery, statusFilter } = get();
      const pq = projectSearchQuery.trim();
      if (pq) params.set('search', pq);
      if (statusFilter) params.set('status', statusFilter);
      const url = `/api/projects${params.toString() ? `?${params}` : ''}`;
      const response = await authFetch(url);
      if (!response.ok) throw new Error('Failed to fetch projects');
      const projects = (await response.json()) as Project[];
      set({ projects, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ loading: false, error: message });
    }
  },

  fetchTasks: async (includeDeleted = false) => {
    try {
      set({ loading: true });
      const params = new URLSearchParams();
      if (includeDeleted) params.set('includeDeleted', 'true');
      const { priorityFilter, selectedProjectId, taskSearchQuery } = get();
      if (priorityFilter) params.set('priority', priorityFilter);
      if (selectedProjectId) params.set('projectId', selectedProjectId);
      if (taskSearchQuery.trim()) params.set('search', taskSearchQuery.trim());
      const url = `/api/tasks${params.toString() ? `?${params}` : ''}`;
      const response = await authFetch(url);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const tasks = (await response.json()) as Task[];
      set({ tasks, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ loading: false, error: message });
    }
  },

  fetchActivityLogs: async () => {
    try {
      set({ loading: true });
      const response = await authFetch('/api/activity?limit=100');
      if (!response.ok) throw new Error('Failed to fetch activity logs');
      const logs = (await response.json()) as ActivityLog[];
      set({ activityLogs: logs, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ loading: false, error: message });
    }
  },

  fetchStats: async () => {
    try {
      const response = await authFetch('/api/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const stats = (await response.json()) as DashboardStats;
      set({ stats, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ error: message });
    }
  },
}));
