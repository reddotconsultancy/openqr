import EditLink from "@/components/EditLink";

export const metadata = { title: "Manage dynamic QR code", robots: { index: false, follow: false } };

export default async function EditPage({ params }) {
  const { id } = await params;
  return <EditLink id={id} />;
}
