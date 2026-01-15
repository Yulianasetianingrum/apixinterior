import { AdminThemeProvider } from "../../../AdminThemeContext";

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="id">
            <body>
                <AdminThemeProvider>
                    {children}
                </AdminThemeProvider>
            </body>
        </html>
    );
}
