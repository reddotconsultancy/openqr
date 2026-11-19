import ReportForm from "@/components/ReportForm";

export const metadata = { title: "Report a dynamic QR link" };

export default function ReportPage() {
  return (
    <div className="panel narrow">
      <h1>Report a link</h1>
      <p>
        If a QR code made on this site sends people to a scam, phishing, malware or illegal page, tell us here. We review reports and disable
        links that break the rules.
      </p>
      <ReportForm />
    </div>
  );
}
