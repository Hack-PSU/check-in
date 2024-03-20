import { AxiosResponse, Method } from "axios";
import { api } from "./axios";

type QueryReturn<TResponse> = AxiosResponse<TResponse>;

type PathParams = {
  [key: string]: any;
};

export type CreateQueryReturn<
  TResponse,
  TParams extends PathParams = {},
  TQuery extends object = {}
> = (
  params?: TParams,
  query?: TQuery,
  token?: string
) => Promise<QueryReturn<TResponse>>;

export type CreateMutationReturn<
  TEntity,
  TResponse = TEntity,
  TParams extends PathParams = {},
  TQuery extends object = {}
> = (
  entity: TEntity,
  params?: TParams,
  query?: TQuery,
  token?: string
) => Promise<QueryReturn<TResponse>>;

function replacePathParams(path: string, params: PathParams) {
  const replaceParams = Object.keys(params).reduce((acc, curr) => {
    acc[`:${curr}`] = params[curr] as any;
    return acc;
  }, {} as { [key: string]: any });

  const regex = new RegExp(Object.keys(replaceParams).join("|"), "gi");
  return path.replace(regex, (match) => replaceParams[match]);
}

export function createQuery<
  TResponse,
  TParams extends PathParams = {},
  TQuery extends object = {}
>(url: string): CreateQueryReturn<TResponse, TParams, TQuery> {
  return (params, query, token) => {
    let endpoint = url;

    if (!!params) {
      endpoint = replacePathParams(url, params);
    }

    return api.request<TResponse>({
      url: endpoint,
      method: "GET",
      params: query,
      ...(token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : {}),
    });
  };
}

export function createMutation<
  TEntity,
  TResponse,
  TParams extends PathParams = {},
  TQuery extends object = {}
>(
  url: string,
  method: Method = "POST"
): CreateMutationReturn<TEntity, TResponse, TParams, TQuery> {
  return (entity, params, query, token) => {
    let endpoint = url;

    if (!!params) {
      endpoint = replacePathParams(url, params);
    }

    return api.request<TResponse, QueryReturn<TResponse>, TEntity>({
      url: endpoint,
      method,
      data: entity,
      params: query,
      ...(token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : {}),
    });
  };
}

export async function fetch<TResponse>(
  queryFn: () => Promise<QueryReturn<TResponse>>
): Promise<TResponse | undefined> {
  const resp = await queryFn();
  if (resp && resp.data) {
    return resp.data;
  }
}
