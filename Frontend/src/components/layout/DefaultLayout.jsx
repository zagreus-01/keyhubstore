import { Layout } from "antd";
import AppHeader from "./AppHeader";

const { Content, Footer } = Layout;

export default function DefaultLayout({ children }) {
  return (
    <Layout className="app-layout min-h-screen !bg-porcelain text-ink">
      <AppHeader />

      <Content className="page-content mx-auto w-full max-w-[1480px] !px-4 !pb-14 !pt-8 md:!px-6">
        {children}
      </Content>

      <Footer className="app-footer !bg-transparent !px-4 !pb-10 !pt-2">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 rounded-[24px] border border-white/70 bg-white/70 px-5 py-4 text-sm text-slate-500 shadow-premium-soft backdrop-blur md:flex-row">
          <span className="font-semibold text-slate-700">Keyhub Store ©2026</span>
          <span>Premium tech retail powered by React + Ant Design.</span>
        </div>
      </Footer>
    </Layout>
  );
}
