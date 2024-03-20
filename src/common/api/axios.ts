import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { auth, getEnvironment } from "@/common/config";
import { DateTime } from "luxon";
import { getIdTokenResult, getIdToken, User } from "@firebase/auth";

export type ApiAxiosInstance = AxiosInstance & {
  defaults: {
    headers: {
      authorization?: string;
      exp?: string;
    };
  };
};

type ApiAxiosRequestConfig = AxiosRequestConfig & {
  headers: {
    authorization?: string;
    exp?: string;
  };
};

const config = getEnvironment();

const api = axios.create({
  baseURL: config.baseURL,
}) as ApiAxiosInstance;

const shouldRefreshToken = (config: ApiAxiosRequestConfig) => {
  const token = config.headers.authorization?.split("Bearer ")[0];
  const expiration = config.headers.exp;
  const isExpired =
    DateTime.fromMillis(parseInt(expiration ?? "")) < DateTime.now();

  return isExpired || !token || !expiration;
};

const refreshApiToken = async (config: ApiAxiosRequestConfig) => {
  if (!auth.currentUser) return;
  const tokenResult = await getIdTokenResult(auth.currentUser);

  if (tokenResult) {
    const { token, expirationTime } = tokenResult;
    // required for request retry
    config.headers.authorization = `Bearer ${token}`;

    // for subsequent requests
    api.defaults.headers.common["authorization"] = `Bearer ${token}`;
    api.defaults.headers.common["exp"] = expirationTime;
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const isRefreshNeeded =
      shouldRefreshToken(request) &&
      error.response.status === 401 &&
      !request._retried;

    if (isRefreshNeeded) {
      request._retried = true;
      await refreshApiToken(request);
      return api(request);
    }
    return Promise.reject(error);
  }
);

export const initApi = async (user: User | null) => {
  if (user) {
    const token = await getIdToken(user);
    api.defaults.headers.common["authorization"] = `Bearer ${token}`;
  }
};

export const resetApi = () => {
  delete api.defaults.headers.common["authorization"];
  delete api.defaults.headers.common["exp"];
};

export { api };
