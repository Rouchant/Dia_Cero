import { ModuleViewer } from '@/components/module/ModuleViewer';

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ModuleViewer moduleId={id} />;
}
