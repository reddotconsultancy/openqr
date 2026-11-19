export const metadata = { title: "Privacy and rules" };

export default function Privacy() {
  return (
    <div className="panel narrow prose">
      <h1>Privacy and rules</h1>

      <h2>Static QR codes</h2>
      <p>Static codes are made in your browser. The content and any logo you upload never leave your device.</p>

      <h2>Dynamic QR codes</h2>
      <p>
        When you create a dynamic code we store the destination address, the date it was created and changed, and a count of scans. We store a
        one-way hash of your edit link, not the link itself, so we cannot recover it for you. We do not store names, emails or anything about
        the people who scan your code.
      </p>
      <p>
        To limit abuse, we count requests per network for up to one hour. We do this with a one-way hash of the IP address and never save the
        address itself.
      </p>
      <p>Your list of dynamic codes is saved in your own browser storage. Clearing your browser data removes that list.</p>

      <h2>Rules for dynamic links</h2>
      <p>
        Dynamic links must not point to phishing, scams, malware, adult content, illegal goods or anything that breaks the law. Links that
        break these rules are disabled without notice. You can <a href="/report">report a link</a> at any time.
      </p>

      <h2>No guarantee</h2>
      <p>
        This is a free, community-run project, provided as is. Dynamic codes depend on this website staying online. For anything critical,
        use a static code, or host your own copy using the open-source code.
      </p>
    </div>
  );
}
