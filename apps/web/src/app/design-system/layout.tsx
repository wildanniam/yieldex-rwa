import { WorkspaceShell } from '@/components/WorkspaceShell';
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="id">
      <WorkspaceShell>{children}</WorkspaceShell>
    </div>
  );
}
