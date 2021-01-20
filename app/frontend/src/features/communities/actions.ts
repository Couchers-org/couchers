import { createAsyncThunk } from "@reduxjs/toolkit";
import { service } from "../../service";

export const createPage = createAsyncThunk(
  "pages/createPage",
  async ({
    title,
    content,
    address,
    lat,
    lng
  }:
    {
    title: string;
    content: string;
    address: string;
    lat: number;
    lng: number;
  }) => {
    const page = await service.pages.createPage(
      title,
      content,
      address,
      lat,
      lng
    )

    return page;
  }
);

export const getPage = createAsyncThunk(
  "pages/getPage",
  async (pageId: number) => {
    return await service.pages.getPage(pageId)
  }
)
