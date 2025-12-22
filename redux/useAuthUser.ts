// lib/store/useAuthUser.ts

import { createSelector } from "reselect";
import { useAppSelector } from "./hooks";

const selectAuthUser = createSelector(
  [(state) => state.auth.user],
  (user) => ({
    ...user,
   
  })
);

export const useAuthUser = () => useAppSelector(selectAuthUser);
