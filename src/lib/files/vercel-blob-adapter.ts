import { put } from "@vercel/blob";
import type { UploadFileAdapter } from "./upload-file";

export const fileAdapter: UploadFileAdapter = {
  uploadFile: async (params) => {
    try {
      const { file, path } = params;
      const filePath = path ? `${path}/${file.name}` : file.name;

      const blob = await put(filePath, file, {
        access: "public",
      });

      return { error: null, data: { url: blob.url } };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error : new Error("Failed to upload file"),
        data: null,
      };
    }
  },
  uploadFiles: async (params) => {
    const promises = params.map(async (param) => {
      try {
        const filePath = param.path
          ? `${param.path}/${param.file.name}`
          : param.file.name;

        const blob = await put(filePath, param.file, {
          access: "public",
        });

        return { error: null, data: { url: blob.url } };
      } catch (error) {
        return {
          error:
            error instanceof Error ? error : new Error("Failed to upload file"),
          data: null,
        };
      }
    });

    return Promise.all(promises);
  },
};
