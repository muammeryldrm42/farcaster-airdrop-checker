import "./globals.css";

export const metadata = {
  title: "Farcaster Airdrop Checker | Talons Protocol",
  description:
    "Check your estimated Farcaster airdrop allocation based on live on-chain and social data.",
  openGraph: {
    title: "Farcaster Airdrop Checker | Talons Protocol",
    description:
      "Check your estimated $FAR airdrop share based on your Farcaster activity score.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
