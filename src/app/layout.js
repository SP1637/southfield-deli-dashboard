import "./globals.css";

export const metadata = {
  title: "Southfield Deli — Sales Prediction Dashboard",
  description: "Weather-driven daily sales predictions for Southfield Deli",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
