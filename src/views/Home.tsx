import React from "react";
import { useSelector } from "react-redux";
import { fetchUsers } from "../features/userCache";
import { RootState } from "../reducers";
import { useAppDispatch } from "../store";

export default function Home() {
  const name = useSelector<RootState, string | undefined>(
    (state) => state.auth.user?.name.split(" ")[0]
  );
  const dispatch = useAppDispatch();
  const testUserLoad = () => dispatch(fetchUsers({ userIds: [1, 2] }));

  return (
    <>
      {name ? <p>Hello, {name}.</p> : null}
      <a onClick={testUserLoad}>Load users 1 and 2</a>
    </>
  );
}
