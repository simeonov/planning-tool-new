export type User = {
  id: string;
  name: string;
  role: 'Estimator' | 'Observer';
  socketId?: string;
};
