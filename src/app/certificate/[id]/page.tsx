import CertificateClient from './CertificateClient';

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CertificateClient moduleId={id} />;
}
