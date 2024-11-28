import {
  Refine,
  type AuthProvider,
  Authenticated,
} from "@refinedev/core";
import {
  useNotificationProvider,
  ThemedLayoutV2,
  ErrorComponent,
  AuthPage,
  RefineThemes,
  ThemedTitleV2,
} from "@refinedev/antd";
import {
  GoogleOutlined,
  GithubOutlined,
  DashboardOutlined,
  CrownOutlined
} from "@ant-design/icons";

import dataProvider from "@refinedev/simple-rest";
import routerProvider, {
  NavigateToResource,
  CatchAllNavigate,
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router-v6";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { App as AntdApp, ConfigProvider } from "antd";

import "@refinedev/antd/dist/reset.css";

import { DriverList } from "../src/pages/drivers";
import { SessionList, SessionPage } from "../src/pages/races";
import { DashboardPage } from "../src/pages/dashboard";
import { HomePage } from "@/pages/home";

import StandingTable from "./pages/standing/standing-table";

const API_URL = "https://api.openf1.org/v1"

/**
 *  mock auth credentials to simulate authentication
 */
const authCredentials = {
  email: "demo@refine.dev",
  password: "demodemo",
};

const App: React.FC = () => {
  const authProvider: AuthProvider = {
    login: async ({ providerName, email }) => {
      if (providerName === "google") {
        window.location.href = "https://accounts.google.com/o/oauth2/v2/auth";
        return {
          success: true,
        };
      }

      if (providerName === "github") {
        window.location.href = "https://github.com/login/oauth/authorize";
        return {
          success: true,
        };
      }

      if (email === authCredentials.email) {
        localStorage.setItem("email", email);
        return {
          success: true,
          redirectTo: "/",
        };
      }

      return {
        success: false,
        error: {
          message: "Login failed",
          name: "Invalid email or password",
        },
      };
    },
    register: async (params) => {
      if (params.email === authCredentials.email && params.password) {
        localStorage.setItem("email", params.email);
        return {
          success: true,
          redirectTo: "/",
        };
      }
      return {
        success: false,
        error: {
          message: "Register failed",
          name: "Invalid email or password",
        },
      };
    },
    updatePassword: async (params) => {
      if (params.password === authCredentials.password) {
        //we can update password here
        return {
          success: true,
        };
      }
      return {
        success: false,
        error: {
          message: "Update password failed",
          name: "Invalid password",
        },
      };
    },
    forgotPassword: async (params) => {
      if (params.email === authCredentials.email) {
        //we can send email with reset password link here
        return {
          success: true,
        };
      }
      return {
        success: false,
        error: {
          message: "Forgot password failed",
          name: "Invalid email",
        },
      };
    },
    logout: async () => {
      localStorage.removeItem("email");
      return {
        success: true,
        redirectTo: "/login",
      };
    },
    onError: async (error) => {
      if (error.response?.status === 401) {
        return {
          logout: true,
        };
      }

      return { error };
    },
    check: async () =>
      localStorage.getItem("email")
        ? {
          authenticated: true,
        }
        : {
          authenticated: false,
          error: {
            message: "Check failed",
            name: "Not authenticated",
          },
          logout: true,
          redirectTo: "/login",
        },
    getPermissions: async (params) => params?.permissions,
    getIdentity: async () => ({
      id: 1,
      name: "Jane Doe",
      avatar:
        "https://unsplash.com/photos/IWLOvomUmWU/download?force=true&w=640",
    }),
  };

  const CustomThemeLayout: React.FC = () => {
    return (
      <ThemedLayoutV2 Title={({ collapsed }) => (
        <ThemedTitleV2
          collapsed={collapsed}
          text="Formula 1 Dashboard"
        />
      )}>
        <Outlet />
      </ThemedLayoutV2>
    )
  }

  return (
    <BrowserRouter>
      <ConfigProvider theme={RefineThemes.Blue}>
        <AntdApp>
          <Refine
            // authProvider={authProvider}
            dataProvider={dataProvider(API_URL)}
            routerProvider={routerProvider}
            resources={[
              {
                name: "Home",
                list: "/",
                meta: {
                  label: "Home",
                  icon: <DashboardOutlined />,
                },
              },
              {
                name: "standing",
                list: "/standings",
                meta: {
                  label: "Standing",
                  icon: <CrownOutlined />,
                },
              },
              {
                name: "Races",
                list: "/sessions",
              },
              {
                name: "Drivers",
                list: "/drivers",

              },

            ]}
            notificationProvider={useNotificationProvider}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
              title: {
                text: "Formula 1 Dashboard"
              }
            }}

          >
            <Routes>
              <Route
                element={
                  <CustomThemeLayout />
                }
              >
                <Route index element={<HomePage />} />
                <Route path="/sessions">
                  <Route index element={<SessionList />} />
                  <Route path="show/:session_key" element={<SessionPage />} />

                </Route>

                <Route path="/drivers">
                  <Route index element={<DriverList />} />
                </Route>

                <Route path="/standings">
                  <Route index element={<StandingTable />} />
                </Route>

              </Route>



              <Route
                element={
                  <Authenticated key="catch-all">
                    <CustomThemeLayout />
                  </Authenticated>
                }
              >
                <Route path="*" element={<ErrorComponent />} />
              </Route>
            </Routes>
            <UnsavedChangesNotifier />
            <DocumentTitleHandler />
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
};

export default App;
