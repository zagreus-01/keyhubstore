import { Layout } from "antd";
import AppHeader from "./AppHeader";

const { Content, Footer } = Layout;

export default function DefaultLayout({ children }) {
  return (
    <Layout className="app-layout">
      <AppHeader />
      <Content className="page-content">{children}</Content>
      <Footer className="app-footer">Keyhub Store ©2026. Built with React + Ant Design.</Footer>
    </Layout>
  );
}
