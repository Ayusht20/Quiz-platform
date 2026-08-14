import api from "../api/axios";

export const importQuestionsCSV = async (file) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post(
    "/questions/import-csv",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};