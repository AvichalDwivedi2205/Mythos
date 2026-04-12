import { ReportPage } from "@/components/report-page";

export default async function ReportRoute({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <ReportPage sessionPublicId={sessionId} />;
}
