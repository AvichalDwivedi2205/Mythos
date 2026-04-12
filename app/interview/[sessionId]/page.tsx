import { InterviewRoom } from "@/components/interview-room";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <InterviewRoom sessionPublicId={sessionId} />;
}
