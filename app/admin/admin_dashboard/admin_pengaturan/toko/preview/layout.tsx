import { AdminThemeProvider } from "../../../AdminThemeContext";

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminThemeProvider>
            {children}
        </AdminThemeProvider>
    );
}
