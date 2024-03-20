export enum QueryScope {
  ALL = "all",
  NEW = "new",
  ID = "byId",
}

export enum QueryAction {
  query = "get",
  create = "create",
  update = "update",
  updateBatch = "updateBatch",
  delete = "delete",
}

export type QueryEntity<TEntity> = { entity: TEntity };
