import { Layout } from "antd";
import AppHeader from "./AppHeader";

const { Content, Footer } = Layout;

export default function DefaultLayout({ children }) {
  return (
    <Layout
      className="app-layout"
      style={{
        minHeight: "100vh",
        width: "100%",
      }}
    >
      <AppHeader />

      <Content
        className="page-content"
        style={{
          width: "100%",
          maxWidth: "100%",
          padding: 0,
          margin: 0,
        }}
      >
        {children}
      </Content>

      <Footer
        className="app-footer"
        style={{
          textAlign: "center",
        }}
      >
        Keyhub Store ©2026. Built with React + Ant Design.
      </Footer>
    </Layout>
  );
}